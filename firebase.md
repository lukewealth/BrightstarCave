# Firebase Integration Guide: Brightstar Cave

This document outlines the technical synchronization and optimization strategies for integrating Firebase into the Brightstar Cave ecosystem.

## 1. Technical Synchronization

### Environment Configuration
Ensure your `.env` file is synchronized with the Firebase project settings. This project uses Vite's environment variable system.

```bash
VITE_FIREBASE_PROJECT_ID=brightstart-6afcd
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...

# Admin/Staff Sync
VITE_ADMIN_EMAIL=contact@tricode.pro
VITE_ADMIN_PASSWORD=...
VITE_STAFF_EMAIL=staff@brightstar.cave
```

### Core SDK Setup (`src/lib/firebase.ts`)
The project utilizes Firebase v10+ with functional imports for tree-shaking and reduced bundle size.

## 2. Authentication & Login Flow

### Multi-Method Support
- **Google Auth:** For guests seeking a fast checkout.
- **Email/Password:** For staff and administrators.
- **Admin Auto-Sync:** The system checks environment variables first, then queries the `admins` collection in Firestore for granular role-based access.

### Reusable Auth Component: `AuthGuard.tsx`
Wrap protected routes with this component to ensure only authorized users can access specific terminals.

```tsx
export const AuthGuard = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth(); // Custom hook for auth state
  if (loading) return <LoadingSpinner />;
  if (!user) return <LoginPopup />;
  if (requireAdmin && !isAdmin(user)) return <AccessDenied />;
  return children;
};
```

## 3. Loading Speed Acceleration & Optimization

### Offline Persistence
Enable experimental offline support to ensure the app remains functional in low-connectivity areas (e.g., basement bars).

```typescript
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore';

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache()
});
```

### Selective Real-time Listeners
To prevent memory leaks and unnecessary billing:
1. **Unsubscribe on Unmount:** Always return the unsubscribe function in `useEffect`.
2. **Limit Queries:** Use `limit(50)` for order queues.
3. **Snapshot Diffing:** Use `snapshot.docChanges()` to only update UI elements that changed, rather than re-rendering the entire list.

### Image Optimization
Large assets (e.g., `BrightstarCave.jpeg`) should be served via Firebase Hosting with CDN caching or optimized via a transformation proxy before being displayed in the menu.

## 4. Admin Management & Email Sync

### Personnel Authorization
The system synchronizes authorized personnel through two layers:
1. **Static Sync:** Environment variables for root administrators.
2. **Dynamic Sync:** The `admins` collection for staff (Kitchen/Bar).

### Activity Logging
Every admin action (status update, inventory change) is stamped with `updatedBy: user.email` and `serverTimestamp()` to maintain an audit trail.

ey Enhancements:
   * Design System: Added GlassModal, LuxuryTable, TabSystem, StatusBadge, and Toast components to Primitive.tsx, ensuring a
     consistent and premium "Afro-Asian Fusion" aesthetic across the app.
   * Database & RBAC:
       * Implemented a multi-tier role system: admin, staff_kitchen, staff_bar, staff_waiter, and guest.
       * Added inventory seeding logic to initialize Firestore from data.json.
       * Integrated atomic stock management (deductions and sales tracking) into the checkout flow.
   * Admin Portal (Full Control):
       * Analytics: Real-time revenue tracking and performance insights.
       * Inventory: Full control over menu items with low-stock alerts and automatic sync.
       * Staff Management: Onboard and manage staff roles directly from the dashboard.
       * Active Queue: Live order monitoring with status update capabilities.
   * Staff & Guest Experience:
  The platform is now fully equipped for both operational management and a premium guest experience.
