# Direction artistique et expérience utilisateur

Date : 26 septembre 2026. Référence exprimée par l'utilisateur : interfaces
Ankama / Dofus 3, direction artistique soignée, excellente UX et animations légères.
Préférences confirmées : présence de couleur, palette maîtrisée et icônes avec une
identité marquée, un peu « sharp ». Éviter une application toute noire ou toute blanche,
ainsi qu'une accumulation de couleurs façon arc-en-ciel. Les teintes exactes, formes
et compositions restent à valider visuellement ; aucune maquette n'est approuvée.

## Intention

Donner à Lullaby une identité chaleureuse et travaillée, agréable pendant de longues
sessions de développement. Les projets et agents doivent se repérer rapidement.
La qualité graphique fait partie du produit dès la V0, même si son périmètre est réduit.

## Références étudiées

Recherche du 26 septembre 2026. Les recherches de devblogs ont surtout donné des
comptes rendus ; aucun devblog original consacré à la refonte 3.1 n'a été consulté
directement. Les références ci-dessous permettent néanmoins de travailler sur des
sources de conception et des exemples concrets, sans attendre des captures de l'utilisateur.
L'utilisateur juge la référence Figs ancienne, mais apprécie les idées de couleurs
et d'identité des icônes. Elle sert de point d'inspiration pour ces aspects.

| Source | Nature et apport | Limite |
| --- | --- | --- |
| [Dofus — Figs](https://www.figs-lab.com/projects/dofus) | Source primaire du studio : refonte du HUD, modularité, design system et tests utilisateurs. Texte lu et deux visuels examinés dans le navigateur : HUD et panneau de sorts. | Portfolio d'un travail commencé en janvier 2022 pour Dofus Unity ; ne prouve pas l'état actuel du client. |
| [Retour d'Angélique Delporte, UX/UI designer chez Ankama](https://fr.linkedin.com/posts/ang%C3%A9lique-delporte-6abb3115_dofus-3-est-sorti-le-3-d%C3%A9cembre-activity-7270009108831834112-qh9y) | Témoignage direct sur la collaboration avec Figs, la DA et le système de composants déclinés pour Dofus 3. | Retour de production, pas une spécification visuelle à reproduire. |
| [Wakfu — Figs](https://www.figs-lab.com/projects/wakfu) | Autre référence Ankama : rapprochement de certains espaces et personnalisation du HUD. Texte consulté via l'index de recherche. | Jeu distinct ; captures non examinées pendant cette recherche. |
| [Refonte des interfaces 3.1 — Breakflip, 22 avril 2025](https://www.breakflip.com/actualites/9050.html) | Compte rendu des changements de dialogues, de chat et de widgets. | Source secondaire qui mélange changements et intentions ; ne vaut pas validation des fonctionnalités livrées. |
| [Cosmétique et apparence — support Ankama](https://support.ankama.com/hc/fr/articles/47823763118097--DOFUS-L-interface-de-cosm%C3%A9tique-et-d-apparence) | Documentation officielle d'un parcours d'interface précis. | Ne couvre qu'une partie du jeu. |

### Observations visuelles et transposition proposée

Sur les deux visuels du portfolio Dofus examinés : surfaces bleu-violet sombres,
bandeaux distincts, icônes illustrées colorées, accents dorés, groupes de commandes
compacts et panneaux de détail superposés. Le centre du HUD reste largement disponible
pour le jeu. Ces observations concernent ces images, pas l'ensemble de Dofus 3.

Pour Lullaby, les pistes suivantes sont notre interprétation à valider en maquette :

- Une identité de projet reconnaissable (emblème, nom, accent) et des cartes de sessions
  indiquant immédiatement l'agent, sa tâche et son état.
- Une composition avec navigation latérale, conversation centrale et détail d'activité
  repliable. Le code et les réponses longues disposent de la plus grande surface utile.
- Des détails progressifs : résumé d'une action visible, commande, sortie et diff
  consultables à la demande. Une approbation en attente reste directement visible.
- Des panneaux ajustables avec quelques dispositions simples à terme ; la modularité
  ne justifie pas d'ajouter dès la V0 un éditeur complet de fenêtres.
- Un même vocabulaire graphique pour les cartes, boutons, états et composants
  assistant-ui. Créer nos propres formes et icônes ; les assets du jeu restent des références.

La densité d'un HUD de jeu et la superposition de nombreuses fenêtres demandent une
adaptation à la lecture prolongée de code. Les animations proposées plus bas sont
un choix pour Lullaby : leur durée n'a pas été mesurée dans Dofus.

## Pistes proposées pour Lullaby

- Panneaux clairement délimités, relief discret et contrastes soignés.
- Palette resserrée avec des surfaces teintées pour porter la couleur dans l'ensemble
  de l'interface. La proposition antérieure de surfaces sombres et de texte ivoire
  n'est pas une décision ; luminosité, teintes et accents restent à explorer.
- Icônes cohérentes et expressives. Interprétation à valider de « sharp » : silhouettes
  nettes, angles ou facettes, reconnaissables en petite taille. Typographie très
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
