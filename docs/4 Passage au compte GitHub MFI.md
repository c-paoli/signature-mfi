# 4. Passage au compte GitHub définitif (MFI)

À faire **après** validation complète des tests sur le compte de test `c-paoli`.

Dans ce qui suit, remplacer `<COMPTE_MFI>` par le nom du compte GitHub MFI.

## 1. Publier le dépôt sur le compte MFI

- Soit **transférer** le dépôt (`Settings` > `General` > *Transfer ownership*) vers `<COMPTE_MFI>` — l'historique Git est conservé ;
- soit créer `<COMPTE_MFI>/signature-mfi` et y pousser le dépôt local.

Activer GitHub Pages sur le nouveau dépôt (comme dans la doc 2) et vérifier :
`https://<COMPTE_MFI>.github.io/signature-mfi/manifest.xml`

## 2. Entra : ajouter la nouvelle URI de redirection

Inscription **Signature MFI (Graph)** (ID client `4437b7a2-…`, pas celle créée par Applications intégrées) > **Authentification** > plateforme SPA > **Ajouter un URI** :
```
brk-multihub://<COMPTE_MFI>.github.io
```
**Garder l'ancienne pour l'instant.** Rien d'autre ne change (même ID client, même consentement).

## 3. Changer l'URL dans le manifeste

```powershell
powershell -ExecutionPolicy Bypass -File outils\Changer-UrlBase.ps1 -Nouvelle "https://<COMPTE_MFI>.github.io/signature-mfi"
```

```powershell
npx office-addin-manifest validate manifest.xml
```

Commit + push sur le **nouveau** dépôt.

## 4. Mettre à jour le déploiement

Centre d'administration Microsoft 365 > **Applications intégrées** > « Signature MFI » > mettre à jour avec le nouveau manifeste (lien `https://<COMPTE_MFI>.github.io/signature-mfi/manifest.xml`).
L'ID du complément est inchangé : c'est une **mise à jour**, pas un nouveau complément.

## 5. Nettoyage (après quelques jours sans problème)

- Entra : retirer l'URI `brk-multihub://c-paoli.github.io`.
- GitHub `c-paoli` : désactiver Pages puis archiver ou supprimer l'ancien dépôt (s'il n'a pas été transféré).
- Consigner chaque action dans `Journal des actions.md`.
