# Journal des actions

Toute action réalisée sur le tenant Microsoft 365, dans Entra ou sur GitHub est consignée ici (date, auteur, action, résultat).

| Date | Auteur | Action | Résultat / remarque |
|---|---|---|---|
| 20/11/2026 | Claude (pour Cédric) | Génération du projet : manifeste, runtime, modèle de signature, procédures. Manifeste validé (`office-addin-manifest validate`). | Aucune action sur le tenant. |
| 20/11/2026 | Claude (accord de Cédric) | Création du dépôt **public** `c-paoli/signature-mfi` (via `gh`), push de `main`, activation de GitHub Pages (branche `main`, racine). | Site publié : <https://c-paoli.github.io/signature-mfi/> — aperçu, `manifest.xml`, `src/commands.html`, scripts et icônes répondent (HTTP 200). |
| 20/11/2026 | Cédric | Inscription Entra « Signature MFI » (locataire unique, SPA `brk-multihub://c-paoli.github.io`, Microsoft Graph `User.Read` déléguée) + consentement administrateur | ID client `4437b7a2-3d34-4e57-8ff7-0c890c2f9e83`, reporté dans `src/config.js` |
| 20/11/2026 | Cédric | Applications intégrées : déploiement du complément « Signature MFI » (lien `https://c-paoli.github.io/signature-mfi/manifest.xml`), **utilisateur spécifique : Cédric Paoli uniquement**. Pas de chargement manuel OWA (choix : même circuit que la production). | Propagation en cours (jusqu'à 24 h). |
| 20/11/2026 | Claude (accord de Cédric) | Nouveau modèle de signature publié (calqué sur la signature de Cédric) : Aptos, « Cordialement », PRÉNOM NOM / fonction en gras, puces et fonction couleur MFI, adresse « ROUTE DE STRADA VECCHJA – BOX 1&2 / 20290 BORGO », grand logo centré, trait du nom jusqu'au site. Variante boîte partagée `sav@mfi.corsica`. | Code uniquement (GitHub Pages) ; aucune action sur le tenant, manifeste inchangé. |
