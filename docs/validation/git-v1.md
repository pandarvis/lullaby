# Recette Git V1

Travail sur `feature/git-inspector`, depuis develop avec le logo Iris repris.
Le lecteur Git et son pont sont implémentés ; l'interface est en cours.

Le main utilise Git local, sans appel aux fournisseurs ni fetch. Formats NUL,
chemins littéraux et OID validés ; les identifiants de sélection correspondent à
des relevés conservés côté main. Les paramètres de désactivation des helpers et
des verrous facultatifs ne sont appliqués qu'aux processus enfants.

Les fixtures couvrent le dépôt vide, le dossier hors Git, Git absent, HEAD
détachée, worktree, merge, tag annoté, renommage avec espaces/accents, versions
index/worktree distinctes, binaire, gros diff, jonction sortante et pagination
après déplacement de référence. Les tests comparent l'index, les références et
le contenu des fichiers avant/après lecture. Un test vérifie que le filtre clean
du dépôt n'est pas exécuté ; external diff et textconv sont aussi désactivés.

Bornes : 200 commits au départ, incréments de 200 jusqu'à 2 000 ; sortie Git de
8 Mio au plus et délai de 15 secondes par processus ; différences limitées à
1 Mio. Un relevé conserve les OID de départ, mais n'est pas une transaction du
système de fichiers. Les changements détectés sont signalés ; une modification
de contenu laissant le même statut Git peut nécessiter une actualisation manuelle.

Le contrat a été étendu avec l'annulation par projet et l'heure/avertissement du
diff local. Au plus deux relevés récents par projet et seize au total sont gardés
en mémoire. Les répertoires symboliques ne sont pas parcourus pour lire les non
suivis. Les profils Git utilisant des filtres sont présentés sans conversion par
ces programmes : le diff reflète alors les octets locaux.

Sources de protocole : [git diff](https://git-scm.com/docs/git-diff) et
[git status](https://git-scm.com/docs/git-status). Recette graphique à compléter.
