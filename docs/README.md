# 📘 Documentation - kiro code

Ce guide vous explique comment configurer les clés API secrètes (Google & Groq) et comment lancer l'application sur différents systèmes.

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

1. Allez sur la console Groq.
2. Créez un compte ou connectez-vous.
3. Cliquez sur **Create API Key**.
4. Copiez la clé qui commence par `gsk_` et collez-la dans `GROQ_API_KEY`.

### 🌍 Obtenir les identifiants Google (OAuth2)

Pour que le bouton **Connecter Google** fonctionne :

1. Allez sur Google Cloud Console.
2. Créez un **Nouveau Projet**.
3. Allez dans **APIs & Services > Credentials**.
4. Cliquez sur **Create Credentials > OAuth Client ID**.

   * Type d'application : **Web application**
   * Nom : `kiro code`
5. **Important** : Configurez les URIs :

   * **Authorized JavaScript origins** : `http://localhost:3000`
   * **Authorized redirect URIs** : `http://localhost:3000/auth/google/callback`
6. Validez.
7. Copiez le **Client ID** et le **Client Secret** dans le fichier `.env`.

---

## 🚀 2. Installation & Lancement

### Prérequis

* Node.js (version 18 ou supérieure recommandée)

### Installation des dépendances

```bash
npm install
```

### 💻 Mode Développement (Windows, Mac, Linux)

```bash
npm run dev
# ou
npm start
```

### 📦 Build de production

```bash
npm run build
```

Les fichiers générés se trouvent dans le dossier `out/make/`.

---

## 🐧 Spécifique Linux (Debian / Ubuntu)

1. Lancez `npm run build`
2. Allez dans `out/make/deb/x64/`
3. Installez le fichier `.deb` :

   ```bash
   sudo dpkg -i multi-ai-chat_1.0.0_amd64.deb
   ```
4. Lancez l'application depuis le menu ("AI Code Assistant").

---

## 🪟 Spécifique Windows

Après le build, vous trouverez un installeur `.exe` (souvent dans `Use Squirrel` ou à la racine de `out/`).
Lancez-le pour installer l'application.

---

## 🍎 Spécifique Mac

Le build génère un fichier `.zip` ou `.dmg` (selon la configuration).

### ⚠️ Sécurité macOS (Important)

Sans signature Apple (programme développeur payant), macOS peut bloquer l'application au premier lancement.

**Procédure pour autoriser l'application :**

1. Ouvrez l'application une première fois (elle sera bloquée).
2. Allez dans **Réglages système > Sécurité et confidentialité**.
3. En bas de la page, cliquez sur **Autoriser quand même**.
4. Relancez l'application.

📷 Exemple d'écran macOS :

![Autoriser application macOS](https://i.postimg.cc/XYR8JYn9/Capture-d-ecran-du-2026-01-06-09-54-11.png)

---

✅ L'application est maintenant prête à être utilisée sur votre système.
