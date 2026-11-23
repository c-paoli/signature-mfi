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

## Étape C — Déploiement par groupe (après validation)

**Ne pas faire sans validation explicite de Cédric.**

On déploie le complément à un **groupe** plutôt qu'à « toute l'organisation » : on choisit ainsi qui a la signature automatique (une personne qui doit garder une signature à part n'est simplement pas dans le groupe), et une arrivée se gère en ajoutant la personne au groupe.

### C1. Créer le groupe « Signature MFI »

Type : **groupe de sécurité à extension messagerie** (*mail-enabled security group*).
- Le déploiement des compléments accepte les groupes Microsoft 365, listes de distribution, groupes dynamiques et groupes de sécurité **à extension messagerie**, mais **pas les groupes de sécurité simples** (sans adresse).
- Pas de boîte, SharePoint ni Teams créés autour (contrairement à un groupe Microsoft 365), et il peut être masqué du carnet d'adresses.
- Groupe dynamique à éviter : il demande une licence Entra ID P1 par membre (absente des comptes Business Standard).

1. Centre d'administration Exchange : <https://admin.exchange.microsoft.com> > **Destinataires** > **Groupes** > **Ajouter un groupe**.
2. Type : **Sécurité à extension messagerie** ; nom : `Signature MFI` ; adresse : par ex. `signature-mfi@mfi.corsica`.
3. Propriétaire : Cédric Paoli. Membres : les collaborateurs concernés, **ajoutés directement** (voir le tableau `Informations pour le deploiement Signature MFI.xlsx`).
   - ⚠️ **Pas de groupe dans le groupe** : les membres d'un groupe imbriqué ne reçoivent pas le complément.
4. Paramètres : cocher **Masquer ce groupe de la liste d'adresses globale** ; ne pas autoriser les expéditeurs externes.

### C2. Affecter le complément au groupe

1. **Applications intégrées** > « Signature MFI » > **Utilisateurs** > *Utilisateurs/groupes spécifiques*.
2. Ajouter le groupe **Signature MFI** (on peut garder Cédric en individuel).
3. Propagation : jusqu'à **24 h** (ajout ou retrait). Prévenir les utilisateurs de redémarrer Outlook.
4. Prérequis côté postes : **nouvel Outlook** sur PC (l'Outlook classique n'applique pas la signature).

Ensuite : arrivée = ajouter la personne au groupe (et remplir sa fiche Entra) ; départ ou signature à part = la retirer du groupe.

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
