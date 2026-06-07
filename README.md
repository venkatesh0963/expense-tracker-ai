# AI EXPENSE TRACKER

An intelligent, AI-powered expense tracking application that helps you manage your finances, categorize expenses, and provides actionable financial insights using Google Gemini AI.

## Tech Stack

| Layer | Technology |
|-------|------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Recharts, Lucide React |
| **Backend** | Express, Bun, Vercel AI SDK, Google Gemini |
| **Database** | SQLite (via `bun:sqlite`) |

## Software Required

To download and run this project, you will need the following software installed on your machine:

- **[Node.js](https://nodejs.org/)** (v18 or higher) - Required for running the frontend development server and installing NPM packages.
- **[Bun](https://bun.sh/)** (v1.0 or higher) - Required for the backend server execution and fast package management.
- **[Git](https://git-scm.com/)** - Required for cloning the repository.
- A **Google Generative AI API key** — Get one at [Google AI Studio](https://aistudio.google.com/apikey).

## Steps to Run

### 1. Clone the repository

Open your terminal and clone the repository:

```bash
git clone <repo-url>
cd ai-expense-tracker-master
```

### 2. Install dependencies

You need to install dependencies for both the frontend (client) and the backend (server).

**For the Backend (Server):**
```bash
cd server
bun install
```

**For the Frontend (Client):**
```bash
cd ../client
npm install
```

### 3. Configure environment variables

The backend requires an API key to communicate with Google Gemini AI.

Create a `.env` file in the `server/` directory:
```bash
cd ../server
cp .env.example .env
```

Open the `server/.env` file and add your API key:
```env
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
```

### 4. Running the Application

You need to run both the frontend and backend servers concurrently.

**Terminal 1 — Backend:**
```bash
cd server
bun run dev
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
```

### 5. Open the app

Once both servers are running, open your browser and navigate to:
[http://localhost:5173](http://localhost:5173) *(or the port specified by Vite in Terminal 2)*



