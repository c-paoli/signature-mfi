/*
 * Construction du HTML de la signature MFI.
 *
 * Fonctions pures (aucun appel Office ni réseau) : utilisables dans le complément,
 * dans la page apercu.html et dans les tests Node (tests/signature.test.js).
 *
 * Modèle : tableau à deux colonnes, styles en ligne.
 *   [ logo MFI ] ┃ NOM PRÉNOM
 *                ┃ FONCTION
 *                ┃
 *                ┃ ● téléphone(s)
 *                ┃ ● mail
 *                ┃
 *                ┃ Strada Vecchja Box 1 - 20290 Borgo
 *                ┃
 *                ┃ www.mfi.corsica
 * Une ligne dont la donnée est vide n'est pas affichée.
 */
var SignatureMFI = (function () {
  "use strict";

  var POLICE = "Aptos, Calibri, Arial, sans-serif";

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
  function depuisGraph(g) {
    g = g || {};
    var telephones = [];
    (g.businessPhones || []).forEach(function (t) {
      if (nettoyer(t)) telephones.push(nettoyer(t));
    });
    if (nettoyer(g.mobilePhone)) telephones.push(nettoyer(g.mobilePhone));
    // Pas de doublon (même numéro saisi en fixe et en mobile)
    var vus = {};
    telephones = telephones.filter(function (t) {
      var cle = t.replace(/[^\d+]/g, "");
      if (vus[cle]) return false;
      vus[cle] = true;
      return true;
    });
    return {
      prenom: nettoyer(g.givenName),
      nom: nettoyer(g.surname),
      nomAffiche: nettoyer(g.displayName),
      fonction: nettoyer(g.jobTitle),
      telephones: telephones,
      mail: nettoyer(g.mail)
    };
  }

  /** « NOM PRÉNOM » en majuscules, sinon le nom affiché en majuscules. */
  function ligneNom(personne) {
    if (personne.nom && personne.prenom) {
      return majuscules(personne.nom + " " + personne.prenom);
    }
    return majuscules(personne.nomAffiche || personne.nom || personne.prenom);
  }

  /** « Prénom Nom » tel que saisi, pour la variante boîte partagée. */
  function nomCourant(personne) {
    if (personne.prenom && personne.nom) return personne.prenom + " " + personne.nom;
    return personne.nomAffiche || personne.nom || personne.prenom || "";
  }

  function paragraphe(contenuHtml) {
    return (
      '<p style="margin:0;font-family:' + POLICE + ";font-size:8pt;line-height:115%;\">" +
      contenuHtml +
      "</p>"
    );
  }

  var LIGNE_VIDE = paragraphe("&nbsp;");

  /**
   * Construit le HTML de la signature.
   * @param {object} personne  résultat de depuisGraph()
   * @param {object} config    SIGNATURE_MFI_CONFIG
   * @param {object} [boite]   variante boîte partagée : { adresse, libelle, telephone, afficherNomUtilisateur }
   * @param {string} [nomLogo] nom de la pièce jointe incorporée du logo (référencée en cid:)
   */
  function construire(personne, config, boite, nomLogo) {
    personne = personne || {};
    nomLogo = nomLogo || config.logo.nomFichier;
    var couleur = config.societe.couleur;
    var groupes = [];

    // Groupe 1 : identité
    var identite = [];
    if (boite) {
      if (boite.libelle) identite.push(paragraphe("<b>" + echapper(majuscules(boite.libelle)) + "</b>"));
      if (boite.afficherNomUtilisateur && nomCourant(personne)) {
        identite.push(paragraphe(echapper(nomCourant(personne))));
      }
    } else {
      var nom = ligneNom(personne);
      if (nom) identite.push(paragraphe("<b>" + echapper(nom) + "</b>"));
      if (personne.fonction) identite.push(paragraphe(echapper(majuscules(personne.fonction))));
    }
    if (identite.length) groupes.push(identite);

    // Groupe 2 : coordonnées
    var contact = [];
    var telephones = boite ? (nettoyer(boite.telephone) ? [nettoyer(boite.telephone)] : []) : personne.telephones || [];
    telephones.forEach(function (t) {
      contact.push(paragraphe("&#9679; " + echapper(t)));
    });
    var mail = boite ? nettoyer(boite.adresse) : personne.mail;
    if (mail) {
      contact.push(
        paragraphe(
          '&#9679; <a href="mailto:' + echapper(mail) + '" style="color:' + couleur +
            ';text-decoration:underline;">' + echapper(mail) + "</a>"
        )
      );
    }
    if (contact.length) groupes.push(contact);

    // Groupe 3 : adresse ; groupe 4 : site
    groupes.push([paragraphe(echapper(config.societe.adresse))]);
    groupes.push([
      paragraphe(
        '<a href="' + echapper(config.societe.siteUrl) + '" style="color:' + couleur +
          ';font-weight:bold;text-decoration:none;"><b>' + echapper(config.societe.siteLibelle) + "</b></a>"
      )
    ]);

    var colonneDroite = groupes
      .map(function (g) {
        return g.join("");
      })
      .join(LIGNE_VIDE);

    var logo = config.logo;
    return (
      '<table cellpadding="0" cellspacing="0" border="0" role="presentation" ' +
      'style="border-collapse:collapse;font-family:' + POLICE + ';font-size:8pt;">' +
      "<tr>" +
      '<td valign="middle" align="center" style="padding:0 10pt 0 0;vertical-align:middle;text-align:center;' +
      "border-right:4.5pt solid " + couleur + ';">' +
      '<img src="cid:' + echapper(nomLogo) + '" width="' + logo.largeur + '" height="' + logo.hauteur +
      '" alt="MFI" style="display:block;border:0;width:' + logo.largeur + "px;height:" + logo.hauteur + 'px;">' +
      "</td>" +
      '<td valign="middle" style="padding:0 0 0 10pt;vertical-align:middle;">' +
      colonneDroite +
      "</td>" +
      "</tr>" +
      "</table>"
    );
  }

  return {
    depuisGraph: depuisGraph,
    construire: construire,
    ligneNom: ligneNom,
    echapper: echapper
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = SignatureMFI;
}
