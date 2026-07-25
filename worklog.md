# Worklog — WAFT MAM Farms Comprehensive Update

## Date: Comprehensive Update Session

## Changes Implemented (15 tasks)

### 1. FIX SAVE BUG (Critical) — FarmHandDashboard.tsx
- Added `isSubmittingRef = useRef(false)` to prevent polling from overwriting state during form submissions
- Modified `handleAutoData` to check `!isSubmittingRef.current` before updating state
- Wrapped all three submit handlers (`submitEggRecord`, `submitMortality`, `submitFeed`) with `isSubmittingRef.current = true` in try block and `false` in finally block
- Also fixed `useAutoRefresh.ts` to remove the immediate `doRefresh()` on mount which caused the cascading render lint error

### 2. PENDING AMENDMENTS MODEL — schema.prisma
- Added `PendingAmendment` model with fields: id, recordType, recordId, field, oldValue, newValue, reason, requestedBy, requestedAt, status, reviewedBy, reviewedAt
- Ran `npx prisma db push` and `npx prisma generate` successfully

### 3. CEO DATA RESET — /api/reset/route.ts (NEW)
- POST endpoint accepting `{ recordType, farmId?, role }`
- CEO-only access check
- Supports: DailyEggCollection, BirdMortality, FeedRecord, EggSale, BirdSale, Expense
- Zeros numeric fields, clears string fields
- Returns count of records reset

### 4. CEO AMENDMENT REVIEW PANEL — PendingAmendmentsPanel.tsx (NEW)
- Fetches pending amendments from `/api/amendments?status=Pending`
- Shows old vs new values with color-coded comparison
- Approve/Reject buttons with loading states
- On approve, applies the change to the original record via the API

### 5. AMENDMENT REQUEST FLOW — AmendmentRequestDialog.tsx (NEW)
- Reusable dialog component for all dashboards
- Shows field list, lets user select which field to amend
- New value input + reason textarea
- Submits to `/api/amendments` POST endpoint
- Toast: "Amendment submitted for CEO approval"

### 6. CEO TAB RESTRUCTURE — AppShell.tsx
- Changed CEO tabs from 3 to 4: Dashboard, Pending, Announcements, Access Control
- "Pending" tab renders `<PendingAmendmentsPanel />`
- Sidebar branding updated to "WAFT MAM Farms" / "and Trading Hub"

### 7. EDIT BUTTONS — All Dashboards
- **FarmHandDashboard**: Pencil buttons on egg collections and mortality records in History tab
- **SalesDashboard**: Pencil buttons on egg sales and bird sales in Recent sections
- **AccountantDashboard**: Pencil buttons on expense records in Expenses tab
- **VetDashboard**: Pencil button on treatment records
- All use `AmendmentRequestDialog` component

### 8. ACCOUNTANT 6-WEEK ALERTS — AccountantDashboard.tsx
- New "6-Week Payment Outlook" section at top
- Upcoming expense due dates with urgency color coding:
  - Red: overdue or within 7 days
  - Orange: 8-28 days
  - Amber: 29-42 days
- Aging receivables (6+ weeks old unpaid sales) in red alert card

### 9. CEO DATA RESET UI — CEODashboard.tsx
- New "Data Reset (CEO Only)" card section
- 6 reset buttons (Egg Collections, Mortality Records, Feed Records, Egg Sales, Bird Sales, Expenses)
- Confirmation dialog, loading state, toast notification
- Re-fetches dashboard data after successful reset

### 10. CEO STAFF DELETION — PasswordResetPanel.tsx
- Changed "Deactivate" button to "Remove Access" with UserMinus icon
- Added `ConfirmDeactivateDialog` component with clear messaging:
  - "This will remove the staff member's ability to log in. All their recorded data will be preserved."
- Confirm/Cancel buttons in dialog

### 11. API ROUTE FOR AMENDMENTS — /api/amendments/route.ts (NEW)
- GET: List amendments, filterable by status query param
- POST: Create amendment with recordType, recordId, field, oldValue, newValue, reason, requestedBy
- PUT: Approve or reject, actually applies the change to the original record on approval

### 12. RENAME BRANDING
- LoginScreen.tsx: "WAFT MAM Farms" / "and Trading Hub — Management System"
- AppShell.tsx sidebar: "WAFT MAM Farms" / "and Trading Hub"
- LoginScreen.tsx footer already had correct text

### 13. WAL MODE — db.ts
- Updated documentation to clarify WAL mode setup via Prisma/SQLite

### 14. LINT FIXES
- Fixed LiveSyncIndicator.tsx: Moved `setOnline(navigator.onLine)` to initial useState value
- Fixed useAutoRefresh.ts: Removed immediate `doRefresh()` call in useEffect (was causing cascading render lint error)

## Files Modified
| File | Change |
|------|--------|
| `prisma/schema.prisma` | Added PendingAmendment model |
| `src/app/api/reset/route.ts` | NEW - CEO data reset endpoint |
| `src/app/api/amendments/route.ts` | NEW - Amendment CRUD endpoint |
| `src/components/farm/AmendmentRequestDialog.tsx` | NEW - Reusable edit dialog |
| `src/components/farm/PendingAmendmentsPanel.tsx` | NEW - CEO review panel |
| `src/components/farm/FarmHandDashboard.tsx` | Save bug fix + edit buttons |
| `src/components/farm/SalesDashboard.tsx` | Added edit buttons |
| `src/components/farm/AccountantDashboard.tsx` | 6-week alerts + edit buttons |
| `src/components/farm/VetDashboard.tsx` | Added edit buttons |
| `src/components/farm/CEODashboard.tsx` | Data reset section |
| `src/components/farm/AppShell.tsx` | Pending tab + branding |
| `src/components/farm/PasswordResetPanel.tsx` | Deactivate UX improvement |
| `src/components/farm/LoginScreen.tsx` | Branding update |
| `src/components/farm/LiveSyncIndicator.tsx` | Lint fix |
| `src/hooks/useAutoRefresh.ts` | Lint fix + removed initial refresh |
| `src/lib/db.ts` | Updated documentation |
