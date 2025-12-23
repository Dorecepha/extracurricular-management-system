# Admin Review Workflow - Diagnostic Report

**Context:** EMS Phase 7 - Admin Workflow
**Issue:** Proposals exist in DB as PENDING, but Admin Review List shows empty
**Date:** 2025-12-23

---

## BACKEND VERIFICATION ✅

### 1. AdminController.java (Lines 25-33)

**Status:** ✅ CORRECT

```java
@GetMapping("/proposals")
public ResponseEntity<Response<List<Proposal>>> getPendingProposals() {
    List<Proposal> proposals = proposalService.getPendingProposals();
    return ResponseEntity.ok(new Response<>(
        200,
        "Pending proposals retrieved successfully",
        proposals
    ));
}
```

**Verification:**
- ✅ Endpoint: `/api/admin/proposals`
- ✅ Returns: `Response<List<Proposal>>`
- ✅ Calls: `proposalService.getPendingProposals()`
- ✅ Authorization: `@PreAuthorize("hasRole('ADMIN')")`

---

### 2. ProposalServiceImpl.java (Lines 30-32)

**Status:** ✅ CORRECT

```java
@Override
public List<Proposal> getPendingProposals() {
    return proposalRepository.findByStatus(ApprovalStatus.PENDING);
}
```

**Verification:**
- ✅ Calls repository with `ApprovalStatus.PENDING` enum
- ✅ Returns `List<Proposal>`

---

### 3. ProposalRepository.java (Lines 11-13)

**Status:** ✅ CORRECT

```java
@Repository
public interface ProposalRepository extends JpaRepository<Proposal, Long> {
    List<Proposal> findByOrganizer_UserID(Long organizerId);
    List<Proposal> findByStatus(ApprovalStatus status);
}
```

**Verification:**
- ✅ Spring Data JPA query method
- ✅ Signature: `List<Proposal> findByStatus(ApprovalStatus status)`
- ✅ Will generate query: `SELECT * FROM proposals WHERE status = ?`

---

### 4. ApprovalStatus Enum (Lines 3-7)

**Status:** ✅ CORRECT

```java
public enum ApprovalStatus {
    PENDING,
    APPROVED,
    REJECTED
}
```

**Verification:**
- ✅ Three states defined
- ✅ PENDING is first value

---

### 5. Proposal Entity (Lines 56-58)

**Status:** ✅ CRITICAL - CORRECT CONFIGURATION

```java
@Enumerated(EnumType.STRING)
@Builder.Default
private ApprovalStatus status = ApprovalStatus.PENDING;
```

**Verification:**
- ✅ `@Enumerated(EnumType.STRING)` - Stores as "PENDING", "APPROVED", "REJECTED" strings in DB
- ✅ `@Builder.Default` - Sets default to PENDING
- ✅ No ordinal storage (would be 0, 1, 2) - uses STRING ✅

**Database Storage:**
```sql
-- Correct format (EnumType.STRING)
status = 'PENDING'  ✅

-- Incorrect format (would be EnumType.ORDINAL)
status = 0  ❌ (This would break)
```

---

## FRONTEND VERIFICATION ✅

### 1. adminApi.js (Lines 8-14) - WITH DEBUG LOGGING

**Status:** ✅ CORRECT (Debug logging added)

```javascript
getPendingProposals: async () => {
  const response = await api.get('/admin/proposals');
  // DNA: response.data is the Response<T> wrapper {statusCode, message, data}
  console.log('DEBUG: Admin Proposal Response:', response.data);
  console.log('DEBUG: Unwrapped Proposals:', response.data.data);
  return response.data.data;
},
```

**Verification:**
- ✅ Endpoint: `/admin/proposals` (baseURL adds `/api`)
- ✅ Full URL: `http://localhost:8080/api/admin/proposals`
- ✅ Unwraps: `response.data.data` (gets inner data from Response wrapper)
- ✅ Debug logs added for troubleshooting

**Expected Console Output:**
```javascript
DEBUG: Admin Proposal Response: {
  statusCode: 200,
  message: "Pending proposals retrieved successfully",
  data: [
    { proposalID: 1, title: "...", status: "PENDING", ... },
    { proposalID: 2, title: "...", status: "PENDING", ... }
  ]
}
DEBUG: Unwrapped Proposals: [
  { proposalID: 1, title: "...", ... },
  { proposalID: 2, title: "...", ... }
]
```

---

### 2. ProposalReviewList.jsx (Lines 10-38) - WITH DEBUG LOGGING

**Status:** ✅ CORRECT (Debug logging added)

```javascript
const { data: rawData, isLoading, isError, error } = useQuery({
  queryKey: ['admin', 'proposals'],
  queryFn: adminApi.getPendingProposals
});

// DEBUG: Log the raw data received from React Query
console.log('DEBUG ProposalReviewList - rawData:', rawData);
console.log('DEBUG ProposalReviewList - isLoading:', isLoading);
console.log('DEBUG ProposalReviewList - isError:', isError);
console.log('DEBUG ProposalReviewList - error:', error);

// DNA FIX: Handle Spring Page object or raw List
const proposals = Array.isArray(rawData) ? rawData : rawData?.content || [];

// DEBUG: Log the extracted proposals array
console.log('DEBUG ProposalReviewList - proposals array:', proposals);
console.log('DEBUG ProposalReviewList - proposals.length:', proposals.length);
```

**Verification:**
- ✅ Uses React Query for data fetching
- ✅ Handles both array and paginated response
- ✅ Debug logs added at multiple points
- ✅ Empty state handled with "No pending proposals" message

---

## DIAGNOSTIC FLOW CHART

```
┌──────────────────────────────────────────────────────────────┐
│ 1. User (ADMIN) accesses /admin/proposals                   │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. ProposalReviewList.jsx renders                           │
│    - useQuery triggers adminApi.getPendingProposals()       │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. Frontend: GET /admin/proposals                           │
│    - axios interceptor adds: Authorization: Bearer {token}  │
│    - Full URL: http://localhost:8080/api/admin/proposals   │
│    ⚠️ CHECK CONSOLE: "DEBUG: Admin Proposal Response"       │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. Backend: AdminController.getPendingProposals()           │
│    - @PreAuthorize checks if user has ADMIN role            │
│    - Calls proposalService.getPendingProposals()            │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│ 5. Backend: ProposalServiceImpl.getPendingProposals()       │
│    - Calls proposalRepository.findByStatus(PENDING)         │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│ 6. Database Query Executed                                   │
│    SQL: SELECT * FROM proposals WHERE status = 'PENDING'    │
│    - Returns rows with status column = 'PENDING' string     │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│ 7. Backend Returns Response Wrapper                         │
│    {                                                         │
│      statusCode: 200,                                        │
│      message: "Pending proposals retrieved successfully",   │
│      data: [<Proposal[]>]                                   │
│    }                                                         │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│ 8. Frontend: adminApi.js unwraps response                   │
│    return response.data.data  // Extracts inner array       │
│    ⚠️ CHECK CONSOLE: "DEBUG: Unwrapped Proposals"           │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│ 9. React Query caches data                                  │
│    rawData = [<Proposal[]>]                                 │
│    ⚠️ CHECK CONSOLE: "DEBUG ProposalReviewList - rawData"   │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│ 10. ProposalReviewList.jsx processes data                   │
│     proposals = Array.isArray(rawData) ? rawData : ...      │
│     ⚠️ CHECK CONSOLE: "proposals array" & "proposals.length"│
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│ 11. UI Renders                                              │
│     if (proposals.length === 0) → "No pending proposals"    │
│     else → proposals.map(...) → Show cards                  │
└──────────────────────────────────────────────────────────────┘
```

---

## DEBUGGING INSTRUCTIONS

### Step 1: Check Browser Console (F12)

**Open the Admin Review page and look for these console logs:**

```javascript
// 1. Check API response (from adminApi.js)
DEBUG: Admin Proposal Response: { statusCode: 200, message: "...", data: [...] }
DEBUG: Unwrapped Proposals: [...]

// 2. Check React Query data (from ProposalReviewList.jsx)
DEBUG ProposalReviewList - rawData: [...]
DEBUG ProposalReviewList - isLoading: false
DEBUG ProposalReviewList - isError: false
DEBUG ProposalReviewList - error: null

// 3. Check extracted proposals array
DEBUG ProposalReviewList - proposals array: [...]
DEBUG ProposalReviewList - proposals.length: X
```

---

### Step 2: Interpret Console Output

#### Scenario A: Empty Response from Backend ❌

```javascript
DEBUG: Admin Proposal Response: { statusCode: 200, message: "...", data: [] }
DEBUG: Unwrapped Proposals: []
```

**Diagnosis:** Backend query is returning empty results

**Possible Causes:**
1. No proposals in database with status = 'PENDING'
2. Database status column has wrong format (e.g., 0 instead of 'PENDING')
3. Database connection issue

**Solution: Check Database**

```sql
-- Run this query in your database
SELECT proposal_id, title, status, submitted_at
FROM proposals
WHERE status = 'PENDING';

-- If this returns nothing, check ALL proposals:
SELECT proposal_id, title, status, submitted_at
FROM proposals;

-- Check data type of status column:
DESCRIBE proposals;  -- MySQL
\d proposals;        -- PostgreSQL
```

**Expected:**
- status column type: `VARCHAR` or `TEXT`
- status values: `'PENDING'`, `'APPROVED'`, `'REJECTED'` (strings, not numbers)

---

#### Scenario B: Backend Returns Data, Frontend Shows Empty ❌

```javascript
DEBUG: Admin Proposal Response: { statusCode: 200, message: "...", data: [{ proposalID: 1, ... }] }
DEBUG: Unwrapped Proposals: [{ proposalID: 1, ... }]
DEBUG ProposalReviewList - rawData: [{ proposalID: 1, ... }]
DEBUG ProposalReviewList - proposals array: []  ⚠️ Empty!
DEBUG ProposalReviewList - proposals.length: 0
```

**Diagnosis:** Data unwrapping issue in component

**Possible Cause:**
`rawData` is not an array, and `rawData.content` is also undefined

**Solution: Check the DNA FIX line (Line 34)**

Current code:
```javascript
const proposals = Array.isArray(rawData) ? rawData : rawData?.content || [];
```

If rawData is an object like `{ proposals: [...] }`, adjust to:
```javascript
const proposals = Array.isArray(rawData)
  ? rawData
  : (rawData?.content || rawData?.proposals || []);
```

---

#### Scenario C: Authorization Error ❌

```javascript
DEBUG ProposalReviewList - isError: true
DEBUG ProposalReviewList - error: "Access Denied" or "403 Forbidden"
```

**Diagnosis:** User doesn't have ADMIN role

**Solution:**
1. Check localStorage user role:
   ```javascript
   const user = JSON.parse(localStorage.getItem('user'));
   console.log('User role:', user.role);
   ```

2. Verify role is exactly `'ADMIN'` (case-sensitive)

3. If role is wrong, logout and login again with admin credentials

---

#### Scenario D: Network Error ❌

```javascript
DEBUG ProposalReviewList - isError: true
DEBUG ProposalReviewList - error: "Network Error" or "ERR_CONNECTION_REFUSED"
```

**Diagnosis:** Backend server not running

**Solution:**
```bash
cd backend
mvn spring-boot:run
# OR
java -jar target/ems-backend.jar
```

Verify backend is accessible:
```
http://localhost:8080/api/auth/login (should return 200 or 401, not connection error)
```

---

#### Scenario E: Success ✅

```javascript
DEBUG: Admin Proposal Response: { statusCode: 200, message: "...", data: [{ proposalID: 1, ... }] }
DEBUG: Unwrapped Proposals: [{ proposalID: 1, title: "...", ... }]
DEBUG ProposalReviewList - rawData: [{ proposalID: 1, ... }]
DEBUG ProposalReviewList - isLoading: false
DEBUG ProposalReviewList - isError: false
DEBUG ProposalReviewList - proposals array: [{ proposalID: 1, ... }]
DEBUG ProposalReviewList - proposals.length: 1
```

**Result:** Proposal cards render on screen ✅

---

## DATABASE VERIFICATION SCRIPT

### MySQL/MariaDB

```sql
-- 1. Check if proposals table exists
SHOW TABLES LIKE 'proposals';

-- 2. Check table structure
DESCRIBE proposals;

-- 3. Check status column type (should be VARCHAR/TEXT, not INT)
SELECT COLUMN_NAME, COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'proposals'
AND COLUMN_NAME = 'status';

-- 4. Check all proposals
SELECT proposal_id, title, status, submitted_at, organizer_id
FROM proposals
ORDER BY submitted_at DESC;

-- 5. Check PENDING proposals specifically
SELECT COUNT(*) as pending_count
FROM proposals
WHERE status = 'PENDING';

-- 6. If count is 0 but you expect proposals, check for wrong format
SELECT DISTINCT status FROM proposals;
-- Expected: 'PENDING', 'APPROVED', 'REJECTED'
-- Wrong: 0, 1, 2 (indicates EnumType.ORDINAL was used)
```

### PostgreSQL

```sql
-- 1. Check if proposals table exists
SELECT tablename FROM pg_tables WHERE tablename = 'proposals';

-- 2. Check table structure
\d proposals;

-- 3. Check status column type
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'proposals'
AND column_name = 'status';

-- 4. Check all proposals
SELECT proposal_id, title, status, submitted_at, organizer_id
FROM proposals
ORDER BY submitted_at DESC;

-- 5. Check PENDING proposals
SELECT COUNT(*) as pending_count
FROM proposals
WHERE status = 'PENDING';

-- 6. Check distinct status values
SELECT DISTINCT status FROM proposals;
```

---

## COMMON ISSUES & FIXES

### Issue 1: Empty List Despite Having PENDING Proposals in DB

**Symptom:**
- Database has rows with `status = 'PENDING'`
- Backend returns empty array

**Cause:**
Status column storing numbers (0, 1, 2) instead of strings

**Check:**
```sql
SELECT status FROM proposals LIMIT 1;
-- If returns: 0, 1, or 2 (numbers) → WRONG
-- If returns: 'PENDING', 'APPROVED', 'REJECTED' → CORRECT
```

**Fix (if wrong):**
The entity is correctly configured with `@Enumerated(EnumType.STRING)`, but existing DB data may be corrupt.

**Migration Script:**
```sql
-- Convert ordinal numbers to string values
UPDATE proposals SET status = 'PENDING' WHERE status = '0' OR status = 0;
UPDATE proposals SET status = 'APPROVED' WHERE status = '1' OR status = 1;
UPDATE proposals SET status = 'REJECTED' WHERE status = '2' OR status = 2;
```

---

### Issue 2: 403 Forbidden Error

**Symptom:**
- Console shows: `DEBUG ProposalReviewList - error: "Access Denied"`
- HTTP status: 403

**Cause:**
User is not ADMIN

**Fix:**
1. Check user role:
   ```javascript
   const user = JSON.parse(localStorage.getItem('user'));
   console.log(user.role); // Should be 'ADMIN'
   ```

2. If not ADMIN, login with admin credentials

3. Verify backend has admin user in database:
   ```sql
   SELECT user_id, email, role FROM users WHERE role = 'ADMIN';
   ```

---

### Issue 3: Network Error / CORS Error

**Symptom:**
- Console shows: `Network Error` or `CORS policy`
- No DEBUG logs from adminApi.js

**Cause:**
Backend not running or CORS misconfigured

**Fix:**
1. Start backend:
   ```bash
   cd backend
   mvn spring-boot:run
   ```

2. Verify CORS config allows frontend origin:
   ```java
   // Should allow http://localhost:5173
   @CrossOrigin(origins = "http://localhost:5173")
   ```

---

### Issue 4: Token Expired / Invalid

**Symptom:**
- 401 Unauthorized even as ADMIN
- Worked before, stopped working after some time

**Cause:**
JWT token expired

**Fix:**
1. Logout and login again
2. Check token expiry in backend JwtUtils
3. Clear localStorage and re-authenticate:
   ```javascript
   localStorage.clear();
   // Navigate to /login
   ```

---

## APPROVE/REJECT WORKFLOW

### Approve Proposal (Lines 38-46 in AdminController.java)

**Endpoint:** `PUT /api/admin/proposals/{proposalID}/approve`

**Expected Flow:**
1. Admin clicks "Approve" button
2. Frontend calls `adminApi.approveProposal(proposalID)`
3. Backend updates proposal status to APPROVED
4. Backend creates new Event from proposal data
5. Event status set to UPCOMING
6. Event approval status set to APPROVED

**Frontend Call:**
```javascript
await adminApi.approveProposal(proposalID);
// No request body needed
```

**Backend Logic:**
```java
proposal.setStatus(ApprovalStatus.APPROVED);
proposalRepository.save(proposal);

Event event = new Event();
// ... copy proposal fields to event
event.setStatus(EventStatus.UPCOMING);
event.setApprovalStatus(ApprovalStatus.APPROVED);
eventRepository.save(event);
```

---

### Reject Proposal (Lines 51-60 in AdminController.java)

**Endpoint:** `PUT /api/admin/proposals/{proposalID}/reject`

**Expected Flow:**
1. Admin enters rejection reason and clicks "Reject"
2. Frontend calls `adminApi.rejectProposal(proposalID, reason)`
3. Backend updates proposal status to REJECTED
4. Backend saves rejection reason
5. No event is created

**Frontend Call:**
```javascript
await adminApi.rejectProposal(proposalID, "Reason for rejection");
// Request body: { rejectionReason: "..." }
```

**Backend Logic:**
```java
proposal.setStatus(ApprovalStatus.REJECTED);
proposal.setRejectionReason(reason);
proposalRepository.save(proposal);
```

---

## TESTING CHECKLIST

- [ ] Backend server running on port 8080
- [ ] Frontend server running on port 5173
- [ ] Database has at least one proposal with `status = 'PENDING'`
- [ ] Logged in as user with role = 'ADMIN'
- [ ] Browser console shows DEBUG logs
- [ ] Navigate to `/admin/proposals`
- [ ] Check console for "DEBUG: Admin Proposal Response"
- [ ] Verify `data` array contains proposals
- [ ] Verify `proposals.length > 0`
- [ ] UI shows proposal cards (not "No pending proposals")
- [ ] Can click on proposal card to view details
- [ ] Can approve proposal (creates event)
- [ ] Can reject proposal (saves reason)

---

## FILES MODIFIED

1. **frontend/ems-frontend/src/features/admin/adminApi.js**
   - Added `console.log` for response and unwrapped data

2. **frontend/ems-frontend/src/features/admin/ProposalReviewList.jsx**
   - Added `console.log` for rawData, isLoading, isError, error
   - Added `console.log` for proposals array and length

---

## NEXT STEPS

1. **Open Admin Review page** in browser
2. **Open DevTools Console** (F12)
3. **Check DEBUG logs** and match with scenarios above
4. **Follow the appropriate fix** based on console output
5. **Report findings** with console log screenshots

---

**Status:** Debugging infrastructure added ✅
**Next Action:** User must check browser console and report findings
**Expected Outcome:** Identify exact point of failure in data flow
