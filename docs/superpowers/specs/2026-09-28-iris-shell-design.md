# Coquille Iris — densité et structure de fenêtre

Validé avec l'utilisateur le 28 septembre 2026, section par section. Référence
fournie : capture de l'application de bureau Claude (onglet Code). Seules la
structure et la densité sont reprises ; l'identité Iris (palette, logo, emblèmes)
reste celle de la [direction artistique](../../direction-artistique.md).
Branche `feature/iris-shell`, créée depuis `feature/turn-review`.

## Résultat attendu

- Une seule barre de titre de 40 px, sans cadre Windows natif.
- Une barre latérale d'environ 280 px listant les conversations groupées par projet.
- Une conversation centrée, une zone de saisie compacte et ses options en dessous.
- Git et les aperçus dans un panneau droit à onglets, sans quitter la conversation.
- Une interface Iris claire et unifiée, dense (13–14 px), sans gros titres ni grosses cartes.
- Une maquette HTML interactive validée avant toute modification de l'application.

## Choix validés

| Sujet | Décision | Écarté |
| --- | --- | --- |
| Barre de titre | Personnalisée, 40 px (`titleBarStyle: 'hidden'` + `titleBarOverlay`) | Barre Windows + en-tête réduit |
| Barre latérale | Conversations groupées par projet | Projets seuls ; projets dépliables |
| Git et aperçus | Panneau droit à onglets | Vues plein écran |
| Couleurs | Iris clair unifié | Iris sombre ; double thème ; répartition actuelle |
| Mise en œuvre | Nouvelle coquille, intérieur réutilisé | Restylage seul ; bibliothèque UI |

## Structure

```
┌──────────────────────────────────────────────────────────────────────┐
│ [L] [≡] ← →   Projet ▾   C:\chemin\du\projet     [git][◧]    ─ □ ✕   │ 40 px
├──────────────┬───────────────────────────────────────┬───────────────┤
│ Rechercher    │                                       │ Panneau droit │
│ + Nouvelle    │     Conversation centrée (≤ 860 px)    │ Git · Aperçu  │
│ ◇ Atelier     │                                       │               │
│ Projets    +  │                                       │               │
│ ◈ PROJET A +  │   ┌─────────────────────────────────┐ │               │
│   ● conv      │   │ Saisie                        ↵ │ │               │
│ ◈ PROJET B +  │   └─────────────────────────────────┘ │               │
│ ⚙ Paramètres  │    + · Modèle · Effort · Permissions   │               │
└──────────────┴───────────────────────────────────────┴───────────────┘
```

`App.tsx` est découpé en composants de coquille ; chat, Git, aperçus et paramètres
sont branchés sans changer leur logique :

- `TitleBar` : logo 20 px, repli de la barre latérale, précédent/suivant, sélecteur
  de projet et chemin, icônes du panneau droit. Zone vide déplaçable
  (`-webkit-app-region: drag`), contrôles en `no-drag`. Les boutons de fenêtre
  restent ceux de Windows, colorés par `titleBarOverlay`.
- `Sidebar` : recherche, nouvelle conversation, Atelier, groupes par projet, Paramètres.
- `MainArea` : conversation active en colonne centrée, ou Atelier sans conversation.
- `RightPanel` : onglets Git et Aperçu, fermé par défaut.
- Un état de navigation (sélection, historique, panneau) isolé dans un module
  testable, indépendant du rendu.

## Densité et typographie

| Jeton | Valeur | Usage |
| --- | --- | --- |
| `--text-xs` | 11 px | Titres de groupe (majuscules espacées), badges |
| `--text-sm` | 13 px | Barre latérale, barre de titre, menus, options de saisie |
| `--text-md` | 14 px | Messages, champ de saisie |
| `--text-lg` | 16 px | Titres de section (maximum) |
| `--row` | 32 px | Ligne cliquable |
| `--control` | 28 px | Boutons-icônes |
| `--icon` | 16 px | Icônes utilitaires ; 18 px pour les emblèmes |
| `--radius` | 6 px ; 8 px pour la saisie | Formes nettes |
| `--space-*` | 4, 8, 12, 16, 24 px | Seule grille d'espacement |

Segoe UI Variable pour l'interface, Cascadia Code pour le code ; Georgia est retiré.
Interligne 1,5 dans le chat, 1,3 dans les listes.

## Couleurs

| Zone | Valeur |
| --- | --- |
| Barre de titre et barre latérale | `--chrome` `#e9e5f5`, bloc continu sans trait |
| Zone centrale | `--paper` `#f6f4fb` ; séparation par la teinte, sans bordure |
| Saisie, cartes, panneau droit | `--surface` `#fcfbff` + bordure `--line` |
| Survol | Lavande translucide, 120 ms |
| Sélection | `--accent-soft` `#e5dff8`, texte `--ink` gras |
| Accent | `--accent` `#6551ad` : envoi, focus, liens ; seule couleur pleine |
| États | Menthe en cours/terminé, ambre en attente, rose erreur ; toujours avec icône |

Boutons Windows : fond `--chrome`, symboles `--ink`. Retirés : logo avec texte
« lullaby. », intitulés « VOTRE ESPACE »/« PROJETS » en capitales, grandes cartes,
ombres portées des panneaux (remplacées par une bordure fine).

## Comportement

**Barre latérale.** Groupes dans l'ordre stable des projets ; conversations de la
plus récemment créée à la plus ancienne (le snapshot n'a pas d'horodatage : pas
de date relative affichée), cinq visibles puis « Afficher tout (n) ». La
conversation active reste visible même au-delà des cinq. Un clic
sur le titre replie le groupe (mémorisé) ; un point ambre signale une attente
même replié. La recherche filtre en direct titres et noms de projet, localement ;
Échap la vide. Le + d'un groupe ouvre « Nouvelle conversation » dans ce projet :
choix de Claude ou Codex (le moteur est fixé à la création) et reprise d'une
session CLI. « Nouvelle conversation » en haut utilise le projet actif, sinon ouvre
le sélecteur de projet de la barre de titre. Le + de « Projets » ouvre un
dossier. Les actions de `SessionActions` et `ProjectActions` passent dans des menus
« ⋯ » affichés au survol. Repli complet par `Ctrl+B` ou le bouton de la barre de
titre, mémorisé sous `lullaby.sidebar-hidden` (booléen JSON) ; la barre compacte de 76 px disparaît.

**Navigation.** Précédent/suivant et `Alt+←/→` parcourent l'historique des vues
de la session. `Ctrl+N` nouvelle conversation, `Ctrl+K` recherche. Le sélecteur
de projet de la barre de titre change de projet.

**Panneau droit.** `Ctrl+J` ouvre ou ferme ; largeur réglable par la bordure
(320 px à 60 % de la fenêtre), mémorisée. Sous 1 000 px de fenêtre, le panneau
se superpose au chat au lieu de le pousser.

**Mouvement et accessibilité.** Transitions de 120 à 160 ms pour survol, sélection,
panneaux et repli ; `prefers-reduced-motion` et le réglage sans animations sont
respectés ; aucun décalage à l'arrivée d'une réponse. Focus visible, nom accessible
et infobulle sur chaque bouton-icône, flèches pour parcourir la barre latérale.

**Erreurs.** Les avis existants (`notice`) s'affichent en bandeau fin sous la
barre de titre. Un projet sans conversation montre une ligne « Aucune conversation »
avec son +.

## Tests et recette

- Les tests actuels restent verts ; `project-navigation` et `project-overview`
  sont adaptés à la nouvelle barre latérale.
- Nouveaux tests Testing Library : regroupement et tri, recherche, repli mémorisé,
  panneau droit, historique précédent/suivant, raccourcis.
- Test de la configuration de fenêtre : barre de titre masquée et `titleBarOverlay`.
- Recette visuelle : captures de l'application réelle comparées à la maquette,
  consignées dans `docs/validation/iris-shell.md`.

## Étapes

1. Maquette HTML interactive dans `docs/mockups/`, validée par l'utilisateur.
2. Barre de titre et jetons de densité.
3. Barre latérale par conversations.
4. Panneau droit.
5. Restylage du chat, de Git et des Paramètres.
6. Recette.

Chaque étape laisse l'application utilisable. Fusion et publication restent
soumises à l'autorisation de l'utilisateur.
