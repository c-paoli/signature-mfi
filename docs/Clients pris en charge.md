# Clients pris en charge et limites connues

D'après la documentation Microsoft (vérifiée le 20/11/2026).

| Client | Nouveau message / réponse / transfert | Changement du « De » (boîte partagée) | Données Entra (NAA) |
|---|---|---|---|
| OWA (navigateur) | oui | oui | oui |
| Nouvel Outlook pour Windows | oui | oui | oui |
| Outlook Android (≥ 4.2352) | oui | événement pris en charge (≥ 4.2502), **mais pas pour les boîtes partagées / délégations** | oui (≥ 4.2433) |
| Outlook iOS (≥ 4.2352) | oui | idem Android | oui (≥ 4.2433) |
| Outlook classique Windows | **non ciblé** | non ciblé | — |

## Limites à connaître

- **Outlook classique** : il exécute les événements dans un moteur JavaScript séparé qui demande un fichier unique et, pour l'authentification, un fichier `/.well-known/microsoft-officeaddins-allowed.json` **à la racine du domaine** — impossible sur une adresse `github.io/<dépôt>`. Non prioritaire (décision projet) ; les utilisateurs de l'Outlook classique gardent leur signature actuelle.
- **Mobile – boîtes partagées** : sur Android / iOS, l'envoi « De » une boîte partagée n'est pas géré par l'événement `OnMessageFromChanged`. La variante SAV ne fonctionne donc que sur OWA et le nouvel Outlook.
- **Brouillon agrandi dans une nouvelle fenêtre (constaté dans le nouvel Outlook ; OWA probablement identique)** : si un mail est commencé dans le volet de droite puis ouvert « dans une nouvelle fenêtre », le changement du « De » n'y met plus la signature à jour (constaté le 23/11/2026). C'est Outlook qui ne relance pas le complément dans la fenêtre agrandie ; le code n'y peut rien. Un mail ouvert **directement** en fenêtre autonome fonctionne (vérifié dans OWA). Contournement : choisir le « De » **avant** d'agrandir la fenêtre, ou cliquer sur le bouton **Signature MFI** (menu **Applications** du ruban de rédaction, manifeste 1.0.1.0) qui remet la signature du « De » actuel.
- **Bouton Signature MFI** : OWA et nouvel Outlook uniquement (Outlook mobile n'affiche pas de boutons de compléments en rédaction).
- **Nouvel Outlook – signature réduite à la lecture** (constaté le 23/11/2026, version 1.2026.1103) : à l'affichage d'un mail reçu, le nouvel Outlook applique lui-même un zoom d'environ 6 % (`transform: scale(…)`) aux tableaux de signature et propose « Afficher la taille d'origine ». Il le fait aussi pour les signatures Outlook manuelles existantes : c'est un défaut d'Outlook, pas du complément. OWA et mobile affichent normalement. Un clic sur « Afficher la taille d'origine » rétablit l'affichage.
- **Mobile – brouillon** : si rien n'est saisi dans un nouveau message, aucun brouillon n'est enregistré, même avec la signature ajoutée (comportement normal).
- **Mobile – « Répondre » depuis le bas du message** : la signature est ajoutée mais visible seulement en passant la rédaction en plein écran.
- **iOS – « Partager »** : un message créé via le bouton Partager d'iOS ne déclenche pas le complément.
- **Un seul complément événementiel à la fois** : si un autre complément de signature est installé, ils s'exécutent l'un après l'autre.
- **60 secondes maximum** par événement ; le complément abandonne Graph après 8 s et passe au repli.
- **Signature Outlook personnelle** : le complément désactive la signature du client sur le message en cours (`disableClientSignatureAsync`) pour éviter deux signatures.

## Sources

- <https://learn.microsoft.com/office/dev/add-ins/outlook/mobile-event-based>
- <https://learn.microsoft.com/office/dev/add-ins/outlook/onmessagefromchanged-onappointmentfromchanged-events>
- <https://learn.microsoft.com/javascript/api/requirement-sets/common/nested-app-auth-requirement-sets>
- <https://learn.microsoft.com/office/dev/add-ins/outlook/use-sso-in-event-based-activation>
