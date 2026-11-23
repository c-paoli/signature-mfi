# 1. Inscription de l'application dans Entra ID

But : permettre au complément de lire via Microsoft Graph, sans mot de passe ni secret, grâce à l'authentification d'application imbriquée (NAA) :
- **la fiche Entra de l'utilisateur connecté** (`GET /me`, permission `User.Read`) ;
- **la fiche Entra d'une boîte partagée** quand le « De » passe dessus (titre et téléphones, permission `User.Read.All`).

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
   - **Ajouter une autorisation** > Microsoft Graph > **Autorisations déléguées** > `User.Read.All` (catégorie *User*). Ajoutée le 23/11/2026 pour les boîtes partagées.
   - Ne **rien** ajouter d'autre (aucune autorisation « d'application »).
   - Cliquer **Accorder un consentement d'administrateur pour MFI** > **Oui**. L'état doit passer à « Accordé pour MFI ».
6. Ne **pas** créer de secret ni de certificat (application publique, aucun secret).

## Contrôle

| Élément | Valeur attendue |
|---|---|
| Comptes pris en charge | Locataire unique |
| Plateforme | SPA |
| URI de redirection | `brk-multihub://c-paoli.github.io` |
| Autorisations | Microsoft Graph `User.Read` et `User.Read.All` (déléguées), consentement administrateur accordé pour les deux |
| Secrets / certificats | aucun |

## Pourquoi c'est sans risque

- `User.Read` ne donne accès qu'à **la propre fiche** de l'utilisateur connecté.
- `User.Read.All` est **déléguée** et en **lecture seule** : le complément agit au nom de l'utilisateur et ne voit que ce qu'il voit déjà dans le carnet d'adresses Outlook / Teams. Elle sert uniquement à lire la fiche de la boîte partagée choisie dans le « De ».
- Le point de vigilance est le **compte GitHub** qui héberge le code : double authentification obligatoire.
- L'ID client et l'ID de locataire ne sont pas des secrets : ils peuvent figurer dans le dépôt public.

## Fiches des boîtes partagées

Dans le centre d'administration Microsoft 365 (ou Entra > Utilisateurs), ouvrir l'objet de la boîte partagée (ex. `sav@mfi.corsica`) et renseigner :

| Champ de la fiche | Utilisation dans la signature |
|---|---|
| **Poste** (ou « Intitulé du poste » ; pas « Service ») | Titre en grand (ex. `Service après-vente`, affiché en majuscules). Vide → nom complet de la boîte. |
| **Téléphone professionnel** / **Téléphone mobile** | Ligne(s) téléphone. Vides → pas de ligne. |

Les modifications sont prises en compte au mail suivant (le complément garde une copie locale 7 jours, utilisée seulement si Graph est indisponible).

## Plus tard : passage au compte GitHub MFI

On **ajoute** une seconde URI de redirection SPA `brk-multihub://<nouveau-compte>.github.io` à **cette même** inscription, puis on retire l'ancienne une fois la bascule validée. Voir `4 Passage au compte GitHub MFI.md`.
