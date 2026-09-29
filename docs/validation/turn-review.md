# Récapitulatif des interventions

La carte s’affiche à la fin des **nouvelles** interventions ayant des changements
observés : fichiers concernés, lignes ajoutées/supprimées, quatre fichiers visibles
puis dépliage. Examiner ou un fichier ouvre un panneau de différences à côté du chat
(empilé en fenêtre étroite). Le panneau réutilise DiffView et ses numéros de lignes.
Aucune action d’annulation, d’édition, de commit ou de staging n’est ajoutée.

## Ce qui est comparé

Le main capture le contenu courant avant de démarrer Claude/Codex, puis après la
fermeture de l’exécution, y compris après interruption. Le verrou de dossier reste
tenu pendant la finalisation. Le résultat est stocké dans le message de récapitulatif,
avec son identifiant d’intervention et sa date ; il reste lisible après redémarrage.
Les anciennes conversations ne sont pas recalculées rétroactivement.

Le relevé compare les fichiers sur disque, **pas HEAD contre le dossier actuel** :
les modifications déjà présentes sont la base de comparaison et un commit de l’agent
ne fait pas disparaître le récapitulatif. Il inclut aussi toute édition externe
effectuée pendant cet intervalle ; il ne certifie pas l’auteur de chaque changement.
Les permissions et politiques natives des moteurs restent inchangées.

Git doit être disponible et le dossier doit déjà appartenir à un dépôt au début.
`git ls-files` sélectionne les fichiers suivis et non ignorés dans le dossier du
projet. Les dépendances ignorées, liens et sous-modules ne sont pas parcourus.
Sans relevé initial/final exploitable, une notice remplace les compteurs.

## Limites explicites

- Capture bornée à 10 000 chemins lus, 1 Mio par fichier, 32 Mio de contenu et
  cinq secondes de parcours ; commandes de relevé Git limitées à trois secondes.
- Revue limitée à 100 fichiers, différences individuelles de 128 Kio, environ
  1 Mio de différences au total et dix secondes de calcul (plus la commande en cours).
- Fichiers binaires : entrée sans compteurs de lignes. Fichier inaccessible, lien,
  lecture instable ou limite atteinte : relevé partiel et compteur absent.
- Renommages présentés comme suppression/ajout. Changements de permissions seuls,
  fichiers ignorés et activité d’un processus restant en arrière-plan après le relevé
  ne sont pas couverts comme des modifications textuelles de cette intervention.
- Les versions transitoires créées puis supprimées pendant le travail ne figurent
  pas dans le résultat avant/après. Aucun pourcentage ou bilan de tests n’est inventé.

Les différences sont calculées par Git sur deux fichiers temporaires, nettoyés
ensuite. L’index, les commits et les fichiers du projet ne sont pas modifiés par le
relevé. Pas de dépendance supplémentaire ni d’appel fournisseur.

## Validation

Fixtures Git et faux moteur : préexistence de changements manuels, commit intermédiaire,
ajout/suppression, binaire, limite de taille, junction extérieure, absence de dépôt,
verrou pendant finalisation, stockage/rechargement et isolation des conversations.
Test du chat assistant-ui : carte sans texte LLM, sélection du fichier, ouverture et
fermeture du panneau enregistré. Les fichiers de test sont temporaires ; aucune
conversation privée n’est modifiée pour fabriquer une démonstration.

Suite complète : **126 tests réussis, 5 essais fournisseurs opt-in ignorés**.
TypeScript, build et paquet Windows réussis (`npm run package:win`).
L’aperçu personnel a été mis à jour et redémarré : accueil et projets existants
retrouvés, aucune intervention lancée automatiquement.
Un essai d’intervention réelle via abonnement reste à faire par l’utilisateur.
