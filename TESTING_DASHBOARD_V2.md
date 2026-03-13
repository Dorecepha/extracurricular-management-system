# Dashboard V2 Testing Guide

## Issue Fixed

The 500 Internal Server Error was caused by incomplete DTO mapping in `DashboardController.java`. The frontend components (CapacityBar, event cards, etc.) expected `capacity` and `currentRegistrations` fields, but the `mapToEventDTO()` method was only returning basic event information.

### Changes Made

1. **Updated `mapToEventDTO()` method** (line 265-283)
   - Added: `capacity`, `currentRegistrations`, `description`, `status`
   - Added: `organizationType`, `organizerID`, `organizerName`, `organizationName`
   - Added: `createdAt`, `updatedAt`

2. **Updated `mapToProposalDTO()` method** (line 292-309)
   - Added: `description`, `reviewedAt`, `reviewedByID`
   - Added: `rejectionReason` (critical for rejected proposal alerts)
   - Added: `organizerID`, `organizerName`

## Prerequisites

Before testing, ensure:

1. **MySQL is running** on port 3306
2. **Backend has test users** in the database:
   - Student: `student@test.com` / `password123`
   - Organizer: `organizer@test.com` / `password123`
   - Admin: `admin@test.com` / `password123`

   *(If these don't exist, create them or update the test scripts with your actual test user credentials)*

3. **Backend needs to be rebuilt** to pick up the changes:

   ```bash
   cd backend
   mvn clean install -DskipTests
   ```

## Testing Steps

### Step 1: Start Backend Server

```bash
cd backend
mvn spring-boot:run
```

Wait for the server to start (look for "Started EmsApplication" in console).

### Step 2: Run API Tests

#### Option A: PowerShell (Windows)

```powershell
cd backend
.\test-dashboard-v2.ps1
```

#### Option B: Bash (Git Bash/WSL)

```bash
cd backend
chmod +x test-dashboard-v2.sh
./test-dashboard-v2.sh
```

#### Option C: Manual Testing with cURL

**1. Login as Student:**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"student@test.com\",\"password\":\"password123\"}"
```

Copy the token from the response, then:

**2. Test Dashboard V2:**
```bash
curl -X GET http://localhost:8080/api/dashboard/stats-v2 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

### Step 3: Test Frontend Integration

1. **Enable Dashboard V2** in `.env`:
   ```
   VITE_ENABLE_DASHBOARD_V2=true
   ```

2. **Start Frontend**:
   ```bash
   cd frontend/ems-frontend
   npm run dev
   ```

3. **Login and Navigate to Dashboard**:
   - Open http://localhost:5173
   - Login with test credentials
   - Dashboard should load without errors

### Step 4: Verify Role-Specific Features

#### For STUDENT Role:
- [ ] Hero card shows next event (if registered for upcoming events)
- [ ] Metrics cards show: Total Events, This Month, Upcoming
- [ ] Upcoming events table displays with dates and venues
- [ ] Past events accordion is collapsible
- [ ] Agenda sidebar shows events grouped by Today/Tomorrow/This Week
- [ ] No console errors

#### For ORGANIZER Role:
- [ ] Status cards show: Active Events, Pending Proposals, Needs Revision
- [ ] Rejected proposals show alert cards with rejection reason
- [ ] Event performance cards show capacity bars (colored correctly):
  - Red: <30% filled
  - Amber: 30-70% filled
  - Green: >70% filled
- [ ] My Events grid shows event cards with capacity info
- [ ] Agenda sidebar shows managed events
- [ ] No console errors

#### For ADMIN Role:
- [ ] System overview shows 4 metric cards
- [ ] Pending Proposals section shows count badge
- [ ] Event Modification Requests section shows count badge
- [ ] Recent Activity feed displays last 10 actions
- [ ] Activity items are clickable and navigate correctly
- [ ] Quick actions buttons navigate to correct pages
- [ ] Agenda sidebar shows all active events
- [ ] No console errors

## Common Issues & Solutions

### Issue 1: "Cannot read properties of undefined"
**Cause:** Event or proposal data missing expected fields
**Solution:** Ensure backend changes are compiled. Run `mvn clean install` and restart backend.

### Issue 2: Capacity bar not showing
**Cause:** `capacity` or `currentRegistrations` is null
**Solution:** Check that events in database have these fields populated. The mapper now includes null checks.

### Issue 3: 401 Unauthorized
**Cause:** Token expired or invalid
**Solution:** Login again to get a fresh token. JWT tokens expire after 24 hours.

### Issue 4: Admin recent activity is empty
**Cause:** No audit logs in database yet
**Solution:** This is normal if system is new. Perform some actions (register for events, submit proposals) to generate audit logs.

### Issue 5: Organizer "events needing attention" is empty
**Cause:** No events meet the criteria (<30% filled within 14 days OR >90% filled)
**Solution:** This is expected behavior. Create test events with low/high registration counts to trigger alerts.

## Expected API Response Structure

### Student Response:
```json
{
  "statusCode": 200,
  "message": "Stats fetched",
  "data": {
    "activeEvents": [...],
    "myTotalRegistrations": 5,
    "nextEvent": {
      "eventID": 1,
      "title": "Tech Workshop",
      "eventDate": "2024-03-15",
      "startTime": "14:00",
      "endTime": "16:00",
      "venue": "Room A101",
      "capacity": 50,
      "currentRegistrations": 23
    },
    "upcomingEventsCount": 3,
    "pastEventsCount": 2,
    "thisMonthRegistrations": 2
  }
}
```

### Organizer Response:
```json
{
  "statusCode": 200,
  "message": "Stats fetched",
  "data": {
    "activeEvents": [...],
    "myActiveEvents": 4,
    "totalRegistrationsForMyEvents": 87,
    "myProposalStats": {
      "APPROVED": 3,
      "PENDING": 1,
      "REJECTED": 1
    },
    "myProposals": [
      {
        "proposalID": 5,
        "title": "Music Concert",
        "status": "REJECTED",
        "rejectionReason": "Venue conflict with another event"
      }
    ],
    "eventsNeedingAttention": [...],
    "oldestPendingProposalDays": 5,
    "totalParticipantsAllTime": 87
  }
}
```

### Admin Response:
```json
{
  "statusCode": 200,
  "message": "Stats fetched",
  "data": {
    "totalStudents": 120,
    "totalOrganizers": 15,
    "pendingProposalsCount": 3,
    "pendingUpdatesCount": 1,
    "activeEventsCount": 12,
    "activeEvents": [...],
    "recentActivity": [
      {
        "actorName": "john@test.com",
        "actorRole": "STUDENT",
        "action": "registered for",
        "targetName": "Tech Workshop",
        "timestamp": "2024-03-14T10:30:00",
        "navigationUrl": "/events/1"
      }
    ],
    "weeklyRegistrationCount": 23
  }
}
```

## Performance Considerations

The `/api/dashboard/stats-v2` endpoint performs multiple database queries:

- **Student**: 3-4 queries (registrations, event filtering, counting)
- **Organizer**: 5-6 queries (events, proposals, registrations, capacity calculations)
- **Admin**: 6-7 queries (user counts, proposals, updates, events, audit logs)

For production, consider:
1. Adding database indexes on frequently queried fields
2. Caching dashboard data for 1-2 minutes
3. Implementing pagination for large event lists
4. Using database views for complex aggregations

## Next Steps

After successful testing:

1. **Verify responsive behavior** on mobile/tablet
2. **Test animations** (staggered reveals on page load)
3. **Test empty states** (new user with no data)
4. **Profile performance** with large datasets (100+ events)
5. **Consider load testing** if expecting high concurrent usage

## Rollback Plan

If critical issues arise after deployment:

1. Set `VITE_ENABLE_DASHBOARD_V2=false` in `.env`
2. Restart frontend: `npm run dev`
3. Users will see original dashboard (V1)
4. No backend changes needed - both endpoints coexist

---

**Last Updated:** 2024-03-14
**Contact:** Check backend console logs for detailed error messages
