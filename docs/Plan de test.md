# Plan de test

Compte de test : celui de Cédric uniquement. Cocher et noter le résultat (OK / KO + remarque).

| # | Scénario | OWA | Nouvel Outlook | Android | iOS |
|---|---|---|---|---|---|
| 1 | Nouveau message : signature complète (logo, nom, fonction, téléphone(s), mail, adresse, site) | OK 23/11 | OK 23/11 | | |
| 2 | Répondre | | | | |
| 3 | Répondre à tous | | | | |
| 4 | Transférer | | | | |
| 5 | Le destinataire (externe, ex. Gmail) voit le logo **sans** cliquer « afficher les images » | | | | |
| 6 | Mode sombre : logo et texte lisibles | | | | |
| 7 | Une seule signature (pas de doublon avec la signature Outlook personnelle) | | | | |
| 8 | Réponse à un mail d'un collègue déjà signé MFI : un seul logo dans *notre* signature, celui du message cité intact | | | | |
| 9 | « De » → boîte partagée SAV : variante SAV, titre (« Poste ») et téléphone lus dans la fiche Entra de la boîte | OK 23/11 (volet et fenêtre autonome) | OK 23/11 (volet de droite) | n/a | n/a |
| 9c | Mail commencé dans le volet de droite, agrandi « dans une nouvelle fenêtre », puis « De » → SAV | à tester (fenêtre bloquée dans le navigateur de test) | **KO 23/11** (limite Outlook, voir Clients pris en charge) | n/a | n/a |
| 9d | Bouton **Applications > Signature MFI** dans la fenêtre agrandie (cas 9c) : signature SAV posée + bandeau « Signature MFI mise à jour » | | | n/a | n/a |
| 9b | Écrire depuis le dossier de la boîte SAV (ouverte comme compte à part) : variante SAV et non signature personnelle | | | | |
| 10 | « De » → retour sur son adresse : signature personnelle | | OK 23/11 | n/a | n/a |
| 11 | Champ Entra vide (ex. vider le mobile) : pas de ligne « ● » vide | | | | |
| 12 | Modification Entra (ex. fonction) prise en compte au message suivant | | | | |
| 13 | Repli : `clientId` volontairement faux → signature avec le nom seul, rédaction non bloquée | | | | |
| 14 | Mode avion (mobile) après un premier usage : dernières données connues utilisées | n/a | n/a | | |

Pour le test 13 : modifier `clientId` dans `src/config.js`, publier, tester, puis **remettre la bonne valeur**.
