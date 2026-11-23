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

## Étape C — Toute l'organisation, filtrée par domaine (après validation)

**Ne pas faire sans validation explicite de Cédric.**

Choix retenu le 23/11/2026 : **déployer à toute l'organisation** et laisser le **code filtrer par domaine** (`domainesAutorises` dans `src/config.js`, aujourd'hui `["mfi.corsica"]`).
- Compte ou « De » en **@mfi.corsica** : signature MFI posée automatiquement.
- Autre domaine du tenant (ex. comptes Lupi, Stratecor) : le complément **ne fait rien**, la signature Outlook de la personne reste en place.
- Arrivée : rien à faire côté déploiement (créer le compte et remplir sa fiche Entra). Nouveau domaine à couvrir : l'ajouter à `domainesAutorises` et publier.

1. **Applications intégrées** > « Signature MFI » > **Utilisateurs** : passer à **Toute l'organisation**.
2. Propagation : jusqu'à **24 h**. Prévenir les utilisateurs de redémarrer Outlook.
3. Prérequis côté postes : **nouvel Outlook** sur PC (l'Outlook classique n'applique pas la signature).

### Variante (si un jour une personne en @mfi.corsica doit garder une signature à part)

Le filtre par domaine ne permet pas d'exclure une personne précise (son adresse devrait figurer dans le code, qui est public). Il faut alors déployer à un **groupe** au lieu de toute l'organisation :
- type **groupe de sécurité à extension messagerie** (les groupes de sécurité simples ne sont pas pris en charge ; groupe dynamique à éviter, il demande Entra ID P1 par membre) ;
- Centre d'administration Exchange > **Destinataires** > **Groupes** > **Ajouter un groupe** > *Sécurité à extension messagerie*, nom `Signature MFI`, **masqué** de la liste d'adresses globale ;
- membres **ajoutés directement** (pas de groupe imbriqué : ses membres ne recevraient pas le complément) ;
- Applications intégrées > « Signature MFI » > Utilisateurs > *Utilisateurs/groupes spécifiques* > ce groupe.

## Mise à jour du manifeste (nouvelle version)

À faire **uniquement quand `manifest.xml` change** (bouton, icônes, événements…). Une modification du seul code (`src/`) ne demande rien : elle est en ligne dès la publication sur GitHub Pages.

1. Vérifier que `<Version>` a été incrémentée dans `manifest.xml` et que la nouvelle version est publiée : <https://c-paoli.github.io/signature-mfi/manifest.xml>.
2. Centre d'administration Microsoft 365 > **Paramètres** > **Applications intégrées** > « Signature MFI ».
3. Choisir **Mettre à jour** (bouton en bas à droite pour une application métier), et redonner l'URL du manifeste (ou le fichier). Accepter les autorisations si elles sont redemandées.
4. Propagation : jusqu'à 24 h (parfois 72 h). Redémarrer Outlook ensuite.

Alternative PowerShell (module Exchange Online / Centralized Deployment) : `Set-OrganizationAddIn -ProductId <id> -ManifestPath manifest.xml -Locale fr-FR`.

## Diagnostic

- Les messages du complément commencent par `[Signature MFI]`.
- OWA / nouvel Outlook : outils de développement du navigateur (F12) > Console, au moment de créer un message.
- Journal d'exécution et débogage des compléments événementiels : <https://learn.microsoft.com/office/dev/add-ins/testing/troubleshoot-event-based-and-spam-reporting-add-ins>
- Si la signature ne contient que le nom (sans fonction ni téléphone) : c'est le **repli** — Graph n'a pas répondu (ID client manquant, consentement non accordé, NAA non pris en charge sur ce client). Les dernières données Entra connues sont gardées 7 jours sur l'appareil et utilisées en priorité sur le repli.
