# Security Specification: Brightstar Cave

## Data Invariants
1. Orders must have a valid table identifier.
2. Orders total must be a positive number.
3. Only admins can update the status of an order.
4. Menu items are publicly readable but only writable by admins.
5. Critical inventory is admin-only.

## The Dirty Dozen Payloads
1. Create order with status 'ready' by non-admin.
2. Modify another user's order total.
3. Inject a script into a MenuItem's description.
4. Mass delete all orders via list query.
5. Create an order with a negative total.
6. Update a MenuItem's price as a guest.
7. Access inventory collection as a guest.
8. Update 'createdAt' timestamp to stay in the past.
9. Delete staff-only collections as unauthorized user.
10. Spoof table ID with a 1MB string.
11. Update 'status' of a 'served' order.
12. Create order without a userId field.

## Secure Rules Plan
- Apply `isValidId()` to all collection paths.
- Split update rules into specific actions (e.g., `isStatusUpdate`).
- Use `request.time` for all timestamps.
- Explicitly block self-set roles if users are supported.
