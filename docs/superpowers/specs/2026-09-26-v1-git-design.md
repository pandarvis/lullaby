# Lullaby V1 — graphe Git et fichiers modifiés

Date : 26 septembre 2026. Besoin confirmé : les deux vues sont souhaitées.
Conception validée, implémentée sur `feature/git-inspector`.
État de vérification : [recette Git](../../validation/git-v1.md).

## Objectif et place dans la V1

Depuis un projet, comprendre les branches et merges, parcourir les changements
locaux et lire les différences d'un commit sans quitter Lullaby. Cette tranche
suit la validation d'une session fiable avec chaque moteur dans la
[V0](2026-09-26-v0-windows-design.md). Elle reste utilisable sans agent actif.

La consultation est la première tranche proposée. Les commandes de modification
du dépôt (stage, commit, checkout, merge, rebase, reset, push) seront un autre
périmètre ; elles ne sont pas requises pour consulter le graphe. Les agents gardent
leurs outils et permissions habituels : la vue Git n'en modifie pas les capacités.

## Parcours et présentation Iris

Un accès « Git » dans le projet ouvre une vue large, sans perdre la session ni son
brouillon. Deux onglets : « Historique » et « Modifications ».

- Historique : graphe SVG des commits, branches locales/distantes connues, tags,
  HEAD et merges ; sélection d'une ligne pour voir auteur, message et fichiers.
- Modifications : arborescence des fichiers, avec groupes index, dossier de travail,
  non suivis et conflits. Un fichier peut appartenir à deux groupes.
- Détail : diff unifié lisible, numéros de lignes, signes +/− en complément des
  couleurs ; sélection du parent de comparaison pour un commit de merge.
- Une action « Actualiser » et l'heure du dernier relevé évitent de confondre
  l'état consulté avec un suivi instantané garanti. Rafraîchir à la reprise du focus
  et après une exécution d'agent, sans reprendre automatiquement le défilement.

Garder la palette Iris, les icônes SVG, les libellés accessibles et la navigation
clavier. Les traits du graphe ne sont pas l'unique représentation des liens :
parents et références restent lisibles dans le détail. L'état Git décrit le dépôt,
pas l'auteur réel d'une modification locale : ne pas attribuer tous les changements
à l'agent sélectionné. Afficher le dossier/worktree concerné.

## Acquisition et réutilisation

Réutiliser Git installé sur le poste via processus enfant dans le main Electron,
avec arguments séparés, sans shell ni bibliothèque Git native à installer.
Les commandes de consultation utilisent des formats machine et des séparateurs NUL
pour les chemins. Désactiver couleur, pager, external diff et textconv pour lire
les différences sans exécuter des helpers du dépôt.

Préférer un petit rendu SVG local pour les voies du graphe et les arborescences.
Cette proposition limite les installations ; si la complexité du rendu le justifie,
comparer un composant maintenu avant de le retenir, avec licence, taille et coût de
maintenance. Ne pas intégrer un client Git complet ni un éditeur lourd par défaut.

Le backend expose des données typées et conserve les chemins bruts ; l'UI ne
construit aucune commande Git. Toutes les lectures sont rattachées à un projet
enregistré. Un chemin affiché vient d'une réponse Git, pas d'une commande arbitraire
envoyée par la fenêtre. Aucune connexion Git distante ni fetch automatique.

## Bornes proposées

- Historique initial : 200 commits en ordre topologique ; « Charger plus » par
  incréments de 200, jusqu'à 2 000 pour cette tranche. Une limite atteinte est visible.
- Conserver les extrémités vers les parents hors fenêtre : un graphe tronqué ne
  doit pas présenter un commit comme une racine réelle.
- Références capturées avant la lecture et utilisées comme points de départ par
  OID pour les pages suivantes. Si elles changent, proposer un nouveau relevé.
- Lecture Git : délai de 15 secondes et plafond de sortie 8 Mio ; annuler une
  lecture remplacée. Afficher une limite explicite, jamais un dépôt vide fictif.
- Diff affiché : au plus 1 Mio ; signaler la troncature. Binaire, sous-module et
  lien symbolique ont un résumé adapté, sans suivi du lien hors dépôt.

Ces limites bornent l'affichage Git, pas le contexte ni les outils des agents.
Les références distantes reflètent le dernier état connu localement ; les indiquer
comme telles. Aucun chiffre de performance n'est garanti avant mesure.

## Cas à couvrir

| Situation | Résultat attendu |
| --- | --- |
| Dossier hors Git ou Git absent | Message explicite ; chat toujours utilisable |
| Dépôt sans commit | Vue vide correcte et fichiers non suivis visibles |
| HEAD détachée ou worktree | Identité exacte affichée, aucun changement de branche |
| Merge à deux parents ou plus | Tous les liens conservés ; choix du parent du diff |
| Renommage avec espaces/accents | Ancien et nouveau chemins intacts |
| Modification à la fois indexée et non indexée | Deux différences consultables distinctement |
| Conflit | État explicite ; aucune résolution automatique |
| Gros fichier ou binaire | Résumé/limite visible, fenêtre réactive |
| Dépôt modifié pendant la lecture | Relevé signalé comme susceptible d'avoir changé ; actualisation |

## Recette

Préparer un dépôt d'essai avec racine, deux branches, merge, tag, renommage,
modifications indexées/non indexées, non suivi et conflit. Comparer les liens
parents/OID et les états à Git. Tester ensuite un worktree et un dépôt vide.
Capturer les vues Iris en taille bureau et fenêtre réduite ; vérifier clavier,
sélection stable, absence de mélange avec un autre projet et zéro appel aux agents.

## Sources techniques

- [git log](https://git-scm.com/docs/git-log) : parents et ordre topologique.
- [git status](https://git-scm.com/docs/git-status) : porcelain et chemins terminés par NUL.
- [Direction artistique](../../direction-artistique.md).
