# Icône Windows

`lullaby.ico` est une exportation du [logo SVG Iris](../src/renderer/src/assets/lullaby.svg),
validé par l'utilisateur. Le SVG reste la source de référence.

L'ICO contient huit images PNG transparentes : 16, 20, 24, 32, 48, 64, 128 et
256 pixels. Le dessin garde ses proportions 40 × 44, centré dans chaque carré.
Export réalisé avec Sharp, disponible dans l'outillage local de création, sans
ajouter de dépendance au projet. Si le SVG change, régénérer ces tailles depuis
le SVG avec conservation des proportions et transparence, puis reconstruire l'ICO.

Le même fichier sert aux ressources de l'exécutable via electron-builder et à
`BrowserWindow`. Il est copié dans le paquet. `signExecutable: false` désactive
la signature tout en permettant l'application de l'icône et des métadonnées.
