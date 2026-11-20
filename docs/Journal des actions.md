# Journal des actions

Toute action réalisée sur le tenant Microsoft 365, dans Entra ou sur GitHub est consignée ici (date, auteur, action, résultat).

| Date | Auteur | Action | Résultat / remarque |
|---|---|---|---|
| 20/11/2026 | Claude (pour Cédric) | Génération du projet : manifeste, runtime, modèle de signature, procédures. Manifeste validé (`office-addin-manifest validate`). | Aucune action sur le tenant. |
| 20/11/2026 | Claude (accord de Cédric) | Création du dépôt **public** `c-paoli/signature-mfi` (via `gh`), push de `main`, activation de GitHub Pages (branche `main`, racine). | Site publié : <https://c-paoli.github.io/signature-mfi/> — aperçu, `manifest.xml`, `src/commands.html`, scripts et icônes répondent (HTTP 200). |
| | Cédric | Inscription Entra « Signature MFI » + consentement administrateur `User.Read` | ID client : à reporter dans `src/config.js` |
| | Cédric | Chargement manuel dans OWA (compte Cédric) | |
| | Cédric | Applications intégrées : déploiement utilisateur spécifique (Cédric) | |
