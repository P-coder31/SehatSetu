# SehatSetu 🩺
### From finding care to following through, one connected journey.

**Team Code Storm | BuildLab**

SehatSetu is a healthcare navigation platform concept designed to make it easier for people to discover healthcare providers, manage appointments, and keep track of appointment-related next steps in one place.

Our goal is to reduce the confusion patients face when navigating disconnected healthcare services and create a simpler, more accessible healthcare journey.

## 🎯 The Problem

Finding healthcare can involve switching between multiple platforms, making phone calls, checking provider availability, managing appointments, and searching for information about public healthcare schemes.

These disconnected steps can make the process confusing and time-consuming for patients.

## 💡 Our Solution

SehatSetu aims to connect important parts of the healthcare journey through one platform.

### Key Features

- **Provider Discovery:** Browse healthcare providers using sample provider data in the prototype.
- **Appointment Management:** Create, view, cancel, and reschedule appointments.
- **Care Passport:** Keep track of appointment-related events and next steps.
- **Healthcare Scheme Information:** Explore available scheme information through the prototype.
- **Provider Availability Management:** Demonstrate provider-status updates within the prototype.
- **Accessibility-Focused Vision:** Plan for multilingual support and a simpler experience for diverse users.

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Backend | Python, FastAPI |
| Database | SQLite |
| API Documentation | FastAPI / Swagger UI |

## 🏗️ Project Structure

```text
SehatSetu/
├── main.py
├── requirements.txt
├── README.md
└── static/
    ├── index.html
    ├── styles.css
    └── app.js
```

## 🚀 Getting Started

### Prerequisites

- Python 3.10 or later recommended
- pip
- A web browser

### 1. Clone the repository

```bash
git clone YOUR_REPOSITORY_URL
cd SehatSetu
```

Replace `YOUR_REPOSITORY_URL` with your actual GitHub repository URL.

### 2. Create a virtual environment

**Windows PowerShell:**

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks activation, you can use the environment's Python executable directly in the following steps.

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

Alternatively, on Windows:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

### 4. Start the application

```bash
uvicorn main:app --reload
```

If you did not activate the environment, run:

```powershell
.\.venv\Scripts\python.exe -m uvicorn main:app --reload
```

### 5. Open the application

- **Application:** http://127.0.0.1:8000
- **Interactive API documentation:** http://127.0.0.1:8000/docs

These addresses work when the server is running locally on your computer.

## 🔌 API Overview

The prototype includes endpoints for demonstrating core platform workflows, including:

- Health check
- Provider listing
- Appointment creation and retrieval
- Appointment cancellation and rescheduling
- Care Passport information
- Healthcare scheme information
- Provider status updates

For available routes and request formats, start the application and visit `/docs`.

## 🗺️ Development Roadmap

The following are planned improvements and should not be considered completed integrations unless independently implemented and tested.

- **Multilingual Support:** Work toward supporting 22 languages.
- **AI Navigation Assistant:** Help users navigate platform features and find relevant information.
- **Provider Insights:** Explore monthly reports for provider profiles using reliable, clearly defined data.
- **Performance Improvements:** Improve responsiveness and reliability.
- **Provider Verification:** Introduce a process for verifying real providers and their information.
- **Authorised Integrations:** Explore connections with clinics, hospitals, and official healthcare information sources.
- **Security and Privacy:** Add appropriate authentication, access controls, and safeguards before handling real patient information.

AI-generated doctor portraits, if used in design mockups, must be labelled as illustrative and must not be presented as actual verified clinicians.

## 🔐 Privacy, Safety and Limitations

SehatSetu is an early-stage prototype, not a production healthcare service.

- Sample provider information and demonstration workflows may be used.
- Live hospital availability and real-time clinic integrations are not guaranteed.
- The Care Passport is intended to demonstrate appointment-related tracking, not to replace a verified medical record.
- Aadhaar authentication is not represented as a working feature.
- Do not enter real patient records, identity documents, or other sensitive personal information into the prototype.
- The platform does not diagnose medical conditions or replace professional medical advice.
- For medical emergencies, contact local emergency services or seek emergency care.

Before real-world deployment, the project would require security testing, privacy safeguards, reliable provider data, appropriate authorisations, and clinical and legal review where applicable.

## 🌱 Our Vision

We envision a healthcare experience in which people spend less time navigating disconnected services and more time getting the care and follow-up they need.

**SehatSetu is not just about booking a visit. It's about helping people find their way through their healthcare journey.**

## 👥 Team Code Storm

Built for **BuildLab**.

- Aashi
- Piyush Kumar
- Anugrah Singh
- Akshat Lamba

---

*SehatSetu is an evolving project. Features and integrations will be updated as development and testing progress.*
