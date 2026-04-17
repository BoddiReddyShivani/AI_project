# HireSight Pro

HireSight Pro is an improved version of your Job Scam Detection project.

## What was improved

- Better backend structure
- Cleaner API routes under `/api`
- Stronger rule-based scam analysis
- Company verification with domain hints
- Persistent scam reports using JSON storage
- Dashboard stats endpoint
- Cleaner and more professional frontend UI
- Recent report viewer
- Safety checklist after analysis
- Sample suspicious job text button for demo use

## Project structure

```
HireSight-Pro/
├── backend/
│   ├── data/
│   │   ├── companies.json
│   │   └── reports.json
│   ├── utils/
│   │   └── analyzer.js
│   └── server.js
├── frontend/
│   └── index.html
├── package.json
└── README.md
```

## Features

### 1. Job Scam Checker
- Paste any job description
- Get risk score, risk level, matched signals, and safety tips
- Detect suspicious phrases like:
  - registration fee
  - urgent hiring
  - no interview
  - gmail recruiter emails
  - Aadhaar or bank detail requests
  - WhatsApp or Telegram only contact

### 2. Company Verification
- Checks company status from local data
- Shows official domain when available

### 3. Report a Scam
- Submit suspicious postings
- Stored in `backend/data/reports.json`
- Shows recent reports on the homepage

### 4. Dashboard Stats
- Total reports
- Reports submitted today
- Total supported companies
- Number of core features

## How to run

### Step 1: Install dependencies

```bash
npm install
```

### Step 2: Start the project

```bash
npm start
```

### Step 3: Open in browser

```text
http://localhost:5000
```

## Main API routes

- `GET /api`
- `POST /api/analyze`
- `GET /api/company/:name`
- `POST /api/report`
- `GET /api/reports`
- `GET /api/stats`

## Suggested future upgrades

- MongoDB integration for reports and company records
- Login system for admin reviewers
- Real ML model for text classification
- File upload for screenshots/evidence
- Email domain reputation lookup
- Search and filter on reports page
- Export reports as PDF or CSV
- Admin dashboard with report moderation

