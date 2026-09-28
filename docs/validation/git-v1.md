# Recette Git V1

Travail sur `feature/git-inspector`, depuis develop avec le logo Iris repris.
G1–G3 sont implémentés : lecteur et pont limités, graphe SVG, détails de commit,
choix du parent de merge, arborescence des changements et différences. La navigation
Conversations/Git conserve le chat monté et son brouillon.

## Vérifications du 26 septembre 2026

- `npm test` : **63 tests réussis**, 5 tests réels des fournisseurs ignorés car
  opt-in. Aucun appel modèle nécessaire pour cette tranche Git.
- `npm run typecheck` et `npm run build` : réussis sur le code final.
- Paquet Windows construit ; après le dernier ajustement CSS du diff, sortie
  reconstruite et recopiée dans le paquet et l'aperçu local. Exécution hors checkout
  observée dans `C:\Sources\Lullaby-preview-0.1.0`.
- Relecture indépendante : deux problèmes importants corrigés avec régressions
  reproduites avant correction (actualisation du fichier sélectionné et remplacement
  fichier/dossier dans l'arbre). Aucun problème mineur différé.
- La recette graphique a détecté et corrigé le SVG du graphe réduit par les styles
  globaux des icônes ; une régression utilise désormais la feuille Iris réelle.

| Contrôle | Résultat et portée |
| --- | --- |
| Fixture Windows avec espaces/accents | Ouverture native et lecture réussies |
| Graphe à quatre commits avec deux branches, merge et tag annoté | Topologie et références comparées à Git local |
| Parents du merge | Sélection clavier du second parent ; fichier et diff correspondants observés |
| Index et dossier de travail | Même fichier dans deux groupes ; contenu distinct confirmé |
| Renommage | Ancien et nouveau chemin avec accents affichés |
| Binaire non suivi | Résumé « Fichier binaire non suivi » observé, sans interprétation textuelle |
| Actualisation d'un commit sélectionné | Parent, fichier et diff retrouvés après la nouvelle lecture |
| Absence de mutation | Index de la fixture graphique inchangé ; index, références et contenu également contrôlés par tests |
| Brouillon et réponses tardives | Tests UI : brouillon conservé, ancien projet/fichier ignoré |
| Historique de 2 000 commits | Calcul de disposition mesuré à 3,25 ms ; ce chiffre ne mesure pas le rendu DOM complet |
| Fenêtre réduite | Observée autour de 1 309 px ; contrôle réel sous 850 px restant à faire |

Les parcours complets V0 encore ouverts restent décrits dans la
[recette Windows](v0-windows.md). Le poste professionnel et son proxy n'ont pas
été testés ; cette livraison ne vaut pas acceptation de toute la V1.

## Lecture et limites

### Complément : fiches au survol

Implémenté sur `feature/git-hover` : délai de 250 ms au survol, fiche immédiate
au focus clavier, fermeture par Échap, sortie de la fiche, changement de relevé,
défilement extérieur ou sortie de la vue Git. Un court délai de sortie permet de
déplacer le pointeur dans la fiche. La fiche reste dans la fenêtre et respecte
la préférence de réduction des animations.

Les branches et tags affichés pointent exactement sur le commit. Un trait décrit
la relation commit/parent et signale un parent hors des commits chargés ; il ne
prétend pas représenter une branche d'origine. Le rendu utilise le relevé existant.

Quatre tests ajoutés : délai/contenu/transfert vers la fiche, focus/Échap/références,
lien et parent hors page, annulation au remplacement du relevé ou à la fermeture
de la vue. Ils échouaient avant implémentation. Suite finale : 67 réussis, 5 essais
réels opt-in ignorés ; build et TypeScript réussis. Fiche de merge et parcours
clavier observés dans le paquet mis à jour avec la sortie compilée.

### Lecture Git

Le main utilise Git local, sans appel aux fournisseurs ni fetch. Formats NUL,
chemins littéraux et OID validés ; les identifiants de sélection correspondent à
des relevés conservés côté main. Les paramètres de désactivation des helpers et
des verrous facultatifs ne sont appliqués qu'aux processus enfants.

Les fixtures couvrent le dépôt vide, le dossier hors Git, Git absent, HEAD
détachée, worktree, merge, tag annoté, renommage avec espaces/accents, versions
index/worktree distinctes, conflit réel, gitlink de sous-module, binaire, gros diff, jonction sortante et pagination
après déplacement de référence. Les tests comparent l'index, les références et
le contenu des fichiers avant/après lecture. Un test vérifie que le filtre clean
du dépôt n'est pas exécuté ; external diff et textconv sont aussi désactivés.

Bornes : 200 commits au départ, incréments de 200 jusqu'à 2 000 ; sortie Git de
8 Mio au plus et délai de 15 secondes par processus ; différences limitées à
1 Mio et rendu limité à 5 000 lignes, avec indication de troncature. Un relevé
conserve les OID de départ, mais n'est pas une transaction du
système de fichiers. Les changements détectés sont signalés ; une modification
de contenu laissant le même statut Git peut nécessiter une actualisation manuelle.

Le contrat a été étendu avec l'annulation par projet et l'heure/avertissement du
diff local. Au plus deux relevés récents par projet et seize au total sont gardés
en mémoire. Les répertoires symboliques ne sont pas parcourus pour lire les non
suivis. Les profils Git utilisant des filtres sont présentés sans conversion par
ces programmes : le diff reflète alors les octets locaux.

## Arbitrages de réalisation

Ces décisions complètent le plan initial et conservent le relevé de réalisation.

1. Réutiliser le worktree libre, partir de develop local et reprendre le commit
   Iris : conserve le visuel approuvé ; coût, commit d'icône présent sur deux branches.
2. Continuer la tranche Git indépendante à la demande de l'utilisateur malgré les
   recettes V0 ouvertes : coût, aucune acceptation globale implicite de la V1.
3. Suivre G1–G3 manuellement, le helper de suivi attendant « Task N » : coût,
   tenue manuelle du registre de progression.
4. Ajouter annulation et date/avertissement du diff au contrat : nécessaires aux
   lectures remplacées ; coût, un endpoint IPC limité supplémentaire. La correction
   de relecture distingue ensuite l'annulation des listes de celle des diffs.
5. Désactiver les filtres clean/smudge/process déclarés, en plus des helpers de
   diff, dans les seuls processus enfants : un test avait démontré leur exécution
   pendant une lecture ; coût, affichage des octets locaux sans conversion.
6. Brancher navigation et pagination du graphe lors de G3 : évite un état temporaire
   jetable ; coût, graphe utilisable seulement au commit d'assemblage suivant.
7. Borner le rendu à 5 000 lignes en plus du plafond de 1 Mio : limite le DOM ;
   coût, troncature explicite des très longs fichiers.
8. Distinguer le contenu brut d'un non-suivi d'un diff unifié : conserve son texte
   sans inventer d'en-têtes ; coût, un champ supplémentaire dans le contrat partagé.

Sources de protocole : [git diff](https://git-scm.com/docs/git-diff) et
[git status](https://git-scm.com/docs/git-status).
