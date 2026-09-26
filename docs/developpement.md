# Développement local

Le produit est en cours d'implémentation sur `feature/windows-agent-foundation`.
Les anciennes maquettes HTML restent des supports de conception indépendants.

## Commandes disponibles

Depuis le checkout produit, avec Node 22.12 ou ultérieur compatible :

```powershell
npm ci
node node_modules/electron/install.js
npm run dev
npm test
npm run build
```

Electron 44 sépare son téléchargement de l'installation npm. La commande explicite
installe le runtime local au projet, pas globalement sur Windows. Le paquet final
n'exigera pas npm sur le poste utilisateur.

`npm run typecheck` vérifie les types. `npm run package:win` est réservé à la tâche
de packaging : sa configuration n'est pas encore prête.

Versions du socle : Electron 44.4.5, electron-vite 5.0.0, Vite 7.3.6, React 19.3.0,
TypeScript 7.0.2 et Vitest 5.0.2. Vite 8 n'est pas accepté par electron-vite 5.
Les versions exactes et transitives sont conservées dans `package-lock.json`.

Les tests par défaut ne contactent aucun fournisseur. Les preuves d'essais réels
seront enregistrées séparément dans `docs/validation/`.
