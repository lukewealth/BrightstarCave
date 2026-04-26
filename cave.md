# Brightstar Cave - Technical Integration Matrix

This document outlines the full-stack integration of Firebase and Gemini AI into the Brightstar Cave ecosystem.

## 🔐 1. Identity & Access Management (Firebase Auth)
**Project ID:** `brightstart-6afcd`

### **Authentication Flows**
- **Admin/Staff Portal:** Secure entry via Email/Password credentials.
  - *Primary Admin:* `contact@tricode.pro`
  - *Primary Staff:* `lukeokagha@gmail.com`
- **Guest Experience:** Seamless high-tier entry via Google OAuth.

### **Role-Based Access Control (RBAC)**
| Role | Access Level | Description |
| :--- | :--- | :--- |
| `admin` | Full Spectrum | Manage menu, inventory, users, and financial reports. |
| `staff_kitchen` | Operations | Real-time kitchen monitor, status updates (Preparing/Ready). |
| `staff_bar` | Operations | Real-time bar monitor, status updates (Preparing/Ready). |
| `staff_waiter` | Service | Order placement, table management, and serving status. |
| `guest` | Consumer | Menu browsing and digital ordering. |

---

## 🗄️ 2. Database Infrastructure (Firestore & SQL Connect)

### **NoSQL Architecture (Cloud Firestore)**
**Database Instance:** `(default)`
- **Collections:**
  - `menu`: Product details, pricing, and departmental routing (Kitchen/Bar).
  - `inventory`: Real-time stock tracking and reorder thresholds.
  - `orders`: Transactional history, table attribution, and lifecycle status.
  - `admins`: RBAC mappings linking Auth UIDs to operational roles.

### **Security Logic (Dirty Dozen Rules)**
Implemented in `firestore.rules`:
- **Recursive Locking:** All paths denied by default.
- **Role Validation:** Writes permitted only if `request.auth.uid` exists in the `admins` collection with appropriate clearance.
- **Data Integrity:** Strict schema validation for incoming order objects (price > 0, status in enum).

---

## 🤖 3. Intelligence Layer (Gemini AI)
**Integration Model:** `@google/genai`

### **Feature: Semantic Menu Search**
- **Mechanism:** Vector embeddings generated for menu descriptions.
- **Usage:** Guests can search using natural language (e.g., *"Something light for a humid evening"*).
- **Endpoint:** SQL Connect Vector Similarity query.

### **Feature: Schema Generator**
- **Interface:** Located in the Admin Terminal.
- **Logic:** Gemini translates natural language app descriptions into GraphQL schemas and PostgreSQL tables for rapid operational expansion.

---

## 🚀 4. Deployment & Environment
- **Hosting URL:** [https://brightstart-6afcd.web.app](https://brightstart-6afcd.web.app)
- **CI/CD:** Manual deployment via `firebase-tools`.
- **Environment:**
  - `VITE_FIREBASE_FIRESTORE_DATABASE_ID`: `(default)`
  - `NODE_ENV`: `production`

---
*Brightstar Encryption v4.0 | Powered by Gemini AI*
