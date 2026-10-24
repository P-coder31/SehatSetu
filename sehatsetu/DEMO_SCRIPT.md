# SehatSetu — Demonstration Walkthrough Script (2–3 Minutes)

This script provides an evaluator with an end-to-end guided walkthrough of SehatSetu's three portals, the Care Continuity Loop, and automated concurrency enforcement.

---

## 1. Landing Page, Onboarding & Identity Authentication (0:00 – 0:45)
- **URL**: `http://localhost:3000/`
- **Headline**: "Care, connected."
- **Actions**:
  1. Click **"Get Started"** on the hero banner to enter the dedicated `/onboarding` flow.
  2. Inspect the three role cards:
     - **Patient / Customer**: Links directly to registration.
     - **Healthcare Professional**: Directs to clinical practice onboarding.
     - **State Health Administrator**: Clearly marked with a restricted badge — *"Authorized departmental accounts only. Public self-registration is disabled."*
  3. Click **"Sign In"** (`/login`) to view the two authentication options:
     - **Password Sign In**: Standard credential authentication with 1-click DEMO MODE buttons.
     - **Aadhaar / ABHA Gateway Tab**: Displays the strict UIDAI/ABDM compliance message: *"Aadhaar authentication integration is not configured in this demo deployment. In compliance with data privacy regulations, full Aadhaar numbers, OTPs, or biometric credentials are not collected without an official government gateway."*

---

## 2. Patient Experience & Dedicated Sidebar Layout (0:45 – 1:30)
- **URL**: `http://localhost:3000/dashboard`
- **Persistent Left Sidebar**:
  - Highlights **"Find Care"** as a prominent top primary action with search icon.
  - Sidebar links: Dashboard, Find Care, My Appointments, My Care Passport, Follow-up Reminders, Health Schemes, Notifications, My Profile, Settings, and Logout.
  - Compact header includes dynamic breadcrumbs (`Home > Dashboard`) and user profile menu.
- **Actions**:
  1. Click **"Find Care"** or use the prominent in-dashboard search bar to discover doctors.
  2. Select **Dr. Rajesh Kumar** (`/providers/1`), choose a slot, and book an appointment with complaint notes.
  3. View the confirmed booking in `/dashboard/appointments`.

---

## 3. The Care Continuity Loop in Action (1:30 – 2:15)
- **Patient Perspective** (`/dashboard/appointments`):
  1. Click **"Report Delay"** on the confirmed appointment.
  2. Select **"+20 minutes"** and reason: *"Traffic delay on GT Road"*.
  3. Status immediately transitions to `Delay Reported (+20m)`.
- **Doctor Perspective** (`/professional/dashboard`):
  1. Switch to Doctor portal (or click **"Doctor"** 1-click button).
  2. Notice the dedicated **Healthcare Professional Sidebar** — **"Find Care" is strictly omitted** to preserve clinical operational boundaries.
  3. Doctor dashboard highlights the urgent card: **"Patient Delay Reported"**.
  4. The doctor can click **"Approve Delay"** to preserve the appointment, or click **"Propose Alternative Slot"** to offer a later time slot.
  5. Check out the new **Doctor Profile** (`/professional/profile`) and **Clinic Settings** (`/professional/settings`).

---

## 4. Care Passport & Medical Follow-Up Reminders (2:15 – 2:45)
- **URL**: `http://localhost:3000/dashboard/care-passport`
- **Actions**:
  1. View the chronological audit trail:
     - 🟢 **Appointment Booked**
     - 🟡 **Delay Reported (+20m)**
     - 🟢 **Clinic Approved Delay**
  2. View **Follow-Up Reminders**:
     - See pending post-consultation tasks: *"Schedule CBC follow-up test"* and *"Review blood pressure reading"*.
     - Click **"Mark Done"** to close the loop.

---

## 5. Government Health Schemes & Plain Language Helper (2:45 – 3:15)
- **URL**: `http://localhost:3000/dashboard/health-schemes`
- **Schemes**: PM-JAY (Ayushman Bharat), e-Sanjeevani Teleconsultation, Janani Suraksha Yojana (JSY), and Rashtriya Bal Swasthya Karyakram (RBSK).
- **Actions**:
  1. Click **"सरल हिन्दी (Hindi Helper)"** on Ayushman Bharat.
  2. An AI-assisted modal provides plain-language explanations of eligibility, ₹5 Lakh coverage per family, hospital desk procedures, and direct links to the official `pmjay.gov.in` portal.
  3. Click **"Explain in English"** on e-Sanjeevani to read teleconsultation instructions.

---

## 6. Administrator Command Center & System Registry (3:15 – 3:45)
- **URL**: `http://localhost:3000/admin/dashboard`
- **Persistent Admin Sidebar**:
  - Highlights: Dashboard, Users, Healthcare Professionals, Professional Verification, Facilities, Appointments, Health Schemes, Reports & Analytics, Audit Logs, Settings.
  - Notice **"Find Care" is completely omitted** from the admin experience.
- **Actions**:
  1. Inspect real aggregate SQL database statistics.
  2. Check the new **System Appointments Registry** (`/admin/appointments`): Filter by status, search by reference code, and view patient delays.
  3. Navigate to **Verifications Queue** (`/admin/verifications`): Approve or reject doctors with recorded administrative notes.
  4. Visit **Platform Settings** (`/admin/settings`): Inspect FairSlot anti-hoarding rules and UIDAI/ABDM compliance checklist.

---

## 7. Concurrency Race Condition Proof (Automated Test)
- **Terminal Execution**:
  ```powershell
  cd backend
  .venv\Scripts\python test_api.py
  ```
- **Result**: 20 concurrent threads fire simultaneously. Exactly **1 thread succeeds** (`201 Created`), while the other **19 threads are rejected with `409 Conflict`**. Double-booking is strictly impossible under race conditions.

---

## Summary of Demo Accounts

| Portal | 1-Click Navbar Shortcut | Email | Password |
|---|---|---|---|
| **Patient** | Click **"Patient"** | `asha.patel@example.com` | `Patient@SehatSetu2026` |
| **Doctor** | Click **"Doctor"** | `dr.rajesh@civilhosp.org` | `Doctor@SehatSetu2026` |
| **Admin** | Click **"Admin"** | `admin@sehatsetu.gov.in` | `Admin@SehatSetu2026` |

