# 1. Inscription de l'application dans Entra ID

But : permettre au complément de lire **la fiche Entra de l'utilisateur connecté** (`GET /me`) via Microsoft Graph, sans mot de passe ni secret, grâce à l'authentification d'application imbriquée (NAA).

Rôle requis : Administrateur d'application (ou Administrateur général) pour le consentement.

## Étapes

1. Ouvrir le centre d'administration Entra : <https://entra.microsoft.com>
2. **Identité** > **Applications** > **Inscriptions d'applications** > **Nouvelle inscription**.
3. Renseigner :
   - **Nom** : `Signature MFI`
   - **Types de comptes pris en charge** : *Comptes dans cet annuaire d'organisation uniquement (MFI uniquement – locataire unique)*
   - **URI de redirection** : plateforme **Application monopage (SPA)**, valeur :
     ```
     brk-multihub://c-paoli.github.io
     ```
   - **Inscrire**.
4. Sur la page **Vue d'ensemble** de l'application, relever :
   - **ID d'application (client)** → à transmettre (va dans `src/config.js`, champ `clientId`)
   - **ID de l'annuaire (locataire)** → doit valoir `3a904994-d98d-469c-b1cd-3efd32941d56` (déjà renseigné)
5. **Autorisations de l'API** :
   - Vérifier la présence de **Microsoft Graph > User.Read** (déléguée). Elle est ajoutée par défaut ; sinon : **Ajouter une autorisation** > Microsoft Graph > Autorisations déléguées > `User.Read`.
   - Ne **rien** ajouter d'autre.
   - Cliquer **Accorder un consentement d'administrateur pour MFI** > **Oui**. L'état doit passer à « Accordé pour MFI ».
6. Ne **pas** créer de secret ni de certificat (application publique, aucun secret).

## Contrôle

| Élément | Valeur attendue |
|---|---|
| Comptes pris en charge | Locataire unique |
| Plateforme | SPA |
| URI de redirection | `brk-multihub://c-paoli.github.io` |
| Autorisations | Microsoft Graph `User.Read` (déléguée), consentement administrateur accordé |
| Secrets / certificats | aucun |

## Pourquoi c'est sans risque

- `User.Read` ne donne accès qu'à **la propre fiche** de l'utilisateur connecté.
- L'ID client et l'ID de locataire ne sont pas des secrets : ils peuvent figurer dans le dépôt public.

## Plus tard : passage au compte GitHub MFI

On **ajoute** une seconde URI de redirection SPA `brk-multihub://<nouveau-compte>.github.io` à **cette même** inscription, puis on retire l'ancienne une fois la bascule validée. Voir `4 Passage au compte GitHub MFI.md`.
