# 📘 Documentation - kiro code

Ce guide vous explique comment configurer les clés API secrètes (Google & Groq) et comment lancer l'application sur différents systèmes.

https://i.postimg.cc/XYR8JYn9/Capture-d-ecran-du-2026-01-06-09-54-11.png

---

## 🛠️ 1. Configuration des Clés (Indispensable)

Pour que l'application fonctionne, vous devez créer un fichier nommé `.env` à la racine du projet (à côté de `package.json`).
**Ne partagez jamais ce fichier !**

### Copiez ce modèle dans votre fichier `.env` :

```env
GROQ_API_KEY=gsk_...
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
```

### 🧠 Obtenir la clé Groq AI
1.  Allez sur [Groq Console](https://console.groq.com/keys).
2.  Créez un compte ou connectez-vous.
3.  Cliquez sur **"Create API Key"**.
4.  Copiez la clé qui commence par `gsk_` et collez-la dans `GROQ_API_KEY`.

### 🌍 Obtenir les identifiants Google (OAuth2)
Pour que le bouton "Connecter Google" fonctionne :

1.  Allez sur [Google Cloud Console](https://console.cloud.google.com/).
2.  Créez un **Nouveau Projet**.
3.  Allez dans **APIs & Services > Credentials** (Identifiants).
4.  Cliquez sur **Create Credentials > OAuth Client ID**.
    *   *Type d'application* : **Web application**.
    *   *Nom* : "kiro code" (ou ce que vous voulez).
5.  **Important** : Configurez les URIs :
    *   **Authorized JavaScript origins** : `http://localhost:3000`
    *   **Authorized redirect URIs** : `http://localhost:3000/auth/google/callback`
6.  Validez. Google vous donnera un **Client ID** et un **Client Secret**.
7.  Copiez-les dans votre fichier `.env`.

---

## 🚀 2. Installation & Lancement

### Prérequis
*   [Node.js](https://nodejs.org/) (Version 18 ou supérieure recommandée).

### Installation des dépendances
Ouvrez un terminal dans le dossier du projet et lancez :
```bash
npm install
```

### 💻 Mode Développement (Windows, Mac, Linux)
Pour modifier le code et tester en direct :
```bash
npm run dev
# OU
npm start
```

### 📦 Construire l'application (Production)
Pour créer un fichier installable (.exe, .deb, .zip) :

```bash
npm run build
```

Les fichiers générés se trouveront dans le dossier `out/make/`.

---

## 🐧 Spécifique Linux (Debian/Ubuntu)
Pour installer proprement l'application avec l'icône :
1.  Faites `npm run build`.
2.  Allez dans `out/make/deb/x64/`.
3.  Installez le fichier `.deb` :
    ```bash
    sudo dpkg -i multi-ai-chat_1.0.0_amd64.deb
    ```
4.  Lancez l'app depuis votre menu d'applications (tapez "AI Code Assistant").

## 🪟 Spécifique Windows
Après le build, vous trouverez un installeur `.exe` (souvent dans `Use Squirrel` ou dossier racine de `out` selon la config). Lancez-le pour installer.

## 🍎 Spécifique Mac
Le build générera un `.zip` ou `.dmg` (selon configuration). Notez que sans signature Apple (payante), vous devrez autoriser l'application manuellement dans "Sécurité et Confidentialité".
