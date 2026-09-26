# Lullaby V0 — validation locale sous Windows

Date : 26 septembre 2026. Spécification proposée pour revue avant implémentation.

## Objectif

Obtenir sur le poste personnel une première application graphique utilisable avec
les abonnements Claude et ChatGPT. Produire ensuite un paquet Windows à tester
sur le poste professionnel. Le succès local ne vaut pas validation sur le poste pro.

Contraintes confirmées : Windows natif, Electron, aucun Docker ou WSL, aucune clé
API facturée requise, minimum de composants à installer et réutilisation du chat.
La priorité de cette V0 est la connexion aux deux moteurs et le déploiement.

## Parcours

1. Ouvrir Lullaby et voir l'état de disponibilité des deux moteurs.
2. Choisir un dossier d'essai avec le sélecteur Windows.
3. Créer une conversation en choisissant Claude ou Codex.
4. Envoyer un message et voir la réponse progressive, les actions et les erreurs.
5. Répondre aux demandes d'autorisation ; interrompre une exécution.
6. Revenir à une conversation et la reprendre après redémarrage de Lullaby.

Le choix du fournisseur est fixé pour une conversation. Une nouvelle conversation
permet de choisir l'autre. La migration de contexte entre fournisseurs viendra plus tard.
La V0 accepte plusieurs conversations mais une seule exécution à la fois par dossier,
afin d'éviter les écritures concurrentes sans ajouter immédiatement des worktrees.

Complément proposé après précision de l'usage CLI : le projet représente le dossier,
pas une conversation unique. Après les essais de sessions créées dans Lullaby,
vérifier la reprise par identifiant d'une session Claude créée en CLI dans le même
dossier d'essai. La découverte et l'affichage de toutes les sessions externes restent
à cadrer ; ne pas annoncer leur compatibilité avant l'essai. Ne pas reprendre une
session encore utilisée activement dans un autre client.

## Interface

Fenêtre unique : liste des conversations à gauche, chat au centre, accès à un
petit panneau de diagnostic. Afficher le dossier et le fournisseur de la conversation.
États visibles : disponible, travaille, attend une réponse, interrompu, terminé,
erreur et quota atteint lorsque le moteur permet de l'identifier.
Les messages d'erreur précisent l'étape concernée sans révéler de secret.

La [direction artistique](../../direction-artistique.md) doit guider la V0 : référence
Ankama/Dofus 3, identité soignée et animations légères. Réutiliser les composants
assistant-ui avec des styles et réglages visuels communs, sans ajouter un deuxième
kit graphique. Valider une première composition avant de décliner tous les écrans.
Masquer les opérations de chat non implémentées (édition, régénération, pièces jointes).

## Architecture et dépendances

- Electron + React + TypeScript ; electron-vite pour la construction.
- assistant-ui avec état externe pour l'affichage des conversations.
- Claude Agent SDK dans le processus principal, pilotant le binaire Claude Code.
- Codex App Server, lancé comme processus enfant Windows via son protocole stdio.
- Pont preload limité et typé ; aucun accès direct aux SDK depuis la fenêtre React.
- Stockage JSON local versionné, écrit atomiquement par le processus principal.
  Les projets et sessions sont sous le répertoire de données utilisateur de Lullaby,
  jamais dans le dépôt du projet sélectionné. Pas de serveur de base de données.

Chaque conversation conserve son identifiant Lullaby, le fournisseur, l'identifiant
de session native, le dossier et les messages nécessaires à l'affichage.
Le moteur reste responsable du contexte natif et de l'exécution des outils.
Les adaptateurs convertissent ses événements sans rejouer les outils côté interface.

À l'arrêt, interrompre les exécutions et terminer les processus enfants. Au redémarrage,
signaler les tours restés incomplets ; la reprise exige une nouvelle action utilisateur.
Une réponse d'autorisation est associée à la bonne session et au bon identifiant
de demande. Une demande non prise en charge est refusée explicitement.

## Authentification

Privilégier les connexions officielles déjà présentes sur la machine. Si elles sont
absentes ou expirées, présenter les instructions du flux officiel concerné.
Codex peut utiliser le flux ChatGPT géré par App Server. Pour Claude, vérifier le
mode réellement utilisé par le SDK avec sa version épinglée avant le premier appel.
Ne pas saisir ni recopier les jetons dans l'interface Lullaby.

Si une configuration risque de sélectionner une facturation API, demander de
résoudre ce conflit avant l'appel ; ne pas modifier la configuration globale des
autres outils. Une limite d'abonnement arrête la requête sans bascule payante.

## Paquet Windows

### Réseau du poste professionnel

Prévoir dès l'essai professionnel un réglage réseau propre à Claude, pour réutiliser
le relais local que l'utilisateur démarre actuellement (probablement Px, à confirmer).
Garder son démarrage manuel lors du premier essai ; transmettre les réglages requis
au processus Claude sans les propager automatiquement à Codex. Vérifier les variables
héritées et la configuration native effective. Signaler un relais indisponible dans
le diagnostic, sans modifier les paramètres réseau globaux. Le lancement automatique
du relais n'entre pas dans ce premier essai.

### Distribution

Premier essai en développement sur la machine personnelle, puis essai d'un paquet
Windows qui embarque Electron et les bibliothèques. Pour les moteurs, vérifier les
binaires fournis officiellement et leur fonctionnement hors archive asar ; réutiliser
une installation existante explicitement détectée si nécessaire. Indiquer exactement
ce qui est inclus et ce qui reste requis avant de remettre le paquet.

Node/npm sont requis pour construire, pas comme installation globale sur le poste
utilisateur cible. Les outils propres aux projets, comme Git ou un compilateur,
restent dépendants de la tâche. Ne pas coder en dur les chemins locaux de Codex.
Ne pas lancer un téléchargement de moteur implicitement au démarrage.

Tester les restrictions proxy, certificats et processus enfants séparément sur le
poste pro. La signature et l'autorisation d'exécution ne sont pas présumées acquises.

## Validation de la V0

- Application et paquet démarrent nativement sur Windows.
- Un échange réel puis une relance fonctionnent avec chaque abonnement.
- Essai complémentaire : reprise d'une session Claude CLI arrêtée, par identifiant,
  dans son dossier d'essai et avec sa configuration native.
- Lecture et modification d'un fichier d'essai, avec autorisation lorsque requise.
- Arrêt d'une exécution ; reprise d'une conversation après redémarrage.
- Aucun mélange de messages en changeant de conversation pendant une réponse.
- Moteur absent et authentification manquante donnent une erreur compréhensible.
- Vérifier le verrou d'exécution par dossier et le nettoyage des processus à la fermeture.
- Tests ciblés sur conversion/déduplication des événements, routage des autorisations
  et stockage ; contrôle visuel manuel de la fenêtre et essai du paquet final.

Les appels réels consommeront les quotas des abonnements. Ils utiliseront un dossier
d'essai dédié, sans modifier les autres projets de la machine.

## Après la V0

Tableau de bord multi-projets, parallélisme isolé, chronos humains et agents, export
de reporting, gestion avancée des profils réseau et éventuelle passation Claude/Codex. Ces besoins restent
dans l'objectif Lullaby, mais ne retardent pas le premier test des deux connexions.

## Références vérifiées

- [SDK Claude et binaire natif](https://code.claude.com/docs/en/agent-sdk/quickstart)
- [Codex App Server](https://learn.chatgpt.com/docs/app-server)
- [assistant-ui avec état externe](https://www.assistant-ui.com/docs/runtimes/custom/external-store)
- [Contraintes du poste professionnel](../../poste-pro.md)
