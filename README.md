# Brightstar Cave

Brightstar Cave is a professional, scalable hospitality management platform designed for luxury Hotel, Kitchen, and Bar operations. It bridges the gap between high-end guest experiences and seamless back-of-house operations through an "Afro-Asian Fusion" tech-forward approach.

## 🌟 Product Value Proposition

Brightstar Cave transforms hospitality management by providing a unified, real-time ecosystem for luxury establishments.

- **Unified Operations:** Synchronizes guest orders across Hotel, Kitchen, and Bar departments in a single, cohesive interface.
- **Luxury Guest Experience:** A high-immersion "Dark & Gold" aesthetic designed for premium clientele, featuring fluid transitions and intuitive navigation.
- **Operational Efficiency:** Real-time order queues for staff with distinct views for Kitchen and Bar operations, reducing latency and errors.
- **Staff Accountability:** Integrated staff-specific checkout flows with email attribution for every manual order.
- **Data-Driven Insights:** Centralized tracking of revenue, stock levels, and staff performance.

## 🚀 Key Features

### Guest Interface
- **Curated Digital Menu:** Browse by categories (Cocktails, Small Plates, Mains, Apartments) with high-quality visuals.
- **VIP Ordering:** Seamless cart management and real-time order tracking.
- **Interactive Feedback:** Fluid animations powered by Framer Motion for a premium feel.

### Admin & Staff Portal
- **Kitchen & Bar Views:** Dedicated real-time monitors for preparation and service.
- **Order Lifecycle Management:** Track orders from `New` → `Preparing` → `Ready` → `Served`.
- **Stock Management:** Real-time visibility into inventory levels synced across the platform.
- **Secure Access:** Role-based access control (RBAC) ensuring only authorized admins can manage critical operations.

## 🛠 Technical Stack

- **Frontend:** [React 19](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/) for type-safe, component-driven development.
- **Build Tool:** [Vite](https://vitejs.dev/) for lightning-fast development and optimized production builds.
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) for a modern, responsive, and luxury-themed UI.
- **Backend & Database:** [Firebase](https://firebase.google.com/) (Firestore) for real-time data synchronization and [Firebase Auth](https://firebase.google.com/products/auth) for secure identity management.
- **Animations:** [Motion](https://motion.dev/) (Framer Motion) for high-performance, fluid UI interactions.
- **Icons:** [Lucide React](https://lucide.dev/) for clean, consistent iconography.
- **AI Integration:** [Google Generative AI](https://ai.google.dev/) capabilities for enhanced content and interactions.

## 📁 Project Structure

```text
src/
├── components/         # Reusable UI elements (Layout, Navigation, UI Kits)
├── pages/              # Page-level components (Landing, Ordering, Admin)
├── data/               # Static data, menu definitions, and JSON sources
├── lib/                # Third-party integrations (Firebase configuration)
├── App.tsx             # Main routing and application logic
└── main.tsx            # Application entry point
```

## 🛠 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- A Firebase project for database and authentication

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/lukewealth/BrightstarCave.git
   cd BrightstarCave
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root directory and add your Firebase credentials (see `.env.example`).

4. **Run in development mode:**
   ```bash
   npm run dev
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```

## 🔒 Security

The platform implements a "Dirty Dozen" security rule set in Firestore to ensure:
- Only authorized Admins can update order statuses or stock.
- Guest data is protected and only visible to authorized personnel.
- All critical transactions are validated server-side.

---

Built with ❤️ for luxury hospitality.
