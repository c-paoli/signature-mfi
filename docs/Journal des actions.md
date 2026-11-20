# Journal des actions

Toute action réalisée sur le tenant Microsoft 365, dans Entra ou sur GitHub est consignée ici (date, auteur, action, résultat).

| Date | Auteur | Action | Résultat / remarque |
|---|---|---|---|
| 20/11/2026 | Claude (pour Cédric) | Génération du projet : manifeste, runtime, modèle de signature, procédures. Manifeste validé (`office-addin-manifest validate`). | Aucune action sur le tenant. |
| 20/11/2026 | Claude (accord de Cédric) | Création du dépôt **public** `c-paoli/signature-mfi` (via `gh`), push de `main`, activation de GitHub Pages (branche `main`, racine). | Site publié : <https://c-paoli.github.io/signature-mfi/> — aperçu, `manifest.xml`, `src/commands.html`, scripts et icônes répondent (HTTP 200). |
| 20/11/2026 | Cédric | Inscription Entra « Signature MFI » (locataire unique, SPA `brk-multihub://c-paoli.github.io`, Microsoft Graph `User.Read` déléguée) + consentement administrateur | ID client `4437b7a2-3d34-4e57-8ff7-0c890c2f9e83`, reporté dans `src/config.js` |
| | Cédric | Chargement manuel dans OWA (compte Cédric) | |
| | Cédric | Applications intégrées : déploiement utilisateur spécifique (Cédric) | |
