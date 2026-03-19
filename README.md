# SpeakSite

SpeakSite is a hackathon-ready MVP for navigating a demo website using voice as the primary interface. Users can open pages, fill forms, and submit actions through browser speech recognition with instant local command parsing. Murf Falcon TTS provides spoken confirmations, with browser speech synthesis as a fallback when the API is unavailable.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS |
| Backend | FastAPI, Python 3.10+ |
| Voice Input | Web Speech API |
| Voice Output | Murf Falcon TTS API, browser speechSynthesis fallback |
| Parsing | Rule-based regex parser |
| State | React `useState` + `useContext` |

## Prerequisites

- Node.js 18+
- Python 3.10+
- A Murf API key from https://murf.ai/developers

## Setup

1. Move into the project root:
   ```bash
   cd speaksite
   ```
2. Create the backend virtual environment and install dependencies:
   ```bash
   cd backend
   python -m venv .venv
   .venv\Scripts\activate
   pip install -r requirements.txt
   copy .env.example .env
   ```
3. Edit `backend/.env` and add your Murf API key.
4. Start the backend server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
5. In a new terminal, install frontend dependencies:
   ```bash
   cd speaksite\frontend
   npm install
   ```
6. Start the frontend:
   ```bash
   npm run dev
   ```
7. Open the Vite URL in Chrome or Edge and use the mic to drive the demo site.

## Voice Commands

- `go to home`
- `open home page`
- `back to home`
- `go to signup`
- `open signup page`
- `registration page`
- `create account`
- `go to contact`
- `open contact page`
- `contact us`
- `fill name with Rahul`
- `set email to rahul@gmail.com`
- `my message is hello there`
- `enter hello there in message`
- `submit`
- `submit form`
- `send it`
- `repeat`
- `say again`
- `what did you say`

## Fallback Behavior

The frontend parses commands locally first, so navigation and form updates happen immediately without waiting for the backend. If Murf TTS fails or the `/speak` request has a network issue, the app silently falls back to browser `speechSynthesis` and logs only to the console. If the browser does not support the Web Speech API, the microphone is disabled and the UI shows a banner recommending Chrome or Edge.

## Known Limitations

- Voice input depends on browser support and microphone permissions.
- The parser is intentionally rule-based and only supports the predefined commands and fields.
- Password input on the sign up page is manual only.
- There is no persistence, authentication, or database storage in this MVP.
