# 🤖 JARVIS — Interactive AI Chatbot

> A futuristic, holographic AI chatbot powered by **Google Gemini 2.5 Flash** with voice input, text-to-speech, real-time audio visualizer, and multiple sci-fi themes.

![JARVIS Chatbot](https://img.shields.io/badge/AI-Gemini%202.5%20Flash-blue?style=for-the-badge&logo=google)
![HTML](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

---

## 🌐 Live Demo (GitHub Pages)

👉 **[Open JARVIS Chatbot](https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/)**
> *(Replace with your actual GitHub Pages URL after hosting)*

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎙️ **Voice Input (STT)** | Click the mic or Arc Reactor — speak naturally, text auto-submits |
| 🔊 **Text-to-Speech (TTS)** | JARVIS speaks every response aloud |
| 🤖 **Gemini 2.5 Flash AI** | Real Google AI responses via your API key |
| 🌊 **Audio Visualizer** | Real microphone waveform + sine wave when speaking |
| 🎨 **4 Themes** | Holo Blue, Cyberpunk Neon, Matrix Green, Dark Carbon |
| 🔔 **UI Sound Effects** | Dynamic sci-fi synth sounds (Web Audio API — no external files) |
| 📥 **Export Logs** | Download full conversation as `.txt` file with timestamps |
| 🎛️ **Voice Config** | Control voice pitch, speed, and profile |
| 🗣️ **Voice Commands** | Control the app by speaking commands |

---

## 🚀 How to Use

### Option 1 — Run Locally
1. Download or clone this repository
2. Open `index.html` in **Google Chrome** or **Microsoft Edge**
3. Open the sidebar → **AI PROTOCOL** section
4. Paste your **Google AI Studio API key** and press **Enter**
5. Start chatting!

### Option 2 — GitHub Pages (Live Hosting)
1. Push this repository to GitHub (see steps below)
2. Go to your repo → **Settings** → **Pages**
3. Under **Source**, select `main` branch → `/ (root)` → click **Save**
4. Your chatbot goes live at: `https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/`

> **Note:** Each user who visits your site will need to enter their own API key in the sidebar. The key is saved in their browser's `localStorage` — it never gets sent to any server other than Google.

---

## 🔑 Getting Your API Key

1. Go to **[aistudio.google.com](https://aistudio.google.com)**
2. Sign in with your Google account
3. Click **"Get API Key"** → **"Create API Key"**
4. Copy the key
5. Open JARVIS → Sidebar → **AI PROTOCOL** → paste the key → press **Enter**

---

## 📁 File Structure

```
jarvis-chatbot/
│
├── index.html      ← Main HTML layout (required)
├── style.css       ← All styles & themes (required)
├── script.js       ← AI logic, voice, visualizer (required)
└── README.md       ← This file (optional but recommended)
```

---

## 🗣️ Voice Commands

Speak these commands to control the app without typing:

| Command | Action |
|---------|--------|
| *"Jarvis, clear chat"* | Clears the screen |
| *"Jarvis, download logs"* | Downloads conversation as `.txt` |
| *"Jarvis, system status"* | Runs diagnostics |
| *"Jarvis, change theme to cyberpunk"* | Switches to Cyberpunk theme |
| *"Jarvis, change theme to holo"* | Switches to default Holo Blue |
| *"Jarvis, change theme to matrix"* | Switches to Matrix Green |

---

## 📤 How to Upload to GitHub

### Step 1 — Create a GitHub Account
Sign up at **[github.com](https://github.com)** if you don't have one.

### Step 2 — Create a New Repository
1. Click the **+** icon → **New repository**
2. Name it something like `jarvis-chatbot`
3. Set it to **Public**
4. Click **Create repository**

### Step 3 — Upload Your Files
**Option A — Via GitHub Website (Easiest):**
1. Open your new repository
2. Click **"uploading an existing file"**
3. Drag and drop these files:
   - `index.html`
   - `style.css`
   - `script.js`
   - `README.md`
4. Click **Commit changes**

**Option B — Via Git (Command Line):**
```bash
git init
git add index.html style.css script.js README.md
git commit -m "Initial commit - JARVIS AI Chatbot"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/jarvis-chatbot.git
git push -u origin main
```

### Step 4 — Enable GitHub Pages
1. Go to your repo → **Settings** tab
2. Scroll to **Pages** section
3. Source → **Deploy from a branch**
4. Branch → `main` → `/ (root)` → **Save**
5. Wait ~1 minute, then visit: `https://YOUR-USERNAME.github.io/jarvis-chatbot/`

---

## ⚠️ Important Notes

- **API Key Security**: Never commit your API key inside the code files. Always paste it at runtime via the sidebar. The key is saved only in your browser's local storage.
- **Browser Support**: Voice recognition works best in **Google Chrome** and **Microsoft Edge**. Firefox has limited support.
- **CORS**: The chatbot works both locally (`file:///`) and when hosted on GitHub Pages.

---

## 🛠️ Tech Stack

- **HTML5** — Structure
- **Vanilla CSS3** — Styling with CSS variables for theming
- **Vanilla JavaScript** — All logic, no frameworks
- **Web Speech API** — Voice recognition (STT) + Speech synthesis (TTS)
- **Web Audio API** — Dynamic synth sound effects + microphone visualizer
- **Google Gemini 2.5 Flash API** — AI responses

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

*Built with ❤️ — Inspired by the Iron Man JARVIS holographic interface*
