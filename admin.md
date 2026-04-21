# Technical Communication: Admin Operations

## 1. Overview
The Admin Portal is the central command center for Brightstar Cave. It manages real-time order flows for the Hotel, Kitchen, and Bar.

## 2. Access Control
- **Authentication:** Managed via Google Sign-In.
- **Authorization:** Only users with `isAdmin: true` in their profile or registered in the `admins` collection can access `/admin`.
- **Staff Attribution:** All manual orders must include a valid `staffEmail` for tracking and checkout validation.

## 3. Order Lifecycle
1. **New:** Order received from Guest or Staff.
2. **Preparing:** Acknowledged by Kitchen/Bar.
3. **Ready:** Item prepared and awaiting service.
4. **Served:** Order completed and moved to history.

## 4. Key Metrics
- **Live Sync:** Utilizes Firestore `onSnapshot` for < 100ms latency in order updates.
- **Stock Tracking:** Stock levels in `data.json` act as the source of truth, updated via admin actions.

## 5. Security Protocols
- Direct Firestore writes are blocked for critical fields (total, status) unless the requester is an Admin.
- All status changes are logged with `updatedAt` and the `adminId`.
