# 🚀 Lectors Schedule App — Free Deployment Guide

## What You Need (All Free)

| Tool | What It Does | Link |
|------|-------------|------|
| **Node.js** | Runs JavaScript on your computer | https://nodejs.org (download LTS) |
| **VS Code** | Code editor | https://code.visualstudio.com |
| **Firebase** | Free database (stores schedule data) | https://firebase.google.com |
| **Vercel** | Free web hosting | https://vercel.com |
| **GitHub** | Stores your code | https://github.com |

---

## STEP 1: Install Node.js

1. Go to https://nodejs.org
2. Download the **LTS** version
3. Install it (just click Next, Next, Next)
4. To verify, open Terminal (Mac) or Command Prompt (Windows) and type:
   ```
   node --version
   ```
   You should see something like `v20.x.x`

---

## STEP 2: Create Firebase Project (Free Database)

Firebase will store the schedule data so all users see the same thing.

1. Go to https://firebase.google.com
2. Click **"Go to Console"** (sign in with Google)
3. Click **"Create a project"**
   - Name it: `lectors-schedule`
   - Disable Google Analytics (not needed)
   - Click Create
4. Once created, click **"Build" → "Firestore Database"**
5. Click **"Create database"**
   - Choose **"Start in test mode"** (we'll secure it later)
   - Pick the closest location (e.g., `asia-southeast1` for Philippines)
   - Click **Enable**
6. Now go to **Project Settings** (gear icon ⚙️ at top left)
7. Scroll down to **"Your apps"** → click the **Web** icon `</>`
8. Register app name: `lectors-schedule`
9. You'll see a config like this — **COPY IT**, you'll need it:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "lectors-schedule-xxxxx.firebaseapp.com",
     projectId: "lectors-schedule-xxxxx",
     storageBucket: "lectors-schedule-xxxxx.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef123456"
   };
   ```

### Secure Your Database

After testing, go to **Firestore → Rules** and replace with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Anyone can read published data
    match /published/{doc} {
      allow read: if true;
      allow write: if true;
    }
    // Anyone can read/write app data (protected by PIN in the app)
    match /appdata/{doc} {
      allow read, write: if true;
    }
    match /auth/{doc} {
      allow read, write: if true;
    }
  }
}
```

> **Note:** The app uses PIN-based security at the application level. For a small parish group, this is sufficient. The Firestore rules above allow read/write access — the PIN protection happens in the app code itself.

---

## STEP 3: Set Up the Project in VS Code

1. Open **VS Code**
2. Open Terminal in VS Code: **Terminal → New Terminal**
3. Create your project:

```bash
# Navigate to where you want the project (e.g., Desktop)
cd Desktop

# Create project with Vite (fast React builder)
npm create vite@latest lectors-schedule -- --template react

# Go into the project
cd lectors-schedule

# Install dependencies
npm install

# Install Firebase
npm install firebase
```

4. Now your folder looks like this:
```
lectors-schedule/
├── public/
├── src/
│   ├── App.jsx        ← DELETE this and replace
│   ├── App.css        ← DELETE this
│   ├── main.jsx       ← REPLACE this
│   └── index.css      ← REPLACE this
├── index.html         ← REPLACE this
├── package.json
└── vite.config.js
```

---

## STEP 4: Copy the Files

I've provided all the files you need. Replace them one by one:

### 4a. Replace `index.html`
Delete the existing `index.html` in the root folder and replace with the `index.html` file I provided.

### 4b. Replace `src/main.jsx`
Delete the existing `src/main.jsx` and replace with my `main.jsx`.

### 4c. Replace `src/App.jsx`
Delete the existing `src/App.jsx` and `src/App.css`. Replace with my `App.jsx`.

### 4d. Create `src/firebase.js`
Create a new file `src/firebase.js` and paste my `firebase.js` — **BUT REPLACE THE CONFIG with your own from Step 2**.

### 4e. Create `src/storage.js`
Create a new file `src/storage.js` and paste my `storage.js`.

---

## STEP 5: Test Locally

In VS Code Terminal:

```bash
npm run dev
```

Open your browser to `http://localhost:5173` — you should see the app!

- Set your admin PIN
- Add some lectors
- Make a test schedule
- Check that it saves (refresh the page)

---

## STEP 6: Push to GitHub

1. Go to https://github.com and create an account (free)
2. Click **"New repository"**
   - Name: `lectors-schedule`
   - Keep it **Public** (or Private, both work)
   - Don't add README (you already have files)
   - Click **Create repository**
3. In VS Code Terminal:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/lectors-schedule.git
git push -u origin main
```

---

## STEP 7: Deploy to Vercel (Free Hosting)

1. Go to https://vercel.com
2. Click **"Sign up"** → Sign up with GitHub
3. Click **"Add New Project"**
4. Import your `lectors-schedule` repository
5. Vercel auto-detects it's a Vite project
6. Click **Deploy**
7. Wait ~1 minute
8. Done! You get a URL like: `https://lectors-schedule.vercel.app`

**This is the link you share with your lectors!**

---

## STEP 8: Share with Lectors

1. Send the Vercel URL to your lectors group chat (Viber, Messenger, etc.)
2. Tell them the **Member Code** (default: `lector2025`)
3. They open the link → enter the code → see the published schedule
4. They can bookmark it or add to home screen on their phone

### Add to Phone Home Screen (Like an App)

**Android:** Open in Chrome → tap ⋮ menu → "Add to Home screen"
**iPhone:** Open in Safari → tap Share → "Add to Home Screen"

---

## Updating the App Later

If you need to update the code:

1. Edit files in VS Code
2. Test with `npm run dev`
3. When ready:
```bash
git add .
git commit -m "Updated schedule features"
git push
```
4. Vercel auto-deploys! No extra steps.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `npm: command not found` | Install Node.js first |
| Firebase data not saving | Check your firebaseConfig in `firebase.js` |
| Blank page after deploy | Check browser console (F12) for errors |
| Members can't see schedule | Admin needs to press **Publish** first |
| Forgot admin PIN | Use "Forgot PIN?" on login screen |
| Want to reset everything | Go to Firebase Console → Firestore → delete all documents |
