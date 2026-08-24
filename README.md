# SmartWater – Urban Water Management & Leakage Monitoring System

A modern full-stack web application designed for Smart Cities & Municipalities (SIH-style project) for urban water network monitoring, water loss auditing, sensor telemetry, maintenance task dispatch, and citizen grievance redressal.

---

## 🌟 Key Features

1. **Role-Based Architecture**:
   - 🛡️ **Administrator**: System overview, water loss auditing, sensor monitoring, complaints dispatch, maintenance task tracking, CSV reports, user management, and threshold settings.
   - 👷 **Maintenance Worker**: Task queue, update progress with notes and photos, field network GIS map.
   - 👤 **Citizen**: Report water leaks/pressure outages with GPS & photos, real-time complaint resolution tracking, household consumption analytics & conservation tips.

2. **Live Simulated Telemetry (Demo Mode)**:
   - Automated 3-second sensor polling & random variation across flow, pressure, and tank level sensors.
   - Immediate critical alert triggers on pressure drop (< 1.5 bar) or tank overflow (> 95%).

3. **High-Performance Interactive GIS Map**:
   - Fully lazy-loaded Leaflet map centered on Pune, India (`18.5204, 73.8567`).
   - Displays water tanks, pump stations, pipeline networks (with diameter & material metadata), sensors, and active citizen complaints.
   - Isolated map chunk ensures the main dashboard remains fast and responsive.

4. **Zero-Setup Database**:
   - Backed by SQLite (`better-sqlite3`) pre-seeded with 5 municipal zones, 10 sensors, 15 water assets, 30 days of historical supply/loss data, and realistic demo users.

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- npm or pnpm

---

### Step 1: Start the Backend Server

```bash
cd backend
npm install
npm run dev
```

The backend server will automatically create and seed the SQLite database (`smartwater.db`) and listen on `http://localhost:3001`.

---

### Step 2: Start the Frontend Application

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server will run on `http://localhost:5173`.

---

## 🔐 Demo Credentials

Use the **Quick Demo Access** buttons on the login page or enter:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Administrator** | `admin@smartwater.gov` | `Admin@123` |
| **Maintenance Worker** | `worker@smartwater.gov` | `Worker@123` |
| **Citizen** | `citizen@smartwater.gov` | `Citizen@123` |

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite, Lucide React, Recharts, Leaflet & React-Leaflet (Lazy-loaded).
- **Backend**: Node.js, Express, TypeScript, SQLite (`better-sqlite3`), JWT Authentication, bcryptjs, Multer for file uploads.
