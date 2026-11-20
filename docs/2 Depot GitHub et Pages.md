# 2. Dépôt GitHub et publication GitHub Pages (phase de test)

Compte de test : **c-paoli** — dépôt : **signature-mfi**
URL publiée : <https://c-paoli.github.io/signature-mfi/>

Le dépôt est **public** (obligatoire pour GitHub Pages gratuit). C'est acceptable : il ne contient aucun secret ni aucune donnée personnelle.

## Créer le dépôt

1. Sur <https://github.com/new> (connecté en `c-paoli`) :
   - **Repository name** : `signature-mfi`
   - **Public**
   - Ne cocher **aucune** option d'initialisation (pas de README, .gitignore ni licence : ils existent déjà localement).
   - **Create repository**.

## Envoyer le projet

Dans un terminal PowerShell, depuis le dossier du projet :

```powershell
git remote add origin https://github.com/c-paoli/signature-mfi.git
```

```powershell
git push -u origin main
```

(Une fenêtre de connexion GitHub peut s'ouvrir la première fois.)

## Activer GitHub Pages

1. Sur le dépôt : **Settings** > **Pages**.
2. **Source** : *Deploy from a branch*.
3. **Branch** : `main`, dossier `/ (root)` > **Save**.
4. Attendre 1 à 2 minutes, puis vérifier que ces adresses s'ouvrent :
   - <https://c-paoli.github.io/signature-mfi/> (page d'aperçu de la signature, données fictives)
   - <https://c-paoli.github.io/signature-mfi/manifest.xml>
   - <https://c-paoli.github.io/signature-mfi/src/commands.html> (page blanche : normal)

## Mises à jour

Chaque `git push` sur `main` republie le site en 1 à 2 minutes.
Le code JavaScript est pris en compte au prochain lancement du complément (prévoir de redémarrer Outlook / recharger OWA, le cache navigateur pouvant garder l'ancienne version quelques minutes).
Une modification du **manifeste** demande en plus de le recharger dans Outlook ou dans Applications intégrées (voir `3 Test et deploiement.md`).
