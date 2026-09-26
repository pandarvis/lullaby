# Vérifications sur le poste professionnel

Préparé le 26 septembre 2026. À exécuter sur le poste concerné : les résultats
de l'ordinateur personnel ne suffisent pas. Cette checklist n'installe rien.
Docker et WSL sont confirmés bloqués : aucune étape ne doit les nécessiter.
La cible est une exécution Windows native.

## 1. Inventaire local

Dans PowerShell, ce bloc indique les exécutables disponibles et leur version :

```powershell
$lullabyTools = @('git', 'node', 'npm', 'claude', 'codex')
foreach ($lullabyTool in $lullabyTools) {
    $lullabyCommand = Get-Command $lullabyTool -ErrorAction SilentlyContinue |
        Select-Object -First 1
    if ($lullabyCommand) {
        Write-Output "$lullabyTool : disponible"
        & $lullabyCommand.Source --version
    } else {
        Write-Output "$lullabyTool : absent du PATH"
    }
}
```

Un refus d'exécution est un résultat à conserver. Ne pas modifier les politiques
PowerShell, antivirus ou proxy pour faire passer ce contrôle.

Prérequis d'utilisation envisagés : Windows, accès à un dossier de travail et
moteurs autorisés. Git et les outils du projet dépendent des tâches à exécuter.
Node/npm sont des outils de développement : leur absence sur le poste professionnel
ne doit pas bloquer l'utilisation du paquet final. Le bloc ci-dessus les relève
seulement pour l'inventaire. Le paquet Electron devra embarquer son runtime et
ses bibliothèques ; aucun serveur web séparé, WSL ou Docker n'est prévu.

L'installation ou l'intégration des moteurs Claude/Codex reste à déterminer.
Un paquet unique peut lancer plusieurs exécutables : chacun peut être bloqué.
Vérifier les exigences d'autorisation, de signature du paquet et des exécutables
enfants, et la méthode de distribution acceptée (installateur ou autre).

Sources : [electron-vite](https://electron-vite.org/guide/),
[Claude sur Windows](https://code.claude.com/docs/en/setup).

## 2. Repérer les réglages existants sans afficher les secrets

```powershell
$lullabyVariables = @(
    'HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY', 'NO_PROXY',
    'NODE_EXTRA_CA_CERTS', 'SSL_CERT_FILE',
    'ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN',
    'OPENAI_API_KEY', 'CODEX_API_KEY', 'CLAUDE_CODE_OAUTH_TOKEN'
)
foreach ($lullabyName in $lullabyVariables) {
    [pscustomobject]@{
        Variable = $lullabyName
        Defined = -not [string]::IsNullOrEmpty(
            [Environment]::GetEnvironmentVariable($lullabyName)
        )
    }
}
```

Ce relevé couvre l'environnement du processus courant, pas tous les réglages
système, fichiers de configuration ou politiques administrées. Une variable
absente ne prouve pas l'absence de proxy. Une clé API présente est à examiner
avant un essai : elle peut changer le mode d'authentification.
Ne pas copier de jetons, de fichiers d'identifiants ou d'URL de proxy contenant
un mot de passe dans Git ou dans un compte rendu.

## 3. Réseau et restrictions à identifier

- Le blocage Claude Desktop vise-t-il seulement l'application, ou aussi Claude Code CLI ?
- Les exécutables locaux et processus enfants nécessaires sont-ils autorisés ?
- La connexion officielle au compte et son retour local dans le navigateur fonctionnent-ils ?
- Quel proxy est requis : explicite, automatique/PAC, authentification intégrée ?
- Un certificat d'entreprise est-il nécessaire ? Obtenir son chemin auprès de l'IT.
- L'installation d'un paquet Lullaby et l'exécution de ses moteurs seraient-elles permises ?
- Seulement si ce poste doit aussi construire l'application : téléchargement npm/Electron permis ?
- Le dossier des projets peut-il être lu et modifié par les outils autorisés ?

La configuration réseau de la fenêtre Electron et celle des processus Claude/Codex
devront être vérifiées séparément. Une page visible dans le navigateur ne valide
pas le flux des agents. Ne pas désactiver la vérification TLS.
Claude documente HTTP(S)_PROXY et les certificats ; SOCKS n'y est pas pris en charge,
et NTLM/Kerberos demande une évaluation spécifique.
Source : [réseau Claude](https://code.claude.com/docs/en/network-config).

## 4. Essai fonctionnel, après confirmation de l'accès autorisé

Utiliser un petit dépôt d'essai sans données professionnelles confidentielles.
Faire la connexion officielle Claude/Codex avec les comptes souhaités ; vérifier
le mode abonnement dans chaque outil avant d'envoyer une requête.

Pour chaque fournisseur : envoyer « Réponds simplement Bonjour, sans utiliser
d'outil », puis un deuxième message dans la même session. Fermer et reprendre
cette conversation. L'essai consomme une petite partie du quota d'abonnement.
Ensuite seulement, tester la lecture d'un README d'essai et une demande
d'autorisation. Pas de bascule vers un compte API si la connexion échoue.

L'accès ChatGPT Desktop seul ne démontre pas l'accès Codex du compte professionnel.
Noter le plan disponible et l'état des quotas sans publier d'informations de compte.

## 5. Résultats à rapporter

| Contrôle | Résultat / message d'erreur sans secret |
| --- | --- |
| Git, Node, npm, Claude, Codex : présents et versions | |
| Autorisation d'utiliser les moteurs locaux | |
| Type de proxy et certificat requis | |
| Connexion Claude par abonnement | |
| Connexion Codex par abonnement | |
| Réponse puis reprise de session | |
| Installation du paquet et lancement des processus enfants | |
| Téléchargement des dépendances (si développement sur ce poste) | |
| Dossier de travail utilisable | |

Conserver ce compte rendu localement ; ne pas ajouter les détails internes de
l'entreprise au dépôt public. Un statut « à vérifier » est préférable à une
conclusion obtenue uniquement à partir d'un test réseau partiel.
