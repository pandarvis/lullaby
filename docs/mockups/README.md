# Maquette interactive — Atelier

Support de conception du 26 septembre 2026. Direction Iris et logo facetté validés
par l'utilisateur le même jour.
Cette maquette explore la cible produit ; elle ne change pas le périmètre technique
de la V0 et ne constitue pas son implémentation.

## Ouvrir

Ouvrir [atelier.html](atelier.html) dans un navigateur, sans installation ni accès réseau.
Pour une prévisualisation HTTP locale, depuis la racine du dépôt :

```powershell
node docs/mockups/preview.cjs
```

Ouvrir l'adresse imprimée dans le terminal. Le serveur utilise un port libre sur
`127.0.0.1`, sert uniquement la maquette et s'arrête avec Ctrl+C.
Il s'agit d'un outil de revue, pas d'un serveur requis par la future application.

## Piste visuelle

- Iris, retenue : surfaces lavande, navigation indigo, accents menthe et ambre.
- Lagon : exploration non retenue, toujours accessible dans le sélecteur supérieur.
- Emblèmes SVG originaux, facettés ; pas d'assets Ankama ni de police distante.
- Deux vues : supervision et conversation avec activité, fichiers et approbation.
- Menu repliable : barre compacte de 76 px, emblèmes de projets, noms accessibles
  et infobulles. Le bouton se trouve à gauche du fil de navigation supérieur.
- Accès « Proxy Claude » en bas du menu : démarrage/arrêt de Px simulés, état visible.
- Temps par session sur les cartes et dans le chat ; cumuls par projet dans un
  récapitulatif dédié. Votre temps et celui des agents sont affichés séparément.

Iris et le logo Lullaby sont les références à préserver. Le HTML simule le chat pour
explorer la composition sans installer de dépendances. L'application utilisera assistant-ui
comme prévu ; ni React, ni assistant-ui, ni les moteurs ne sont intégrés ici.

## Parcours à essayer

1. Filtrer les sessions par projet, état ou recherche.
2. Ouvrir « Donner vie à l'atelier », autoriser ou refuser la commande fictive.
3. Interrompre une exécution, puis envoyer un message pour obtenir une réponse prédéfinie.
4. Déplier l'extrait de modification et « Scénarios de la maquette » pour simuler
   une erreur de connexion, puis réessayer.
5. Créer une session fictive Claude ou Codex et explorer son état vide.
6. Comparer Iris et Lagon et réduire la fenêtre.
7. Replier/déplier le menu et naviguer avec les emblèmes ; actualiser pour vérifier
   que la préférence est mémorisée quand le stockage du navigateur est disponible.
8. Ouvrir « Proxy Claude », démarrer puis arrêter le relais fictif.
9. Comparer les durées des deux sessions Lullaby à leur cumul projet : 50 min
   de temps humain et 1 h 02 de temps agent. Les filtres d'état et de recherche
   réduisent les cartes visibles, pas le cumul complet du projet.

Les conversations et brouillons restent en mémoire par session ; actualiser la page
réinitialise la démonstration, sauf la préférence de menu enregistrée localement.
Aucun abonnement n'est appelé, aucune commande exécutée,
aucun fichier de projet modifié. Les durées affichées sont des exemples fixes.

## Suite de la revue

Conserver Iris et le logo ; affiner densité, confort de lecture et visibilité des
demandes d'attention pendant l'intégration. La validation graphique ne vaut pas
validation des intégrations ni de la spécification complète de la V0.
