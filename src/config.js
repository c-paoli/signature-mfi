/*
 * Configuration du complément « Signature MFI ».
 *
 * Aucune donnée personnelle ici : les informations de chaque collaborateur
 * (nom, fonction, téléphones) sont lues dans Entra ID au moment de la rédaction.
 * L'ID client et l'ID de tenant ne sont pas des secrets.
 *
 * L'URL d'hébergement (GitHub Pages) n'apparaît que dans manifest.xml :
 * pour la changer, utiliser outils/Changer-UrlBase.ps1.
 */
var SIGNATURE_MFI_CONFIG = {
  // Inscription d'application Entra « Signature MFI »
  clientId: "4437b7a2-3d34-4e57-8ff7-0c890c2f9e83",
  tenantId: "3a904994-d98d-469c-b1cd-3efd32941d56",

  // Délai maximum d'attente de Microsoft Graph avant de passer au repli (ms).
  // Le complément dispose de 60 s au total ; on reste très en dessous.
  delaiGraphMs: 8000,

  // Durée de conservation locale des dernières données Entra connues (ms),
  // utilisées si Graph est indisponible. 7 jours.
  dureeCacheMs: 7 * 24 * 3600 * 1000,

  // Ligne placée au-dessus de la signature ("" pour ne rien mettre)
  formulePolitesse: "Cordialement",

  // Partie fixe de la signature
  societe: {
    adresse: ["ROUTE DE STRADA VECCHJA – BOX 1&2", "20290 BORGO"], // une ligne par élément
    siteLibelle: "www.mfi.corsica",
    siteUrl: "https://www.mfi.corsica",
    couleur: "#467886"
  },

  // Logo (pièce jointe incorporée, voir src/logo.js)
  logo: {
    nomFichier: "logo-mfi.png",
    largeur: 236, // px affichés (original 281 x 113)
    hauteur: 95
  },

  // Boîtes partagées ayant une variante de signature (adresse en minuscules).
  // Quand le « De » passe sur l'une d'elles, la signature affiche le libellé
  // de la boîte, puis le nom de la personne qui écrit (si afficherNomUtilisateur).
  // Les champs vides ne sont pas affichés.
  // D'autres boîtes seront ajoutées plus tard.
  boitesPartagees: {
    "sav@mfi.corsica": {
      libelle: "SERVICE APRÈS-VENTE",
      telephone: "",
      afficherNomUtilisateur: true
    }
  }
};
