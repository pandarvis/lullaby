# Recette — coquille Iris

Date : 28 septembre 2026. Branche `feature/iris-shell`.
Référence : [maquette](../mockups/iris-shell.html), [spec](../superpowers/specs/2026-09-28-iris-shell-design.md).

Méthode : application de développement pilotée par son port de débogage Chromium,
captures du renderer. Windows 11 à 150 % de mise à l'échelle, état de démonstration
avec 3 projets locaux. Aucune conversation réelle avec un moteur n'a été lancée.

| Vérification | Résultat |
| --- | --- |
| Barre de titre 40 px, boutons Windows natifs, fenêtre déplaçable | OK : barre de 40 px et boutons natifs visibles sur une capture du bureau. Zone de déplacement non testée à la main. |
| Barre latérale : groupes par projet, lignes 32 px, repli mémorisé | OK, y compris le point ambre sur un groupe replié. |
| Recherche (`Ctrl+K`, Échap) | Champ OK après correction (règle héritée sur `label`). `Ctrl+K` et Échap couverts par tests automatisés seulement. |
| Précédent/suivant (boutons et `Alt+←/→`) | Tests automatisés ; état des boutons visible et correct. |
| Nouvelle conversation (+ d'un groupe, `Ctrl+N` sans projet) | + d'un groupe : OK, écran Claude Code / Codex et reprise CLI. `Ctrl+N` sans projet (sélecteur) : test automatisé. |
| Panneau droit : Git, Aperçu HTML, redimensionnement, `Ctrl+J` | Git (historique réel du dépôt), onglet Aperçu vide et fermeture : OK. Redimensionnement : chemin clavier couvert par tests, glissement à la souris non testé. Aperçu HTML réel non testé (pas d'exécution de moteur). |
| Fenêtre < 1 000 px : panneau par-dessus le chat | OK (fenêtre émulée à 900 px). |
| Sans animations et mouvement réduit respectés | Non testé visuellement ; les règles CSS sont présentes. |
| Navigation au clavier dans la barre latérale | Flèches : tests automatisés ; focus visible : non vérifié. |
| Paramètres sous la barre de titre (fenêtre basse) | Corrigé après relecture finale ; non revérifié à l'écran. |
| `npm test` et `npm run typecheck` | OK : `npm test` 163 réussis, 5 ignorés (34 fichiers passés, 2 ignorés) ; `npm run typecheck` sans erreur. |

Corrections trouvées pendant la recette et commitées : champ de recherche contre la
règle héritée sur `label`, bulle utilisateur doublée, chevauchement de l'avis dans
l'en-tête de session, défilement horizontal de la grille de l'Atelier avec le
panneau ouvert.

Écarts constatés et suites :

- Les Paramètres gardent en partie l'ancienne échelle visuelle (titres d'environ
  18–20 px, grandes cartes) : à reprendre.
- Aucune conversation réelle avec un moteur n'a été exécutée dans cette recette.
- Poste professionnel non testé.
