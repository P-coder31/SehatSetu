# SehatSetu (सेहतसेतु) — Care, Connected.

> **A Complete, Polished, Functional Healthcare Discovery, Booking, & Care-Continuity Web Application.**  
> Built for Indian healthcare ecosystems to bridge the gap between patient journeys, clinic schedules, and public health schemes.

---

## 🏥 Product Vision & Core Architecture

SehatSetu simplifies the complete healthcare journey:
- **Discover**: Instant search across verified doctors and clinics filtered by specialty, fee, distance, and facility type.
- **Book**: Instant slot reservation backed by transactional database constraints and FairSlot anti-hoarding limits.
- **Care Continuity Loop**: Real-time patient transit delay reporting, clinic delay acceptance, automated alternative slot proposals, in-app notifications, and a permanent **Care Passport** timeline.
- **Government Health Schemes**: Plain-language, source-backed guidance for PM-JAY (Ayushman Bharat), e-Sanjeevani, Janani Suraksha Yojana (JSY), and Rashtriya Bal Swasthya Karyakram (RBSK) with instant English and सरल हिन्दी (Hindi) explanations.

---

## 🚀 Technology Stack

### Frontend
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, React 19)
- **Language**: TypeScript (Strict type checks)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State & Auth**: React Context with persistent JWT handling and 1-click demo role switching.

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11+)
- **ORM & Migrations**: [SQLAlchemy 2.0](https://www.sqlalchemy.org/) & [Alembic](https://alembic.sqlalchemy.org/)
- **Data Validation**: [Pydantic v2](https://docs.pydantic.dev/)
- **Database**: SQLite with WAL mode & foreign key constraints (default for zero-setup execution) + native PostgreSQL compatibility via `psycopg`.
- **Security**: Direct `bcrypt` password hashing, PyJWT authentication, and strict server-enforced role access controls (`require_role`).
- **AI Integration**: Gemini API integration with automatic fallback for bilingual plain-language health scheme explanations.

---

## 👥 Three Role-Based Portals

### 1. Patient Portal
- `/` — Premium landing page with specialty search, featured sample doctors, Care Continuity Loop interactive walkthrough, and health schemes.
- `/onboarding` — Account-type selection (Patient, Doctor, Departmentally Provisioned Admin notice) with 1-click demo access.
- `/login` — Secure sign-in with password credentials or Aadhaar/ABHA compliance gateway abstraction tab.
- `/register` — Patient registration with validation.
- `/search` — Live provider discovery with multi-filter query (specialty, facility type, max fee, sort by fee/distance).
- `/providers/[id]` — Detailed doctor profile, verified credentials, fee structure, and 7-day slot availability picker.
- `/book/[providerId]` — Transparent booking submission with chief complaint input and FairSlot guarantee.
- `/booking/success` — Booking confirmation screen with permanent reference code.
- `/dashboard` — Patient command center with persistent sidebar, compact header, breadcrumbs, prominent **Find Care** search, upcoming visit card, reminders, and notifications.
- `/dashboard/appointments` — Active bookings table with **Report Delay** modal, **Reschedule** modal, and cancellation actions.
- `/dashboard/care-passport` — Chronological care timeline tracking bookings, delays, approvals, completions, and follow-up medical reminders.
- `/dashboard/health-schemes` — Dedicated public health program library with English & Hindi explanatory assistants.
- `/dashboard/profile` — Patient details, contact information, and role badge.
- `/dashboard/settings` — Communication preferences, delay alert toggles, and explanation language settings.

### 2. Healthcare Professional Portal
- `/professional` — Doctor portal marketing entry and clinical highlights.
- `/professional/onboarding` — Doctor registration, medical council number, qualifications, fee, specialties, and facility associations.
- `/professional/dashboard` — Live clinic command center with persistent sidebar and compact header; displays today's appointments, real-time patient delay alerts, delay approval buttons, and **Propose Alternative Slot** flow. *(Find Care is omitted to preserve strict role boundaries).*
- `/professional/appointments` — Filterable patient roster with status actions: Complete, No-Show, or Cancel.
- `/professional/availability` — Working hours manager by day of week and temporary blocked date manager.
- `/professional/profile` — Doctor credentials, registration number, qualification, clinical bio, fee, and facility affiliations.
- `/professional/settings` — Practice operational preferences: delay grace window, auto-rescheduling suggestions, and FairSlot consultation caps.

### 3. Administrator Portal
- `/admin` — State Health Administration portal entry.
- `/admin/dashboard` — Live administrative dashboard with persistent sidebar and compact header, powered by **real aggregate SQL queries** (total users, doctor/patient breakdown, facility count, and appointment status metrics). *(Find Care is omitted to preserve administrative focus).*
- `/admin/appointments` — System-wide appointments registry with status filters (Confirmed, Delay Reported, Completed, Cancelled) and reference search.
- `/admin/verifications` — Medical council credential verification queue with Approve / Reject actions and mandatory audit notes.
- `/admin/users` — Directory of registered accounts with instant account suspension and reactivation toggles.
- `/admin/reports` — Cryptographically logged platform audit trail of all security events and status transitions.
- `/admin/settings` — State platform settings: FairSlot anti-hoarding limits, Aadhaar gateway compliance checklist, verification mandates, and audit log retention.

---

## 🔄 The Care Continuity Loop

1. **Delay Updates**: When transit or personal delays occur, patients report their delay (e.g., +15m or +30m) directly from their appointments dashboard.
2. **Clinic Visibility**: The doctor's dashboard instantly flags the delayed appointment with arrival estimates.
3. **Clinic Response**:
   - **Approve**: Doctor accepts the delay; the appointment remains reserved.
   - **Propose Alternative**: If the doctor cannot wait, they propose an alternative slot.
4. **Patient Acceptance**: Patient receives an in-app notification and can accept the proposed slot with atomic re-validation.
5. **Care Passport**: Every action (booked, delayed, rescheduled, completed, follow-up reminder created) is permanently logged to the patient's Care Passport.
6. **Follow-Up Reminders**: Doctors or patients can schedule post-consultation follow-ups with in-app task reminders.

---

## 🔐 Built-in Test Credentials

Pre-seeded accounts ready for immediate testing:

| Role | Email | Password | Primary Functions |
|---|---|---|---|
| **Administrator** | `admin@sehatsetu.gov.in` | `Admin@SehatSetu2026` | Verification queue, audit logs, user suspension, real analytics |
| **Doctor** | `dr.rajesh@civilhosp.org` | `Doctor@SehatSetu2026` | Schedule, approve delays, propose alternatives, complete visits |
| **Patient** | `asha.patel@example.com` | `Patient@SehatSetu2026` | Book slots, report delay, care passport, health schemes |

> **Tip**: The top navigation bar in the frontend includes **1-click Quick Login buttons** for each role for rapid testing.

---

## ⚡ Quick Start & Setup Guide

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 1. Backend Setup (FastAPI & Database)

In a PowerShell terminal:

```powershell
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Seed database with sample clinics, doctors, schemes, and demo users
python -m app.db.seed

# Start the backend server on port 8000
uvicorn main:app --reload --port 8000
```

The backend API will be live at `http://localhost:8000` with Swagger documentation at `http://localhost:8000/docs`.

### 2. Frontend Setup (Next.js 15)

In a separate PowerShell terminal:

```powershell
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:3000` in your web browser.

---

## 🧪 Automated Testing Suite

### 1. Backend Unit, Integration, & Role Tests
Run the comprehensive Pytest suite:

```powershell
cd backend
.venv\Scripts\pytest -v
```

Tests verify:
- Administrator, Doctor, and Patient authentication with bcrypt password verification.
- Server-side role authorization (attempting doctor endpoints as a patient returns `403 Forbidden`).
- Care continuity delay workflow and timeline logging.
- Health scheme plain-language bilingual generation with offline fallback.

### 2. Concurrency Race Condition Testing
Test 20 simultaneous threads racing to book the exact same slot:

```powershell
cd backend
.venv\Scripts\python test_api.py
```

**Result**: Exactly **1 thread succeeds** (`201 Created`), while the other **19 threads are rejected** (`409 Conflict`), verifying database-level double-booking prevention under load.

### 3. Frontend Typecheck, Lint, & Production Build

```powershell
cd frontend

# Run ESLint (0 errors, 0 warnings)
npm run lint

# Run Next.js production build (generates 29/29 static and dynamic routes cleanly)
npm run build
```

---

## 🛡️ Privacy, Safety, & Medical Ethics Guardrails

- **No Fabricated Data**: Sample listings are explicitly flagged with `is_sample` indicators. Ratings are never fabricated.
- **No Unsolicited Medical Diagnosis**: SehatSetu connects appointments and clarifies administrative scheme procedures. It explicitly warns users that it is not a diagnostic tool or clinical decision system.
- **Emergency Hotlines**: Prominently displayed national emergency numbers (112 - National Emergency, 108 - Ambulance, 1075 - National Health Helpline).
- **Data Minimization**: SehatSetu records only necessary consultation complaint keywords and visit timestamps, without storing intrusive personal medical records.

---

## 📄 License
MIT License. Developed for the SehatSetu Healthcare Continuity Initiative.
