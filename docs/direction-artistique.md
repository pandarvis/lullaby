# Direction artistique et expérience utilisateur

Date : 26 septembre 2026. Référence exprimée par l'utilisateur : interfaces
Ankama / Dofus 3, direction artistique soignée, excellente UX et animations légères.
Cette préférence est retenue ; les couleurs, formes et compositions ci-dessous
sont des pistes à valider visuellement, pas une maquette approuvée.

## Intention

Donner à Lullaby une identité chaleureuse et travaillée, agréable pendant de longues
sessions de développement. Les projets et agents doivent se repérer rapidement.
La qualité graphique fait partie du produit dès la V0, même si son périmètre est réduit.

Référence officielle à consulter pour les interfaces :
[Dofus 3 — cosmétique et apparence](https://support.ankama.com/hc/fr/articles/47823763118097--DOFUS-L-interface-de-cosm%C3%A9tique-et-d-apparence).
Une capture choisie par l'utilisateur permettra de préciser quels éléments lui plaisent.

## Pistes proposées pour Lullaby

- Panneaux clairement délimités, relief discret et contrastes soignés.
- Palette resserrée ; explorer des surfaces sombres chaleureuses, du texte ivoire
  et un accent lumineux. Le choix clair/sombre et l'accent restent ouverts.
- Icônes cohérentes et formes expressives dans la navigation ; typographie très
  lisible dans les conversations et le code.
- Cartes de sessions reconnaissables, avec état textuel et icône ; la couleur seule
  ne suffit pas à distinguer une attente, une erreur ou un travail terminé.
- Détails de personnalité dans les espaces libres et les transitions, avec un chat
  calme et stable pendant la lecture. Aucun ajout de gamification n'est décidé.

## Mouvement

Privilégier des transitions CSS courtes (ordre de grandeur proposé : 120–200 ms)
pour survol, sélection, ouverture d'un panneau et changement d'état. Ne pas retarder
les actions pour laisser une animation finir. Éviter les mouvements décoratifs continus,
les sauts de mise en page et les animations ajoutées à chaque fragment de réponse.
Respecter `prefers-reduced-motion` et maintenir des repères de focus visibles au clavier.
Une bibliothèque d'animation supplémentaire doit être justifiée par un besoin concret.

## Avec assistant-ui

assistant-ui fournit les composants et comportements du chat. Les styles de Lullaby
seront partagés entre ce chat et le reste de l'application : couleurs, espacements,
rayons, ombres, typographie et mouvements. La bibliothèque ne fixe pas notre identité
visuelle. Garder ces réglages centralisés pour maintenir la cohérence et limiter les
retouches dispersées.

## Validation visuelle à venir

Avant de décliner tous les écrans, présenter une vue de supervision et un détail
de conversation avec états vide, actif, attente et erreur. Valider lisibilité du code,
navigation clavier, contraste, densité et mouvements. L'expression « UI/UX++ » ne
constitue pas à elle seule un critère de recette : ces écrans serviront de référence.
