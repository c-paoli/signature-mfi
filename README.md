# Signature MFI — complément Outlook

Ajoute automatiquement la signature MFI (logo, nom, fonction, téléphones, mail, adresse, site) à chaque nouveau message, réponse et transfert, sur **OWA, le nouvel Outlook et Outlook Android / iOS**.

- Les informations viennent de **Entra ID** (fiche de l'utilisateur, via Microsoft Graph `GET /me`). Entra est la seule source de vérité : il n'y a aucune donnée personnelle dans ce dépôt.
- Si Graph est indisponible, la signature est quand même insérée (dernières données connues, sinon nom du profil Outlook seul). La rédaction n'est jamais bloquée.
- Quand le « De » passe sur une boîte partagée configurée (ex. SAV), une variante est utilisée.

Aperçu du modèle (données fictives) : <https://c-paoli.github.io/signature-mfi/>

## Contenu

| Fichier | Rôle |
|---|---|
| `manifest.xml` | Manifeste « add-in only » (XML, obligatoire pour le mobile). **Seul endroit où figure l'URL d'hébergement.** |
| `src/commands.html` | Page d'exécution des événements (charge Office.js, MSAL et les scripts ci-dessous) |
| `src/launchevent.js` | Gestionnaires `OnNewMessageCompose` et `OnMessageFromChanged` |
| `src/signature.js` | Construction du HTML de la signature (fonctions pures) |
| `src/config.js` | ID client / tenant Entra, adresse, couleurs, boîtes partagées |
| `src/logo.js` | Logo encodé en base64 (généré) |
| `src/lib/msal-browser-4.30.0.min.js` | MSAL.js (Microsoft, licence MIT), copié tel quel depuis npm |
| `assets/` | Logo et icônes du complément |
| `index.html` | Page d'aperçu de la signature |
| `outils/Generer-Images.ps1` | Régénère icônes + `src/logo.js` si le logo change |
| `outils/Changer-UrlBase.ps1` | Change l'URL d'hébergement dans le manifeste |
| `tests/` | Tests du modèle : `node --test tests/signature.test.js` |
| `docs/` | Procédures (Entra, GitHub Pages, déploiement, migration), plan de test, journal des actions |

## Valeurs à renseigner

| Valeur | Où | État |
|---|---|---|
| Compte GitHub / dépôt | `manifest.xml` | `c-paoli` / `signature-mfi` (test) |
| ID de tenant | `src/config.js` | renseigné |
| ID client (application Entra) | `src/config.js` → `clientId` | renseigné |
| Adresse de la boîte SAV (+ autres boîtes) | `src/config.js` → `boitesPartagees` | **à confirmer** |

## Procédures

1. `docs/1 Inscription Entra.md`
2. `docs/2 Depot GitHub et Pages.md`
3. `docs/3 Test et deploiement.md`
4. `docs/4 Passage au compte GitHub MFI.md`

Voir aussi `docs/Clients pris en charge.md` (limites connues), `docs/Plan de test.md` et `docs/Journal des actions.md`.

## Vérifications locales

```powershell
npx office-addin-manifest validate manifest.xml
```

```powershell
node --test tests/signature.test.js
```
