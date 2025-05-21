<img src="https://lockme.my/assets/img/logo_lockme_highRESver.png" alt="LockMe logo" height="64px" />

# LockMe: Secure File Encryption and Decryption Application

LockMe is a privacy-first desktop web app that helps you encrypt, decrypt, and manage files securely. It runs entirely client-side, with AI-assisted tools and Firebase-powered user management under the hood.

## ✨ Features

### 🔒 File Encryption & Decryption

* **AES-256-GCM encryption** via Web Crypto API.
* Client-side only — your files and passphrases never touch a server.
* Encrypt/decrypt multiple files at once.
* Encrypted files use a `.lockme` extension.

### 🤖 AI Security Toolkit (Genkit + Gemini)

* **Passphrase Generator:** Strong, customizable, and memorable.
* **Recovery Prompt Enhancer:** AI-generated prompts tailored to you.
* **Strength Analyzer:** Get feedback on how strong your passphrase is.

### 📚 Code Snippet Manager

* Store and tag frequently used code snippets.
* Syntax highlighting for multiple languages.
* Optional encryption for sensitive code.
* Search by name, tag, or content.
* Backed by Firebase Firestore.

### 👤 Account & Profile Management

* Email/password sign-up and login (Firebase Auth).
* Email verification, password reset, and secure account deletion.
* Manage your display name and profile picture (with image cropping).

### 📊 Personalized Dashboard

* Track file activity, passphrases generated, and more.
* View a history of recent operations.

### ⚙️ App Preferences

* Light/dark theme toggle.
* Local app settings saved via `localStorage`.

### 📱 Responsive Design

* Works well on desktop and mobile devices.

## 🛠 Tech Stack

* **Frontend:** Next.js (App Router), React, TypeScript
* **UI:** Tailwind CSS, ShadCN
* **AI Integration:** Genkit, Gemini
* **Backend & Auth:** Firebase

  * Firestore (data), Storage (profile pics), Auth (user accounts)
  * Firebase Admin SDK for secure server-side tasks

## 🚀 Getting Started

### Prerequisites

* Node.js (v18+)
* npm or yarn
* A Firebase project (with Firestore, Storage, and Auth enabled)
* [Gemini API key](https://aistudio.google.com/app/apikey)

### 🔧 Local Setup

1. **Clone the repo**

   ```bash
   git clone https://github.com/your-username/lockme.git
   cd lockme
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   Create a `.env.local` file and add:

   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   GEMINI_API_KEY=...
   FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
   ```

4. **Deploy Firebase Rules**

   ```bash
   firebase deploy --only firestore
   firebase deploy --only storage
   ```

5. **Start Development Servers**

   * **App:**

     ```bash
     npm run dev
     ```

   * **AI Flows:** Run in a separate terminal if applicable.

## 🧪 How to Use

### 🔐 File Encryption

* Go to the Encrypt/Decrypt page.
* Upload files or drag and drop.
* Enter a passphrase (AI will rate its strength).
* Files are processed in-browser and downloaded to your device.

### 🧠 AI Security Toolkit

* Generate passphrases tailored to your preferences.
* Improve your recovery prompts using AI.
* Analyze passphrase strength with detailed feedback.

### 📚 Code Snippet Manager

* Add/edit snippets with name, language, content, and tags.
* Search and filter your saved snippets.
* Optional encryption for sensitive code.

### 👤 User & Account Settings

* Update your display name and profile picture.
* Resend email verifications or reset your password.
* Securely delete your account.

## 🔐 Security Notes

* **Encryption Safety:** The strength of your encryption depends on the strength of your passphrase.
* **No Server Access:** File content and passphrases stay on your device.
* **Firebase Admin Key:** Use environment variables to handle your keys securely.
* **Firestore & Storage:** Protected by Firebase security rules.

## 🗓 Upcoming Features

* Support for more encryption algorithms
* Secure sharing of encrypted files and code
* Two-Factor Authentication (2FA)

## 📚 References & Research

LockMe draws inspiration from academic research and existing tools:

* Al-Hazaimeh (2013) – *A New Approach for Complex Encrypting and Decrypting Data*
* Mushtaq et al. (2017) – *A Survey on Cryptographic Encryption Algorithms*
* Salama et al. (2011) – *Effects of Common Encryption Algorithms*
* GitHub: [hat.sh](https://github.com/sh-dv/hat.sh), [enc](https://github.com/life4/enc)

by **Muhamad Azri Muhamad Azmir**,  
Bachelor of Computer Forensics at Management and Science University (MSU)  
supervised by **Dr. Asma Mahfoudh Hezam Al-Hakimi**

## 📬 Feedback & Contributions

Found a bug? Have an idea?
Open an issue or a pull request — all contributions are welcome.

## 📄 License

This project is open source under the [MIT License](LICENSE).
