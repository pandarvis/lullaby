# Recette V0 Windows — 26 septembre 2026

Le socle est intégré à develop sur demande explicite. La recette complète reste
ouverte : une compilation réussie n'établit pas la parité avec les clients officiels.

| Vérification | Résultat |
| --- | --- |
| `npm test` après corrections de relecture | 42 réussis ; 5 essais réels opt-in ignorés |
| `npm run typecheck` | Réussi |
| `npm run package:win` après corrections | Réussi, dossier `dist/win-unpacked` |
| Claude réel après correction du lancement | Refus d'écriture et interruption réussis (`LULLABY_LIVE_TEST=claude-control`) |
| Claude : skill, écriture, reprise SDK et CLI | Réussis avant relecture ; voir [recette Claude](claude-local.md) |
| Codex : abonnement, instructions, skill, écriture, reprise | Réussis ; voir [recette Codex](codex-local.md) |
| Paquet lancé hors checkout | Observé avant corrections finales ; projets et historique chargés |
| Recette graphique du paquet final | À terminer, dont Codex, approbations, arrêt et reprise |
| Poste pro, Px, certificat d'entreprise | Non testés |

La relecture a identifié trois problèmes corrigés avec des tests reproduisant
leur échec : le SDK Claude imposait le mode de permission `default`, l'état d'une
session pouvait être détaché pendant le démarrage concurrent d'une autre, et un
arrêt au démarrage pouvait perdre l'identifiant natif nécessaire à la reprise.
Les tests correspondants passent après correction. Le hook officiel de lancement
retire uniquement le mode `default` implicite du SDK épinglé ; le CLI conserve la
résolution de sa configuration native. Aucun mode plus permissif n'est injecté.

## Paquet et choix de réalisation

Conserver le dossier complet avec `Lullaby.exe`, pas seulement l'exécutable.
Electron et Claude sont embarqués ; Codex doit être installé séparément et connecté.
Le paquet est non signé et utilise encore l'icône Windows par défaut d'Electron.
Les réglages utilisateur et les conversations ne font pas partie du paquet.

- Vite 7 retenu pour la compatibilité avec electron-vite 5 ; aucune résolution
  forcée des dépendances incompatibles.
- ASAR désactivé pour cette V0 afin de conserver l'accès aux ressources et au
  binaire natif Claude. Contrepartie : dossier volumineux (environ 630 Mo lors de
  la première recette) ; optimiser le packaging reste possible ultérieurement.
- Worktree Git créé manuellement après échec de l'outil natif depuis le dossier
  parent ; il n'est pas géré par l'application Codex et reste conservé.
- Validation IPC extraite dans son propre module pour tester sans charger Electron.
- Suivi manuel des tâches T1–T7, leurs intitulés ne correspondant pas au parseur
  du skill ; les preuves et réserves sont publiées dans ces documents.
- Sélection finale de dossier différée pendant le développement puis vérifiée
  en interface native ; espace et accent dans le chemin testés.
- Le modèle Codex local refusé n'a pas été remplacé automatiquement. La recette
  a sélectionné explicitement le modèle par défaut du catalogue natif.
- Noms textuels des fournisseurs tant que leurs logos officiels ne sont pas obtenus
  avec provenance ; les éléments Iris sont en SVG.

L'historique antérieur des sessions importées reste géré par les moteurs ; seuls
les nouveaux échanges sont projetés dans le chat. Les refus/arrêts Codex sont
couverts par un moteur simulé, leur recette réelle reste ouverte. Voir également
la [recette d'interface](interface-v0.md) et le [poste professionnel](../poste-pro.md).
