# 3. Test puis déploiement

Prérequis : dépôt publié sur GitHub Pages (doc 2), inscription Entra faite et `clientId` renseigné dans `src/config.js` (doc 1).

Toujours tester d'abord sur **le seul compte de Cédric**.

## Étape A — Chargement manuel dans OWA (itérations rapides)

1. Ouvrir <https://aka.ms/olksideload> (OWA ouvre la fenêtre **Compléments pour Outlook**).
2. **Mes compléments** > **Compléments personnalisés** > **Ajouter un complément personnalisé** > **Ajouter à partir d'un fichier…**
3. Choisir `manifest.xml` du projet > **Installer**.
4. Créer un nouveau message : la signature MFI doit apparaître.
5. Le complément chargé ainsi est aussi disponible dans le nouvel Outlook et, après redémarrage de l'application, dans Outlook Android / iOS (même compte).

Pour le retirer : même fenêtre > **Mes compléments** > « Signature MFI » > **…** > **Supprimer**.

> Après une modification du manifeste : supprimer puis réinstaller le complément.
> Après une modification du code JavaScript seulement : un simple rechargement d'OWA suffit (après publication GitHub Pages).

## Étape B — Déploiement centralisé, utilisateur spécifique

Même circuit que la production. Avant cette étape, **supprimer le complément chargé manuellement** (étape A) pour éviter les doublons.

1. Centre d'administration Microsoft 365 : <https://admin.microsoft.com>
2. **Paramètres** > **Applications intégrées** > **Charger des applications personnalisées**.
3. Type d'application : **Complément Office** ; choisir **Fournir un lien vers le fichier manifeste** :
   ```
   https://c-paoli.github.io/signature-mfi/manifest.xml
   ```
   (ou **Charger le fichier manifeste** depuis le poste).
4. **Utilisateurs** : *Utilisateurs/groupes spécifiques* > Cédric Paoli.
5. Accepter les autorisations demandées (lecture / écriture de l'élément en cours de rédaction) > **Déployer**.
6. Délai de propagation : de quelques minutes à **24 h**. Redémarrer Outlook (et l'application mobile) ensuite.

## Étape C — Toute l'organisation (après validation)

Dans **Applications intégrées** > « Signature MFI » > **Utilisateurs** : passer à *Toute l'organisation* (ou un groupe pilote d'abord).
**Ne pas faire sans validation explicite de Cédric.**

## Diagnostic

- Les messages du complément commencent par `[Signature MFI]`.
- OWA / nouvel Outlook : outils de développement du navigateur (F12) > Console, au moment de créer un message.
- Journal d'exécution et débogage des compléments événementiels : <https://learn.microsoft.com/office/dev/add-ins/testing/troubleshoot-event-based-and-spam-reporting-add-ins>
- Si la signature ne contient que le nom (sans fonction ni téléphone) : c'est le **repli** — Graph n'a pas répondu (ID client manquant, consentement non accordé, NAA non pris en charge sur ce client). Les dernières données Entra connues sont gardées 7 jours sur l'appareil et utilisées en priorité sur le repli.
