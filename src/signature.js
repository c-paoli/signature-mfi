/*
 * Construction du HTML de la signature MFI.
 *
 * Fonctions pures (aucun appel Office ni réseau) : utilisables dans le complément,
 * dans la page d'aperçu (index.html) et dans les tests Node (tests/signature.test.js).
 *
 * Modèle (validé par Cédric le 20/11/2026, tailles revues le 23/11/2026 :
 * nom 12 pt, fonction 9 pt, téléphones / mail 9 pt, adresse et site 8 pt) :
 *
 *   Cordialement
 *
 *
 *                ┃ PRÉNOM NOM                        gras, grand, gris foncé
 *                ┃ FONCTION                          gras, petit, couleur MFI
 *   [ logo MFI ] ┃ ● téléphone(s)                    puce couleur MFI
 *    (centré)    ┃ ● mail                            lien souligné
 *                ┃ ROUTE DE STRADA VECCHJA – BOX 1&2 petit, gris
 *                ┃ 20290 BORGO
 *                ┃ www.mfi.corsica                   lien gras couleur MFI
 *
 * Le logo et le bloc de texte sont centrés verticalement l'un par rapport à l'autre ;
 * le trait vertical va exactement du nom jusqu'au site web.
 * Une ligne dont la donnée est vide n'est pas affichée.
 */
var SignatureMFI = (function () {
  "use strict";

  // Police de la signature d'origine (Aptos, police par défaut de Microsoft 365),
  // avec replis si elle n'est pas disponible chez le destinataire.
  var POLICE = "Aptos,Aptos_EmbeddedFont,Aptos_MSFontService,Calibri,Helvetica,Arial,sans-serif";

  // Styles de chaque type de ligne (la couleur MFI est ajoutée à partir de la config).
  var STYLES = {
    nom: "font-size:12pt;font-weight:bold;color:#222222;letter-spacing:0.3px;",
    fonction: "font-size:9pt;font-weight:bold;letter-spacing:0.5px;", // + couleur MFI
    contact: "font-size:9pt;color:#333333;line-height:160%;",
    adresse: "font-size:8pt;color:#666666;line-height:170%;",
    site: "font-size:8pt;font-weight:bold;"
  };

  // Espace entre le nom et la fonction, puis sous chaque bloc de la colonne de droite
  var ESPACE_SOUS_NOM = "3pt";
  var ESPACE_APRES_IDENTITE = "8pt";
  var ESPACE_APRES_CONTACT = "2pt";
  var ESPACE_APRES_ADRESSE = "7pt";

  // Largeurs fixes (px) : espace entre le logo et le trait, espace entre le trait et le texte,
  // et colonne de texte (espace trait-texte compris). Tableau total : 560 px.
  var LARGEUR_ESPACE = 40;
  var ESPACE_TRAIT_TEXTE = 32; // = 24 pt
  var LARGEUR_TEXTE = 270;

  function echapper(texte) {
    return String(texte == null ? "" : texte)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function nettoyer(texte) {
    return String(texte == null ? "" : texte).replace(/\s+/g, " ").trim();
  }

  function majuscules(texte) {
    return nettoyer(texte).toLocaleUpperCase("fr-FR");
  }

  /**
   * Normalise une réponse Graph /me (ou des données partielles) en « personne ».
   * Champs Graph : givenName, surname, displayName, jobTitle, businessPhones, mobilePhone, mail.
   */
  /** Liste de numéros nettoyée, sans vide ni doublon (même numéro saisi en fixe et en mobile). */
  function telephonesUniques(liste) {
    var vus = {};
    return (liste || [])
      .map(nettoyer)
      .filter(function (t) {
        var cle = t.replace(/[^\d+]/g, "");
        if (!t || vus[cle]) return false;
        vus[cle] = true;
        return true;
      });
  }

  /** Téléphones d'une fiche Graph : fixe(s) puis mobile (règle A : tout ce qui est rempli). */
  function telephonesGraph(g) {
    g = g || {};
    return telephonesUniques([].concat(g.businessPhones || [], g.mobilePhone || []));
  }

  function depuisGraph(g) {
    g = g || {};
    var telephones = telephonesGraph(g);
    return {
      prenom: nettoyer(g.givenName),
      nom: nettoyer(g.surname),
      nomAffiche: nettoyer(g.displayName),
      fonction: nettoyer(g.jobTitle),
      telephones: telephones,
      mail: nettoyer(g.mail)
    };
  }

  /** « Prénom Nom » tel que saisi dans Entra (sinon le nom affiché). */
  function nomCourant(personne) {
    if (personne.prenom && personne.nom) return personne.prenom + " " + personne.nom;
    return personne.nomAffiche || personne.nom || personne.prenom || "";
  }

  /** « PRÉNOM NOM » en majuscules. */
  function ligneNom(personne) {
    return majuscules(nomCourant(personne));
  }

  function paragraphe(contenuHtml, style, margeBas) {
    return (
      '<p style="margin:0 0 ' + (margeBas || "0") + " 0;font-family:" + POLICE + ";" + style + '">' +
      contenuHtml +
      "</p>"
    );
  }

  /** Ajoute un bloc de lignes ; la dernière ligne porte l'espace sous le bloc. */
  function ajouterBloc(sortie, lignes, espaceApres) {
    lignes.forEach(function (ligne, i) {
      sortie.push(paragraphe(ligne.html, ligne.style, i === lignes.length - 1 ? espaceApres : ligne.marge || "0"));
    });
  }

  /**
   * Construit le HTML de la signature.
   * @param {object} personne  résultat de depuisGraph()
   * @param {object} config    SIGNATURE_MFI_CONFIG
   * @param {object} [boite]   variante boîte partagée :
   *                            { adresse, libelle, telephone (forcé, config.js), telephones (fiche Entra), afficherNomUtilisateur }
   * @param {string} [nomLogo] nom de la pièce jointe incorporée du logo (référencée en cid:)
   */
  function construire(personne, config, boite, nomLogo) {
    personne = personne || {};
    nomLogo = nomLogo || config.logo.nomFichier;
    var couleur = config.societe.couleur;
    var styleFonction = STYLES.fonction + "color:" + couleur + ";";
    var puce = '<span style="color:' + couleur + ';font-size:10pt;">&#9679;</span> ';
    var lignes = [];

    // Bloc 1 : identité
    var identite = [];
    if (boite) {
      // Variante boîte partagée : libellé de la boîte en grand, nom de la personne dessous
      if (boite.libelle) {
        identite.push({ html: echapper(majuscules(boite.libelle)), style: STYLES.nom, marge: ESPACE_SOUS_NOM });
      }
      if (boite.afficherNomUtilisateur && nomCourant(personne)) {
        identite.push({ html: echapper(majuscules(nomCourant(personne))), style: styleFonction });
      }
    } else {
      var nom = ligneNom(personne);
      if (nom) identite.push({ html: echapper(nom), style: STYLES.nom, marge: ESPACE_SOUS_NOM });
      if (personne.fonction) identite.push({ html: echapper(majuscules(personne.fonction)), style: styleFonction });
    }
    ajouterBloc(lignes, identite, ESPACE_APRES_IDENTITE);

    // Bloc 2 : coordonnées
    var contact = [];
    // Boîte partagée : numéro forcé dans config.js s'il y en a un, sinon ceux de sa fiche Entra.
    var telephones = boite
      ? nettoyer(boite.telephone)
        ? [nettoyer(boite.telephone)]
        : telephonesUniques(boite.telephones)
      : personne.telephones || [];
    telephones.forEach(function (t) {
      contact.push({ html: puce + echapper(t), style: STYLES.contact });
    });
    var mail = boite ? nettoyer(boite.adresse) : personne.mail;
    if (mail) {
      contact.push({
        html:
          puce + '<a href="mailto:' + echapper(mail) + '" style="color:#333333;text-decoration:underline;">' +
          echapper(mail) + "</a>",
        style: STYLES.contact
      });
    }
    ajouterBloc(lignes, contact, ESPACE_APRES_CONTACT);

    // Bloc 3 : adresse (une ou plusieurs lignes)
    var adresse = [].concat(config.societe.adresse || []).filter(function (l) {
      return nettoyer(l);
    });
    ajouterBloc(
      lignes,
      adresse.map(function (l) {
        return { html: echapper(nettoyer(l)), style: STYLES.adresse };
      }),
      ESPACE_APRES_ADRESSE
    );

    // Bloc 4 : site
    ajouterBloc(
      lignes,
      [
        {
          html:
            '<a href="' + echapper(config.societe.siteUrl) + '" style="color:' + couleur +
            ';text-decoration:underline;">' + echapper(config.societe.siteLibelle) + "</a>",
          style: STYLES.site + "color:" + couleur + ";"
        }
      ],
      "0"
    );

    // Formule de politesse au-dessus du tableau, en Aptos comme le reste de la signature, puis deux lignes vides.
    var formule = nettoyer(config.formulePolitesse);
    var entete = formule ? '<p style="margin:0;font-family:' + POLICE + ';">' + echapper(formule) + "</p><div><br></div><div><br></div>" : "";

    // Un seul tableau à 4 colonnes, calqué sur les signatures Outlook existantes qui s'affichent
    // correctement dans le nouvel Outlook : logo | trait | espace | texte.
    //  - largeurs FIXES sur le tableau et chaque colonne ;
    //  - logo dans un simple paragraphe (pas de display:block) ;
    //  - le trait 4,5 pt est la bordure droite d'une colonne étroite : il a la hauteur de la ligne
    //    du tableau, c'est-à-dire du bloc de texte (du nom au site web) dès qu'il est plus haut que
    //    le logo, ce qui est le cas normal. Bloc très court (repli sans Entra) : le trait prend la
    //    hauteur du logo et le texte est centré.
    // Avec un tableau imbriqué et un logo en display:block, le nouvel Outlook réduisait la signature
    // à la lecture (bouton « Afficher la taille d'origine »). Constaté le 23/11/2026.
    var logo = config.logo;
    var largeurLogo = logo.largeur + 14; // logo + 7 px de chaque côté
    var largeurTrait = LARGEUR_ESPACE; // le trait est au bord droit de cette colonne
    var largeurEspace = ESPACE_TRAIT_TEXTE;
    var largeurTexte = LARGEUR_TEXTE - ESPACE_TRAIT_TEXTE;
    var largeurTotale = largeurLogo + largeurTrait + largeurEspace + largeurTexte;
    function cellule(largeur, style, contenu) {
      return '<td width="' + largeur + '" style="width:' + largeur + "px;padding:0;" + style + '">' + contenu + "</td>";
    }
    return (
      entete +
      '<table width="' + largeurTotale + '" cellpadding="0" cellspacing="0" border="0" ' +
      'style="width:' + largeurTotale + "px;border-collapse:collapse;border-spacing:0;font-family:" + POLICE + ';">' +
      "<tr>" +
      cellule(
        largeurLogo,
        "vertical-align:middle;text-align:center;",
        '<p style="margin:0;text-align:center;">' +
          '<img src="cid:' + echapper(nomLogo) + '" width="' + logo.largeur + '" height="' + logo.hauteur +
          '" alt="MFI" style="border:0;width:' + logo.largeur + "px;height:" + logo.hauteur + 'px;">' +
          "</p>"
      ) +
      cellule(largeurTrait, "border-right:4.5pt solid " + couleur + ";", "&nbsp;") +
      cellule(largeurEspace, "", "&nbsp;") +
      cellule(largeurTexte, "vertical-align:middle;", lignes.join("")) +
      "</tr>" +
      "</table>"
    );
  }

  /**
   * true si l'adresse appartient à un des domaines de config.domainesAutorises
   * (comparaison sans casse). Liste vide ou absente = tous les domaines.
   */
  function domaineAutorise(adresse, config) {
    var liste = (config && config.domainesAutorises) || [];
    if (!liste.length) return true;
    var domaine = String(adresse || "").trim().toLowerCase().split("@")[1] || "";
    return liste.some(function (d) {
      return String(d).trim().toLowerCase() === domaine;
    });
  }

  return {
    domaineAutorise: domaineAutorise,
    depuisGraph: depuisGraph,
    telephonesGraph: telephonesGraph,
    construire: construire,
    ligneNom: ligneNom,
    echapper: echapper
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = SignatureMFI;
}
