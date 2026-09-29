# Lullaby

Un atelier Windows pour vos projets et agents de développement : Electron,
interface Iris, chat assistant-ui, Claude Code et Codex via les abonnements existants.

Le premier socle est intégré à `develop`. Il permet
plusieurs projets et conversations, les autorisations, l'arrêt, la reprise native
et des réglages réseau par moteur. La recette et les limites sont dans
[l'état du projet](docs/etat-projet.md). Le poste professionnel reste à vérifier.

## Développer

Avec Node compatible (22.16 testé) et Git for Windows :

```powershell
npm ci
node node_modules/electron/install.js
npm run dev
```

```powershell
npm test
npm run typecheck
npm run package:win
```

Le paquet se trouve dans `dist/win-unpacked` : conserver tout ce dossier avec
`Lullaby.exe`. Il embarque Electron et le moteur Claude du SDK ; Codex reste un
exécutable officiel externe. Aucun Docker, WSL, serveur ni clé API requis.
Les connexions officielles Claude/ChatGPT doivent déjà être présentes.

- [Commandes et prérequis de développement](docs/developpement.md)
- [Documentation du projet](docs/README.md)
- [Vérifications sur le poste professionnel](docs/poste-pro.md)
- [Contribuer : Gitflow et cohabitation entre agents](CONTRIBUTING.md)

Interface : coquille Iris dense (barre de titre intégrée, conversations par projet,
panneau droit Git/Aperçu). Voir la [direction artistique](docs/direction-artistique.md).
