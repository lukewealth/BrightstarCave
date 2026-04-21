# Brightstar Cave - Product Evolution Plan

## 1. Business Analysis
**Objective:** Transform the current prototype into a professional, scalable, and reusable platform for luxury hospitality management, specifically targeting Hotel, Kitchen, and Bar operations.

**Key Stakeholders:**
- **Guests/Users:** High-end clientele seeking an ambient, seamless ordering and booking experience.
- **Staff (Kitchen/Bar):** Operational teams needing real-time order queues to manage fulfillment.
- **Admin/Management:** Decision-makers tracking revenue, stock, and staff performance.

**Core Value Proposition:**
An "Afro-Asian Fusion" concept where technology meets luxury. The platform synchronizes orders across different departments (Hotel, Kitchen, Bar) in a unified interface.

## 2. Technical Analysis
**Current State:**
- **Monolithic `App.tsx`:** Contains all routing, layout, and page logic (~1000 lines).
- **Hardcoded Data:** Menu items are embedded within the component.
- **Basic Firebase Integration:** Using Firestore for orders, but lacks structured security rules and complex queries.
- **Theming:** Solid Tailwind CSS implementation with a luxury aesthetic (Gold/Black).

**Required Improvements:**
- **Modularization:** Split `App.tsx` into discrete pages and components.
- **Data Externalization:** Use `data.json` and a typed `menu.ts` for centralized content management.
- **Staff-Specific Checkout:** Implement a flow where staff can process orders using their email ID for attribution.
- **Real-time Synchronization:** Enhanced listeners for Kitchen and Bar views.

## 3. Product Architecture (To-Be)

### File Structure Synchronization
```text
src/
├── components/         # Reusable UI elements (Layout, Button, Cards)
├── pages/              # Page components (Home, Orders, Admin, About)
│   ├── admin/          # Admin-specific sub-pages (Kitchen, Bar, Dashboard)
│   └── user/           # User-specific sub-pages (Menu, Booking)
├── data/               # Static data and types
│   ├── data.json       # Source of truth for menu/stock
│   └── menu.ts         # TypeScript interfaces and data loaders
├── lib/                # Firebase and utility functions
├── hooks/              # Custom React hooks (useOrders, useAuth)
└── App.tsx             # Main routing and provider setup
```

### Data Schema (Firestore)
- **collections/orders**: `{ items[], total, tableId, status, userId, staffEmail, createdAt }`
- **collections/menu**: `{ name, price, category, stock, type (kitchen/bar/hotel) }`
- **collections/admins**: `{ uid, role, email }`

## 4. Implementation Roadmap

### Phase 1: Structure & Data (Immediate)
- Create `data/data.json` and `data/menu.ts`.
- Refactor `App.tsx` by extracting pages into `src/pages`.
- Generate `admin.md` and `user.md` for technical documentation.

### Phase 2: Operations Expansion
- Create `KitchenView.tsx` and `BarView.tsx` within the Admin Portal.
- Implement stock management visibility in the Admin Dashboard.

### Phase 3: Staff Integration
- Add "Staff Checkout" modal to the `OrderingPage`.
- Require staff email ID for manual order entry.

### Phase 4: Verification & Security
- Implement the "Dirty Dozen" security rule plan in `firestore.rules`.
- Validate real-time sync across multiple devices.
