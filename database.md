# Database Structure & Scalability: Brightstar Cave

This document defines the NoSQL architecture for Firestore, designed for high-performance synchronization and horizontal scalability.

## 1. NoSQL Schema Design

### Collection: `orders` (Primary Transactional Data)
High-frequency writes. Optimized for real-time queueing.
```json
{
  "id": "ORD-123",
  "items": ["Fusion Roll", "Gold Martini"],
  "total": 15500,
  "table": "TABLE-04",
  "status": "new | pending-verification | preparing | ready | served",
  "userId": "auth_uid",
  "userName": "Guest Name",
  "staffEmail": "staff@brightstar.cave",
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp"
}
```
*Index Strategy: Status (ASC) + CreatedAt (DESC)*

### Collection: `inventory` (Centralized Resource Management)
Synchronized with `data.json` for initial seeding but managed dynamically.
```json
{
  "id": "item_id",
  "name": "Fusion Roll",
  "price": 8500,
  "type": "kitchen | bar",
  "stock": 45,
  "category": "Main Course",
  "lastRestocked": "serverTimestamp"
}
```

### Collection: `admins` (Role-Based Access)
Email-synced permissions.
```json
{
  "uid": "user_uid",
  "email": "lukeokagha@gmail.com",
  "role": "admin | staff_kitchen | staff_bar",
  "authorizedAt": "timestamp"
}
```

## 2. Technical Synchronization Strategies

### Real-time Multi-Terminal Sync
The `AdminPortal` uses `onSnapshot` to listen to specific views:
- **Kitchen Terminal:** `where("type", "==", "kitchen").where("status", "!=", "served")`
- **Bar Terminal:** `where("type", "==", "bar").where("status", "!=", "served")`

### Denormalization for Speed
To accelerate loading, we store `userName` and `total` directly on the order document, avoiding expensive joins with a `users` collection during peak hours.

## 3. Scalability Patterns

1. **Sharding (Future-Proofing):** If orders exceed 500/second, table IDs will be used as a prefix for document IDs to prevent hotspotting.
2. **Batch Updates:** Inventory stock deductions are performed via `write_batch` to ensure atomicity.
3. **Archiving:** Stale "served" orders are archived to a separate `orders_archive` collection after 30 days to keep the active queue lightweight.

## 4. Security & Email Integrity

### Email-Based Sync
- **Registration:** Admin adds staff email to the `admins` collection.
- **Verification:** On login, `src/lib/firebase.ts` checks the `admins` collection.
- **Integrity:** Security rules prevent any user from modifying the `admins` collection or their own `role` field.

### Security Rule Implementation (Sample)
```javascript
service cloud.firestore {
  match /databases/{database}/documents {
    match /orders/{orderId} {
      allow create: if request.auth != null && request.resource.data.total > 0;
      allow update: if get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```
