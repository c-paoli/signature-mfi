/*
 * Gestionnaires d'événements du complément « Signature MFI ».
 *
 *   OnNewMessageCompose  -> onNewMessageComposeHandler  (nouveau mail, réponse, transfert)
 *   OnMessageFromChanged -> onMessageFromChangedHandler (changement du « De », ex. boîte SAV)
 *   Bouton « Signature MFI » -> insererSignatureMfi     (secours manuel, ex. brouillon agrandi)
 *
 * Déroulement :
 *   1. lire l'adresse du « De » ;
 *   2. lire la fiche Entra de l'utilisateur via Microsoft Graph (NAA + MSAL, jeton silencieux) ;
 *      en cas d'échec : dernières données connues (cache local), sinon nom du profil Outlook ;
 *      si le « De » est une boîte partagée, lire aussi sa fiche Entra (titre, téléphones) en parallèle ;
 *   3. insérer le logo en pièce jointe incorporée ;
 *   4. désactiver la signature du client Outlook et poser la signature MFI ;
 *   5. event.completed() dans tous les cas.
 *
 * Ne jamais bloquer la rédaction : toute erreur est journalisée puis on continue.
 * Les console.log sont visibles dans le journal d'exécution du complément.
 *
 * Dépendances chargées avant ce fichier par commands.html :
 *   Office.js, lib/msal-browser-*.min.js (global « msal »), config.js, logo.js, signature.js
 */

/* global Office, msal, SIGNATURE_MFI_CONFIG, LOGO_MFI_BASE64, SignatureMFI */

var JOURNAL = "[Signature MFI]";
var CLE_SESSION_LOGO = "signatureMfiLogo";
var GRAPH_ME =
  "https://graph.microsoft.com/v1.0/me?$select=givenName,surname,displayName,jobTitle,businessPhones,mobilePhone,mail";

Office.onReady(function () {});

/* ------------------------------------------------------------------ */
/* Outils                                                             */
/* ------------------------------------------------------------------ */

function journal() {
  try {
    var args = Array.prototype.slice.call(arguments);
    args.unshift(JOURNAL);
    console.log.apply(console, args);
  } catch (e) {
    /* rien */
  }
}

/** Transforme un appel Office.js à callback en promesse. */
function officeAsync(appel) {
  return new Promise(function (resoudre, rejeter) {
    try {
      appel(function (r) {
        if (r.status === Office.AsyncResultStatus.Succeeded) resoudre(r.value);
        else rejeter(r.error || new Error("Échec Office.js"));
      });
    } catch (e) {
      rejeter(e);
    }
  });
}

function avecDelai(promesse, ms, libelle) {
  return new Promise(function (resoudre, rejeter) {
    var minuteur = setTimeout(function () {
      rejeter(new Error("Délai dépassé : " + libelle));
    }, ms);
    promesse.then(
      function (v) {
        clearTimeout(minuteur);
        resoudre(v);
      },
      function (e) {
        clearTimeout(minuteur);
        rejeter(e);
      }
    );
  });
}

function estMarqueur(valeur) {
  return !valeur || /^<.*>$/.test(String(valeur));
}

function minuscules(adresse) {
  return String(adresse || "").trim().toLowerCase();
}

/* ------------------------------------------------------------------ */
/* Lecture des données Entra (Graph via NAA)                          */
/* ------------------------------------------------------------------ */

var clientMsal = null;

function obtenirClientMsal() {
  if (clientMsal) return clientMsal;
  var cfg = SIGNATURE_MFI_CONFIG;
  clientMsal = msal.createNestablePublicClientApplication({
    auth: {
      clientId: cfg.clientId,
      authority: "https://login.microsoftonline.com/" + cfg.tenantId
    }
  });
  // En cas d'échec, permettre une nouvelle tentative au prochain événement
  clientMsal.catch(function () {
    clientMsal = null;
  });
  return clientMsal;
}

/**
 * Appel Graph GET avec un jeton NAA silencieux.
 * @param {string} url
 * @param {string[]} scopes  ["User.Read"] pour /me, ["User.Read.All"] pour la fiche d'une boîte partagée
 */
async function appelGraph(url, scopes) {
  var cfg = SIGNATURE_MFI_CONFIG;
  if (estMarqueur(cfg.clientId) || estMarqueur(cfg.tenantId)) {
    throw new Error("ID client ou ID de tenant non renseigné dans config.js");
  }
  if (!Office.context.requirements.isSetSupported("NestedAppAuth", "1.1")) {
    throw new Error("NAA (NestedAppAuth 1.1) non pris en charge par ce client Outlook");
  }
  if (typeof msal === "undefined" || !msal.createNestablePublicClientApplication) {
    throw new Error("MSAL non chargé");
  }

  var pca = await obtenirClientMsal();
  // Pas d'interface possible dans un gestionnaire d'événement : jeton silencieux uniquement.
  var jeton = await pca.acquireTokenSilent({ scopes: scopes });
  if (!jeton || !jeton.accessToken) throw new Error("Jeton vide");

  var reponse = await fetch(url, {
    headers: { Authorization: "Bearer " + jeton.accessToken }
  });
  if (!reponse.ok) {
    throw new Error("Graph : HTTP " + reponse.status + " " + (await reponse.text()));
  }
  return await reponse.json();
}

function lireGraph() {
  return appelGraph(GRAPH_ME, ["User.Read"]);
}

/**
 * Fiche Entra d'une boîte partagée (téléphones, nom affiché), recherchée par son adresse.
 * Nécessite la permission déléguée User.Read.All (consentement administrateur).
 */
async function lireFicheBoite(adresse) {
  var filtre = "mail eq '" + minuscules(adresse).replace(/'/g, "''") + "'";
  var url =
    "https://graph.microsoft.com/v1.0/users?$filter=" + encodeURIComponent(filtre) +
    "&$select=displayName,jobTitle,businessPhones,mobilePhone,mail";
  var resultat = await appelGraph(url, ["User.Read.All"]);
  var fiche = resultat && resultat.value && resultat.value[0];
  if (!fiche) throw new Error("Aucune fiche Entra pour " + adresse);
  return fiche;
}

function cleCache(adresse) {
  return "signature-mfi:entra:" + minuscules(adresse || Office.context.mailbox.userProfile.emailAddress);
}

function lireCache(adresse) {
  try {
    var brut = window.localStorage.getItem(cleCache(adresse));
    if (!brut) return null;
    var entree = JSON.parse(brut);
    if (!entree || !entree.date || Date.now() - entree.date > SIGNATURE_MFI_CONFIG.dureeCacheMs) return null;
    return entree.donnees;
  } catch (e) {
    return null;
  }
}

function ecrireCache(donnees, adresse) {
  try {
    window.localStorage.setItem(cleCache(adresse), JSON.stringify({ date: Date.now(), donnees: donnees }));
  } catch (e) {
    /* stockage indisponible : sans importance */
  }
}

/** Renvoie toujours une « personne » exploitable, quoi qu'il arrive. */
async function lirePersonne() {
  try {
    var g = await avecDelai(lireGraph(), SIGNATURE_MFI_CONFIG.delaiGraphMs, "Graph");
    ecrireCache(g);
    journal("Données Entra lues via Graph.");
    return SignatureMFI.depuisGraph(g);
  } catch (e) {
    journal("Graph indisponible, repli :", e && e.message ? e.message : e);
  }

  var enCache = lireCache();
  if (enCache) {
    journal("Utilisation des dernières données Entra connues (cache local).");
    return SignatureMFI.depuisGraph(enCache);
  }

  // Repli minimal : nom et adresse du profil Outlook, sans fonction ni téléphone.
  var profil = Office.context.mailbox.userProfile;
  journal("Repli sur le profil Outlook.");
  return SignatureMFI.depuisGraph({ displayName: profil.displayName, mail: profil.emailAddress });
}

/**
 * Complète la variante boîte partagée avec sa fiche Entra : titre (« Poste », sinon
 * nom complet) et téléphones. Ce qui est forcé dans config.js reste prioritaire.
 * En cas d'échec : dernières données connues (cache local), sinon nom affiché du « De »
 * et pas de téléphone. Ne lève jamais d'erreur.
 */
async function completerBoite(boite) {
  if (!boite || (boite.telephone && boite.libelleConfigure)) return boite; // tout est forcé dans config.js
  var fiche = null;
  try {
    fiche = await avecDelai(lireFicheBoite(boite.adresse), SIGNATURE_MFI_CONFIG.delaiGraphMs, "Graph (boîte)");
    ecrireCache(fiche, boite.adresse);
    journal("Fiche Entra de la boîte lue via Graph :", boite.adresse);
  } catch (e) {
    journal("Fiche Entra de la boîte indisponible :", e && e.message ? e.message : e);
    fiche = lireCache(boite.adresse);
    if (fiche) journal("Utilisation des dernières données connues de la boîte (cache local).");
  }
  if (fiche) {
    if (!boite.telephone) boite.telephones = SignatureMFI.telephonesGraph(fiche);
    // Titre : « Poste » (jobTitle) de la fiche si rempli, sinon son nom complet (sauf titre forcé dans config.js).
    if (!boite.libelleConfigure) boite.libelle = fiche.jobTitle || fiche.displayName || boite.libelle;
  }
  return boite;
}

/* ------------------------------------------------------------------ */
/* Choix de la variante (utilisateur / boîte partagée)                */
/* ------------------------------------------------------------------ */

async function lireExpediteur(item) {
  try {
    var de = await officeAsync(function (cb) {
      item.from.getAsync(cb);
    });
    return { adresse: minuscules(de.emailAddress), nom: de.displayName || "" };
  } catch (e) {
    journal("Lecture du « De » impossible :", e && e.message);
    return { adresse: minuscules(Office.context.mailbox.userProfile.emailAddress), nom: "" };
  }
}

/** null = signature personnelle ; sinon objet « boîte » pour la variante. */
function determinerBoite(expediteur) {
  var moi = minuscules(Office.context.mailbox.userProfile.emailAddress);
  if (!expediteur.adresse || expediteur.adresse === moi) return null;

  var connues = SIGNATURE_MFI_CONFIG.boitesPartagees || {};
  for (var adresse in connues) {
    if (Object.prototype.hasOwnProperty.call(connues, adresse) && minuscules(adresse) === expediteur.adresse) {
      var b = connues[adresse];
      return {
        adresse: expediteur.adresse,
        libelle: b.libelle || expediteur.nom || expediteur.adresse,
        libelleConfigure: !!b.libelle,
        telephone: b.telephone || "",
        afficherNomUtilisateur: b.afficherNomUtilisateur !== false
      };
    }
  }

  // Boîte non configurée (autre boîte partagée, délégation) : variante générique.
  return {
    adresse: expediteur.adresse,
    libelle: expediteur.nom || expediteur.adresse,
    telephone: "",
    afficherNomUtilisateur: true
  };
}

/* ------------------------------------------------------------------ */
/* Logo en pièce jointe incorporée                                    */
/* ------------------------------------------------------------------ */

function lireSession(item, cle) {
  if (!item.sessionData || !item.sessionData.getAsync) return Promise.resolve(null);
  return officeAsync(function (cb) {
    item.sessionData.getAsync(cle, cb);
  }).catch(function () {
    return null;
  });
}

function ecrireSession(item, cle, valeur) {
  if (!item.sessionData || !item.sessionData.setAsync) return Promise.resolve();
  return officeAsync(function (cb) {
    item.sessionData.setAsync(cle, valeur, cb);
  }).catch(function () {});
}

/**
 * Ajoute le logo une seule fois par mail et renvoie son nom (référencé en cid:).
 * Le nom est unique par mail pour ne pas entrer en collision avec le logo
 * d'une signature MFI présente dans le message cité (réponse à un collègue).
 */
async function assurerLogo(item) {
  var existant = await lireSession(item, CLE_SESSION_LOGO);
  if (existant) return existant;

  var nom = "logo-mfi-" + Math.random().toString(36).slice(2, 10) + ".png";
  await officeAsync(function (cb) {
    item.addFileAttachmentFromBase64Async(LOGO_MFI_BASE64, nom, { isInline: true }, cb);
  });
  await ecrireSession(item, CLE_SESSION_LOGO, nom);
  return nom;
}

/* ------------------------------------------------------------------ */
/* Traitement commun                                                  */
/* ------------------------------------------------------------------ */

/** Petit bandeau d'information en haut du mail (bouton uniquement). Ne lève jamais d'erreur. */
function notifier(item, message) {
  try {
    if (!item || !item.notificationMessages) return Promise.resolve();
    return officeAsync(function (cb) {
      item.notificationMessages.replaceAsync(
        "signatureMfi",
        {
          type: Office.MailboxEnums.ItemNotificationMessageType.InformationalMessage,
          message: message,
          icon: "Icon.16x16",
          persistent: false
        },
        cb
      );
    }).catch(function (e) {
      journal("Notification impossible :", e && e.message);
    });
  } catch (e) {
    return Promise.resolve();
  }
}

/**
 * @param {object}  event             événement Office (completed() appelé dans tous les cas)
 * @param {string}  origine           libellé pour le journal
 * @param {boolean} avecNotification  afficher un bandeau de confirmation (bouton)
 */
async function poserSignature(event, origine, avecNotification) {
  var item = null;
  var fini = false;
  function terminer() {
    if (fini) return;
    fini = true;
    try {
      event.completed();
    } catch (e) {
      journal("event.completed a échoué :", e && e.message);
    }
  }
  // Filet de sécurité : Outlook coupe le complément à 60 s.
  var garde = setTimeout(function () {
    journal("Délai de sécurité atteint, fin du traitement.");
    terminer();
  }, 50000);

  try {
    item = Office.context.mailbox.item;
    journal("Événement :", origine);

    var expediteur = await lireExpediteur(item);
    // Fiche de l'utilisateur et, le cas échéant, fiche de la boîte partagée : lues en parallèle.
    var lectures = await Promise.all([lirePersonne(), completerBoite(determinerBoite(expediteur))]);
    var personne = lectures[0];
    var boite = lectures[1];

    var nomLogo = null;
    try {
      nomLogo = await assurerLogo(item);
    } catch (e) {
      journal("Logo non inséré :", e && e.message);
    }

    var html = SignatureMFI.construire(personne, SIGNATURE_MFI_CONFIG, boite, nomLogo);
    if (!nomLogo) {
      // Sans pièce jointe, retirer l'image plutôt que d'afficher une image cassée.
      html = html.replace(/<img [^>]*>/, "");
    }

    if (item.disableClientSignatureAsync) {
      try {
        await officeAsync(function (cb) {
          item.disableClientSignatureAsync(cb);
        });
      } catch (e) {
        journal("disableClientSignatureAsync :", e && e.message);
      }
    }

    await officeAsync(function (cb) {
      item.body.setSignatureAsync(html, { coercionType: Office.CoercionType.Html }, cb);
    });
    journal("Signature posée (" + (boite ? "boîte " + boite.adresse : "personnelle") + ").");
    if (avecNotification) {
      await notifier(item, "Signature MFI mise à jour (" + (boite ? boite.adresse : "signature personnelle") + ").");
    }
  } catch (e) {
    journal("Erreur :", e && e.message ? e.message : e);
    if (avecNotification) await notifier(item, "Signature MFI : la mise à jour a échoué.");
  } finally {
    clearTimeout(garde);
    terminer();
  }
}

function onNewMessageComposeHandler(event) {
  poserSignature(event, "OnNewMessageCompose");
}

function onMessageFromChangedHandler(event) {
  poserSignature(event, "OnMessageFromChanged");
}

/** Bouton « Signature MFI » (menu Applications en rédaction) : remet la signature du « De » actuel. */
function insererSignatureMfi(event) {
  poserSignature(event, "Bouton Signature MFI", true);
}

// Association obligatoire entre les noms du manifeste et les fonctions JavaScript.
Office.actions.associate("onNewMessageComposeHandler", onNewMessageComposeHandler);
Office.actions.associate("onMessageFromChangedHandler", onMessageFromChangedHandler);
Office.actions.associate("insererSignatureMfi", insererSignatureMfi);
