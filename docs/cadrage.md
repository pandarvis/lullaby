# Lullaby — cadrage initial

Date : 26 septembre 2026. Proposition à discuter, architecture non figée.

## Besoin confirmé

Application personnelle sur Windows, souhaitée sous Electron. Vue des projets et
des sessions actives, ouverture d'un chat par session, choix Claude/Codex et suivi
du temps pour les reportings. Utiliser les abonnements existants uniquement.
Réutiliser les composants ou applications maintenus par d'autres autant que possible.
Priorité précisée : réduire les logiciels à installer et les exécutables à faire
autoriser sur un poste qui bloque par défaut. La réutilisation doit servir cette
contrainte, pas ajouter une plateforme à exploiter.
Contrainte confirmée : Docker et WSL sont bloqués. La cible est Windows natif,
sans conteneur ni environnement Linux requis.
Le poste professionnel devra être évalué séparément : logiciels autorisés, proxy,
certificats et connexion aux comptes. Son fonctionnement n'est pas encore vérifié.
La [direction artistique](direction-artistique.md) prend pour référence les interfaces
Ankama/Dofus 3 : identité soignée, UX exigeante et animations discrètes.

## Direction retenue pour la réutilisation

Application Electron indépendante, avec React, les composants du chat embarqués
et les intégrations officielles Claude/Codex. Réutiliser une bibliothèque graphique
comme assistant-ui ; maintenir les deux adaptateurs, le stockage et la gestion
des processus dans Lullaby. Aucune application tierce complète ni serveur séparé
n'est prévu comme socle.

Distinguer les dépendances de développement (outils de compilation), les
bibliothèques embarquées (sans installation individuelle) et les exécutables
externes (susceptibles de nécessiter une autorisation). Réduire aussi le nombre
de bibliothèques pour limiter maintenance et surface à auditer. Un seul paquet
distribué ne signifie pas un seul processus ou exécutable autorisé.

Source : [assistant-ui ExternalStoreRuntime](https://www.assistant-ui.com/docs/runtimes/custom/external-store).

assistant-ui reste le candidat pour le chat, à condition de vérifier ses dépendances
et son fonctionnement dans le paquet final. AI Elements est une alternative,
pas une bibliothèque à ajouter en plus.
Source : [AI Elements](https://elements.ai-sdk.dev/docs).

## Les protocoles et l'affichage

### Dossiers et sessions existantes

Usage précisé par l'utilisateur : ouvrir un dossier de projet, lancer Claude CLI,
puis reprendre une session avec `resume`. Le parcours de Lullaby doit donc distinguer
le projet (dossier local) des conversations rattachées à ce dossier. Ouvrir un projet
doit permettre de choisir une conversation existante ou d'en créer une nouvelle.

Étudier la reprise de sessions Claude créées hors de Lullaby, au lieu de limiter
durablement l'interface aux sessions qu'elle crée elle-même. Le SDK documente
l'énumération, la lecture et la reprise par identifiant des sessions locales.
Cette capacité est une piste d'intégration, pas un essai réussi avec la version
installée. Préserver le dossier de travail et la configuration native ; ne pas
reprendre simultanément une même session en CLI et dans Lullaby. La reprise d'un
historique ne signifie pas s'attacher à un processus CLI déjà en cours.

Source : [sessions du SDK Claude](https://code.claude.com/docs/en/agent-sdk/sessions).

### Adaptateurs

Nous intégrons des moteurs d'agents, pas uniquement les API de modèles.

L'exigence de [fidélité aux moteurs](fidelite-moteurs.md) précise le chargement des
instructions et skills, la reprise native et les critères de comparaison avec les
clients officiels. Les catégories de sessions n'imposent aucun rôle restrictif.

- Claude Agent SDK : flux de messages et d'événements via une bibliothèque TypeScript.
- Codex App Server : commandes et événements JSON-RPC ; transport local possible via stdio.

Le SDK Claude est une bibliothèque de pilotage qui lance le moteur Claude Code
dans un processus enfant. « CLI » désigne ici l'exécutable sous-jacent, pas une
interface terminal que l'utilisateur devra utiliser au quotidien. Lullaby fournit
le chat graphique ; Claude Desktop n'est pas requis. Les distributions actuelles
du SDK peuvent embarquer le binaire natif, selon la plateforme et les options
d'installation. Cela évite éventuellement une installation séparée, pas l'exécution
du moteur ni son autorisation sur le poste.
Source : [installation du SDK Claude](https://code.claude.com/docs/en/agent-sdk/quickstart).

De même, Codex App Server est un mode du moteur Codex, lancé en arrière-plan.
Le SDK et l'exécutable ne sont donc pas deux solutions concurrentes.

Sources : [streaming Claude](https://code.claude.com/docs/en/agent-sdk/streaming-output),
[Codex App Server](https://learn.chatgpt.com/docs/app-server).

Dans l'option indépendante, chaque adaptateur traduit ces événements vers un
format d'affichage commun. assistant-ui affiche les messages et appelle nos
fonctions d'envoi ou d'annulation. Il ne remplace pas les moteurs.

```text
Interface Lullaby / composants assistant-ui
                 |
     État commun des projets et sessions
                 |
       Pont Electron limité (preload)
                 |
       Gestionnaire local des sessions
          /                     \
Adaptateur Claude         Adaptateur Codex
Claude Agent SDK          Codex App Server
Abonnement Claude         Abonnement ChatGPT
```

Événements proposés : message ajouté, fragment de texte, action commencée/terminée,
question ou autorisation attendue, état de session, erreur et fin de tour.
Chaque événement porte les identifiants de projet, session et exécution.
Conserver les identifiants du moteur et dédupliquer les événements de reprise ;
ne pas ajouter deux fois les fragments et le message final complet.

Les capacités restent explicites : envoyer, interrompre, reprendre, répondre à une
autorisation et, si disponible, réorienter une exécution. Un bouton absent du moteur
ne doit pas promettre une action équivalente. Les outils continuent de s'exécuter
dans les moteurs ; l'interface affiche leurs événements sans les réexécuter.

## Structure proposée si application indépendante

```text
src/
  main/
    providers/claude/   # bibliothèque et événements Claude
    providers/codex/    # protocole et événements Codex
    sessions/          # démarrage, reprise, interruption, processus
    storage/           # données locales et migrations
    diagnostics/       # disponibilité et réseau
  preload/             # interface limitée entre fenêtre et processus principal
  renderer/
    projects/          # tableau de bord
    chat/              # composants assistant-ui
    time/              # chronos et reporting
    settings/          # fournisseurs et profils réseau
  shared/              # types de messages, états et capacités
```

Un seul dépôt et une seule application au départ. Les SDK restent hors de la
fenêtre React. Stockage local des projets, liens vers les sessions natives,
messages utiles à l'affichage et temps ; authentification confiée aux outils officiels.
Prévoir un paquet Windows autonome : pas de Node/npm, serveur web séparé, Docker
ou WSL à installer pour utiliser Lullaby. Node/npm restent des outils de construction
sur le poste de développement. Les moteurs Claude/Codex sont les dépendances
d'exécution à examiner : réutiliser une installation autorisée ou étudier leur
distribution officielle compatible, sans supposer qu'un binaire embarqué sera permis.
Git et les outils de compilation des projets restent requis selon les tâches demandées.
Établir l'inventaire exact des exécutables et des destinations réseau lors du premier
paquet ; vérifier les exigences de signature et d'installation avec le poste cible.

## Périmètre proposé de la première version

### Trajectoire V0 / V1 / V2

- **V0 : validation technique**, avec les deux abonnements sur Windows, puis essai
  du paquet sur le poste professionnel.
- **V1 : priorité au développement**, confirmée par l'utilisateur : projets,
  sessions et agents, chat, outils et reprise fidèles aux moteurs. La rédaction et
  la maintenance des README, décisions et autres documents du dépôt restent des
  tâches accessibles aux agents dans ce même espace. Le périmètre détaillé reste
  à préciser ; cette priorité ne valide pas toute la spécification V0.
- **V2 : piste documentaire à explorer**, éventuellement un outil spécialisé et
  une UX dédiée. Aucun format, éditeur ou périmètre n'est encore choisi.

Piste UX proposée pour cette V2 : un espace « Documents » rattaché au projet,
associant document consultable/éditable, conversation de l'agent et modifications
à relire. Comparer cette approche à un simple aperçu à côté du chat avant de choisir.
Réutiliser projets, sessions et identité Iris ; déterminer les formats et usages
réels avant de retenir une bibliothèque. Cette exploration ne bloque pas la V1
et n'ajoute aucune dépendance pour le moment.

### Cible fonctionnelle

Le besoin Git est confirmé : **graphe commits/branches/merges et arborescence des
fichiers modifiés**, tous les deux. La [spécification Git V1](superpowers/specs/2026-09-26-v1-git-design.md)
propose une première tranche de consultation avec diffs, après le socle fiable.
Les [plans d'implémentation](feuille-de-route.md) détaillent ces deux jalons.

Notifications Windows explicitement écartées pour le moment. Les alertes internes,
badges et petits sons réglables restent une piste de confort, sans dépendance au
centre de notifications du système ; leur intégration suit les jalons socle et Git.

Le premier livrable sera la [V0 de validation locale](superpowers/specs/2026-09-26-v0-windows-design.md)
sur le poste personnel, puis son paquet sera testé sur le poste professionnel.
Les éléments ci-dessous décrivent la cible fonctionnelle plus large après cette V0.

1. Ajouter un dossier de projet, créer une session Claude ou Codex.
2. Afficher et reprendre la conversation, les actions, les erreurs et les autorisations.
3. Voir plusieurs sessions et conserver leur activité en changeant de vue.
4. Rouvrir l'application et retrouver les sessions persistées ; une exécution
   interrompue par l'arrêt de l'application est signalée, pas annoncée comme active.
5. Suivre le temps par session, avec cumul par projet, pause, correction, note et
   export CSV. Afficher séparément le temps humain et la durée des exécutions des
   agents. Un total global seul ne répond pas au besoin de reporting.

Chaque entrée de temps se rattache à une session et à son projet. Le total projet
agrège ses sessions sur la période choisie. Ne pas compter une même plage de temps
humain dans plusieurs sessions simultanées ; le cumul des agents peut en revanche
dépasser le temps écoulé si plusieurs agents travaillent en parallèle. La méthode
de saisie/chronométrage et le traitement d'une activité hors session restent à cadrer.

Hypothèses à confirmer : fournisseur choisi par session ; reprise par un autre
fournisseur reportée ; un seul chrono humain actif. Le premier essai crée ses propres
sessions puis vérifie une reprise Claude depuis la CLI sur un dossier d'essai.
Un catalogue complet des sessions externes et le pilotage des sous-agents restent
à cadrer séparément.

Le parallélisme sur un même dépôt doit utiliser des répertoires Git séparés ou
empêcher les écritures simultanées. Pas de bascule automatique vers une API facturée.
Ne pas confondre une authentification réussie avec la présence de quotas disponibles.

## Étapes proposées et critères de décision

1. **Faisabilité de déploiement** : recenser ce qui doit être installé, embarqué et
   autorisé ; préparer tôt un paquet Windows minimal et vérifier les processus enfants.
   Valider sur le poste cible avant d'élargir les fonctionnalités.
2. **Essai d'intégration** : interface de chat réutilisée et deux moteurs sur un
   dossier d'essai. Vérifier abonnement, streaming, reprise, arrêt et autorisations.
   Confirmer ce périmètre avant de rédiger le plan d'implémentation détaillé.
3. **Tranche utilisable** : un projet et les deux fournisseurs, conversation persistée,
   erreurs explicites. Puis supervision de plusieurs projets et sessions.
4. **Temps et reporting** : vérifier notamment qu'une heure avec plusieurs agents
   ne crée pas plusieurs heures de travail humain.
5. **Validation professionnelle** : appliquer la checklist du poste pro. Les résultats
   de la machine personnelle ne valident pas les restrictions de cette machine.

La vérification de l'intégration devra couvrir une autorisation réelle, une
interruption, une reprise, une perte de connexion et l'association correcte des
événements quand deux sessions tournent. Aucun de ces essais n'a encore été exécuté.

## Inventaire local observé

### Réseau propre à chaque moteur

Le poste professionnel nécessite, d'après l'utilisateur, un relais local lancé
avant Claude, probablement Px (identité et commande à confirmer). Prévoir des
réglages proxy/certificats par moteur, appliqués à son processus au lancement,
sans modifier l'environnement global ni écraser les réglages administrés.
Le fonctionnement supposé de ChatGPT Desktop sans relais ne valide pas Codex.
Un bouton de lancement du relais depuis Lullaby est demandé ; son branchement
attend la confirmation de la commande Px. Le lancement est explicite, avec état
visible ; aucun démarrage automatique à l'ouverture de Lullaby n'est décidé.
Le premier diagnostic pourra réutiliser un relais lancé manuellement. Ne pas arrêter
un processus démarré hors de Lullaby. Voir les relevés dans
[la checklist professionnelle](poste-pro.md).

### Exécutables du poste personnel

Le 26 septembre 2026 : Git 2.49.0.windows.1, Node 22.16.0, npm 10.9.2,
Claude Code 2.1.220 et Codex CLI 0.158.0-alpha.2.1 sont accessibles.
Versions uniquement : comptes et abonnements non testés pendant ce cadrage.
Le chemin Codex observé dépend de l'installation de l'application ; ne pas le
coder en dur. Évaluer une version stable compatible lors de l'intégration.

## Abonnements

Codex App Server dispose d'une connexion ChatGPT gérée par Codex.
Le centre d'aide Claude indique dans sa mise à jour du 15 juin 2026 que SDK,
mode non interactif et applications tierces continuent d'utiliser les quotas
d'abonnement. Certaines pages du SDK conservent des formulations plus restrictives :
garder la connexion dans le flux officiel et vérifier la version effectivement utilisée.

Sources : [authentification Codex](https://learn.chatgpt.com/docs/auth),
[abonnement et SDK Claude](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan),
[conditions d'intégration Claude](https://code.claude.com/docs/en/legal-and-compliance).
