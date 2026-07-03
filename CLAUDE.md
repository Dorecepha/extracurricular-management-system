# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Workflow Preferences

- When asked to implement something, write code directly instead of creating plan files or entering plan mode unless explicitly asked to plan first.
- When the user interrupts or says 'just do it', immediately start writing code/output instead of continuing to explore or plan.
- Stay strictly within the scope of requested tasks. Do not add features, refactor unrelated code, or expand beyond what was explicitly asked.

---

## Database & SQL

- For Java/Spring projects using MySQL/MariaDB: always validate SQL syntax against MySQL 8.0 compatibility. Avoid IF NOT EXISTS on columns, ensure column creation order is correct, and test VARCHAR lengths against enum values.

---

## 🚧 Active Project: New Feature Implementation


**Status:** Complete the task description mentioned in EMS_FEATURE_PROPOSAL.md in the root directory. Currently no progress has been done. 

---

## EMS DNA (Immutable Design Principles)

These four principles govern ALL development in this codebase. Violating them breaks existing code and frontend expectations.

### 1. Identity Naming Convention
**All primary keys MUST use `camelCaseID` suffix.**

Examples: `userID`, `eventID`, `proposalID`, `registrationID`, `organizerID`

This applies to:
- Entity fields: `@Column(name = "user_id") private Long userID;`
- DTO fields: `private Long eventID;`
- Frontend state: `event.eventID`, `user.userID`

**Why:** Consistency across backend entities, DTOs, and frontend state management. The frontend expects camelCase IDs from API responses.

**Violation detection:** Search for `*_id` or `*Id` patterns in new code (both are wrong).

### 2. Wrapper Rule
**ALL controller responses MUST return `ResponseEntity<Response<T>>`**

Structure:
```java
Response<T> {
    int statusCode;
    String message;
    T data;
    LocalDateTime timestamp;
    List<String> errors; // optional
}
```

**Example:**
```java
return ResponseEntity.ok(Response.<EventDTO>builder()
    .statusCode(200)
    .message("Event retrieved successfully")
    .data(eventDTO)
    .build());
```

**Legacy constructor:** `Response(status, msg, data)` exists for backward compatibility (18 call sites). Prefer the builder pattern for new code.

**Why:** Consistent error handling, predictable frontend parsing with TanStack Query.

### 3. Concurrency Law
**ALL concurrent operations MUST use `@Version` optimistic locking with retry logic.**

Pattern:
```java
@Entity
public class Event {
    @Version
    private Long version;  // JPA automatically manages this
}
```

Retry pattern for high-contention operations:
```java
int maxAttempts = 3;
int attempt = 0;
while (attempt < maxAttempts) {
    try {
        // Modify entity
        eventRepository.saveAndFlush(event); // Forces immediate version check
        return;
    } catch (ObjectOptimisticLockingFailureException e) {
        attempt++;
        if (attempt >= maxAttempts) throw new IllegalStateException("High traffic detected. Please try again.");
        Thread.sleep(50); // 50ms backoff
    }
}
```

**Where applied:** Event entity (registration capacity), EventUpdateRequest entity.

**Why:** Prevents race conditions during concurrent registrations, ensures capacity is never exceeded.

### 4. Temporal Data Principle
**Events use SEPARATE `LocalDate` + `LocalTime` fields (NOT DateTime/Timestamp).**

Fields:
- `eventDate` (LocalDate) - What day
- `startTime` (LocalTime) - What time (local interpretation)
- `endTime` (LocalTime)

**Why:** Flexibility for same-date/different-time events, avoids timezone complications during schedule conflict detection.

---

### Email Adapter Pattern (Incomplete Implementation)

The email system is designed to be pluggable but is not fully wired.

**Current state:**
- Interface: `EmailService` (1 method: `sendNotification`)
- Adapter: `OutlookEmailAdapter` exists but is empty (TODO)
- Actual implementation: Likely Spring Boot Mail auto-config

**Why pattern exists:** Allows swapping email providers (Gmail ↔ Outlook) without changing service layer.

**Files:** [EmailService.java](backend/src/main/java/com/ems/backend/service/email/EmailService.java), [OutlookEmailAdapter.java](backend/src/main/java/com/ems/backend/service/impl/email/OutlookEmailAdapter.java)

---

## Security Architecture

### JWT Authentication Flow

1. User logs in with email/password
2. Backend validates credentials, generates JWT
3. JWT stored in localStorage (frontend)
4. Axios interceptor adds `Authorization: Bearer <token>` to all requests
5. Backend `JwtAuthenticationFilter` validates token on each request
6. `CustomUserDetails` loads user from database based on JWT claim

**Configuration:**
- Secret key: `secreteJwtString` in [application.properties](backend/src/main/resources/application.properties) (MUST be hex, rotatable)
- Expiration: 24 hours (`expirationInt=86400000`)
- Filter chain: `JwtAuthenticationFilter` runs before `UsernamePasswordAuthenticationFilter`

**Files:** [JwtUtils.java](backend/src/main/java/com/ems/backend/security/JwtUtils.java), [JwtAuthenticationFilter.java](backend/src/main/java/com/ems/backend/security/JwtAuthenticationFilter.java)

### Two-Level Authorization

**Level 1: SecurityFilterChain (path-based)**

Configured in `SecurityConfig.java`:
- **Public:** `/api/auth/**`, `GET /api/events/**`, `/api/uploads/**`
- **Protected:** Everything else requires authentication

**Level 2: Method-level (`@PreAuthorize`)**

For role differentiation:
```java
@PreAuthorize("hasRole('ORGANIZER')")
public ResponseEntity<?> createProposal(...) { ... }

@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<?> reviewProposal(...) { ... }
```

**Critical:** Spring Security adds `ROLE_` prefix internally. Use enum names WITHOUT prefix:
- ✅ Correct: `@PreAuthorize("hasRole('ORGANIZER')")`
- ❌ Wrong: `@PreAuthorize("hasRole('ROLE_ORGANIZER')")`

The `CustomUserDetailsService` adds the `ROLE_` prefix automatically.

**Files:** [SecurityConfig.java](backend/src/main/java/com/ems/backend/config/SecurityConfig.java), [CustomUserDetailsService.java](backend/src/main/java/com/ems/backend/security/CustomUserDetailsService.java)

### Custom Exception Handling

Both return structured `Response<T>` format:
- **401 Unauthorized:** `CustomAuthenticationEntryPoint` (unauthenticated)
- **403 Forbidden:** `CustomAccessDenialHandler` (authenticated but insufficient permissions)

**Files:** [CustomAuthenticationEntryPoint.java](backend/src/main/java/com/ems/backend/exception/CustomAuthenticationEntryPoint.java), [CustomAccessDenialHandler.java](backend/src/main/java/com/ems/backend/exception/CustomAccessDenialHandler.java)

---

## Frontend Patterns

### Safe Session Hydration

**Problem solved:** Malformed localStorage data crashes app on refresh.

**File:** [safeParse.js](frontend/ems-frontend/src/lib/safeParse.js)

**Implementation:**
- `safeGetItem(key)`: Defensive localStorage access (null-safe, undefined-safe)
- `safeParseUser()`: Parses user object with fallbacks
  - Handles legacy `id` → `userID` mapping (line 17-19)
  - Provides defaults: `firstName: 'User'`, `role: 'GUEST'`
- `clearAuthData()`: Removes token + userRole + user

**Usage in components:**
```javascript
import { safeParseUser, clearAuthData } from '@/lib/safeParse';

const user = safeParseUser(); // null if missing/corrupted
if (!user) {
    clearAuthData();
    navigate('/login');
}
```

### TanStack Query Patterns

**Usage:**
- Server state ONLY (not UI state)
- Query keys: `['events']`, `['proposals', organizerID]`, `['registrations', studentID]`
- **No optimistic updates** - backend optimistic locking handles concurrency
- Stale time: Default (queries refetch on window focus)

**Example:**
```javascript
const { data: events, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => axios.get('/api/events').then(res => res.data.data)
});
```

**Files:** Frontend uses TanStack Query v5.90.12 throughout `src/features/*` directories.

---

## File Upload Pattern

### Proposal Document Uploads

**Endpoint:** `POST /api/proposals`

**Critical detail:** JSON is sent as STRING in `@RequestPart`, not as `@RequestBody`.

**Backend handling:**
```java
@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public ResponseEntity<?> createProposal(
    @RequestPart("proposal") String proposalJson,  // JSON as STRING
    @RequestPart(value = "files", required = false) MultipartFile[] files
) {
    ProposalDTO proposalDTO = objectMapper.readValue(proposalJson, ProposalDTO.class);
    // ...
}
```

**Why:** Spring cannot mix `@RequestBody` with multipart parts.

**File storage:**
- Path: `backend/uploads/proposals/{uuid}_{filename}`
- Access: Public via `/api/uploads/**` (see SecurityConfig)
- Limits: 10MB per file, 50MB per request

**Frontend example:**
```javascript
const formData = new FormData();
formData.append('proposal', JSON.stringify(proposalData));
files.forEach(file => formData.append('files', file));

await axios.post('/api/proposals', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
```

**Files:** [ProposalController.java:57](backend/src/main/java/com/ems/backend/controller/ProposalController.java)

---

## Development Commands

### Backend (Spring Boot 3.3.5 + Java 21)

```bash
# Start API server (port 8080)
cd backend
mvn spring-boot:run

# Full rebuild
mvn clean install

# Build without tests (faster)
mvn clean install -DskipTests

# Run tests (currently 0% coverage)
mvn test

# Package as JAR
mvn package
```

### Frontend (React 19 + Vite)

```bash
# Start dev server (port 5173)
cd frontend/ems-frontend
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint (ESLint 9)
npm run lint
```

### Database Setup

**Requirements:** MySQL 8.0

**Connection string in [application.properties](backend/src/main/resources/application.properties):**
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/ems_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true
```

**Schema management:** `spring.jpa.hibernate.ddl-auto=update` (auto-creates/updates schema)

**Note:** No Flyway/Liquibase migrations yet - schema management is automatic but not production-ready.

### Environment Configuration

**Frontend (`.env`):**
```
VITE_API_BASE_URL=http://localhost:8080/api
```

**Backend ([application.properties](backend/src/main/resources/application.properties)):**
- Database credentials
- JWT secret key (`secreteJwtString`)
- JWT expiration (`expirationInt`)
- SMTP mail configuration

## Common Pitfalls & Solutions

## mvn package not found when running Backend
**Solution:** Use `./mvnw clean install -DskipTests` instead of `mvn package`.

### Raw Axios Instead of Centralized Instance

**Problem:** API calls return 401 Unauthorized despite valid JWT token in localStorage

**Cause:** Using raw `axios` import instead of the centralized `api` instance bypasses the request interceptor that attaches the JWT token

**Wrong approach:**
```javascript
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export const myApi = {
  getData: async () => {
    const response = await axios.get(`${BASE_URL}/some-endpoint`); // ❌ No JWT attached!
    return response.data;
  }
};
```

**Correct approach:**
```javascript
import api from '../../lib/axios'; // Centralized instance with interceptors

export const myApi = {
  getData: async () => {
    const response = await api.get('/some-endpoint'); // JWT automatically attached
    return response.data.data;
  }
};
```

**Why:** The centralized `api` instance ([axios.js](frontend/ems-frontend/src/lib/axios.js)) includes:
- Request interceptor that adds `Authorization: Bearer <token>` header (line 8-19)
- Pre-configured `baseURL` from environment variables (line 3-6)
- Response interceptor for consistent error handling (line 21-38)

**Rule:** NEVER import `axios` directly in API service files. ALWAYS use the centralized `api` instance.

**Files to reference:**
- ✅ Correct: [dashboardApi.js](frontend/ems-frontend/src/features/dashboard/dashboardApi.js)
- ✅ Correct: [updateApi.js](frontend/ems-frontend/src/features/events/updateApi.js)
- ✅ Correct: [adminApi.js](frontend/ems-frontend/src/features/admin/adminApi.js)

### Optimistic Locking Errors

**Problem:** `OptimisticLockException` thrown unexpectedly

**Cause:** Editing entity without re-fetching latest version

**Solution:** Always fetch entity inside transaction before mutations:
```java
@Transactional
public void updateEvent(Long eventID, EventDTO dto) {
    Event event = eventRepository.findById(eventID).orElseThrow(); // Fetch latest version
    event.setCapacity(dto.getCapacity()); // Uses latest version from line above
    eventRepository.save(event); // Version check happens here
}
```

**Wrong approach:**
```java
Event event = getEventFromCache(); // Stale version
event.setCapacity(100);
eventRepository.save(event); // Throws OptimisticLockException
```

### Role Check Inconsistencies

**Problem:** `User.getRole()` returns `UserRole.ORGANIZER` but `@PreAuthorize("hasRole('ORGANIZER')")` fails

**Cause:** Spring Security prefixes roles with `ROLE_` internally

**Solution:** `CustomUserDetailsService` adds `ROLE_` prefix automatically. Use enum names without prefix:
```java
// Entity
user.getRole() // Returns UserRole.ORGANIZER

// Spring Security
@PreAuthorize("hasRole('ORGANIZER')") // Correct (no ROLE_ prefix)
```

**Files:** [CustomUserDetailsService.java:31](backend/src/main/java/com/ems/backend/security/CustomUserDetailsService.java)

### LocalDate/LocalTime Serialization

**Problem:** Frontend needs DateTime for display but receives separate fields

**Backend response:**
```json
{
    "eventDate": "2024-03-15",
    "startTime": "14:00",
    "endTime": "16:00"
}
```

**Solution:** Reconstruct in frontend:
```javascript
import { format } from 'date-fns';

const eventDateTime = new Date(`${event.eventDate}T${event.startTime}`);
const formatted = format(eventDateTime, 'PPP p'); // "March 15, 2024 at 2:00 PM"
```

### Jackson ObjectMapper Configuration

**Problem:** Creating ObjectMapper instances directly bypasses Spring's JacksonConfig

**Wrong approach:**
```java
private final ObjectMapper mapper = new ObjectMapper(); // Missing JSR-310 module!
```

**Correct approach:**
```java
@RequiredArgsConstructor
public class MyController {
    private final ObjectMapper objectMapper; // Injected from JacksonConfig bean
}
```

**Why:** The centralized `JacksonConfig` registers `JavaTimeModule` for `LocalDate`/`LocalTime`/`LocalDateTime` serialization. Direct instantiation bypasses this configuration, causing `InvalidDefinitionException` errors.

**Serialization format (ISO-8601):**
- `LocalDateTime` → `"2024-03-15T14:30:00"`
- `LocalDate` → `"2024-03-15"`
- `LocalTime` → `"14:30:00"`

**Configuration:**
- Backend: `JacksonConfig.java` registers JavaTimeModule
- Dependency: `jackson-datatype-jsr310` in pom.xml
- Settings: `application.properties` lines 16-18 (write-dates-as-timestamps=false)

**Files:**
- [JacksonConfig.java](backend/src/main/java/com/ems/backend/config/JacksonConfig.java)
- [application.properties](backend/src/main/resources/application.properties)

### Schedule Conflict Detection

**How it works:** [RegistrationServiceImpl.java:63-67](backend/src/main/java/com/ems/backend/service/impl/RegistrationServiceImpl.java)

```java
boolean hasOverlap = registrationRepository.existsByStudentAndDateOverlap(
    studentID, event.getEventDate(), event.getStartTime(), event.getEndTime()
);
if (hasOverlap) {
    throw new IllegalStateException("Schedule conflict: You have another event registered during this time slot.");
}
```

**Why separate date/time fields matter:** Enables efficient range queries without timezone conversion.

---

## Extension Points

### Adding New User Roles

1. Add enum value to `UserRole` enum
2. Create new `@Entity` subclass extending `User`:
   ```java
   @Entity
   @DiscriminatorValue("MODERATOR")
   public class Moderator extends User { ... }
   ```
3. Add role prefix in `CustomUserDetailsService` (line 31)
4. Use `@PreAuthorize("hasRole('MODERATOR')")` on endpoints

### Adding New Entities with Optimistic Locking

When adding entities that require concurrency control:

1. Add `@Version` field:
   ```java
   @Version
   private Long version;
   ```
2. Use `saveAndFlush()` where version check is critical
3. Wrap in try-catch for `ObjectOptimisticLockingFailureException`
4. Implement retry logic if operation is idempotent (see Registration Gatekeeper pattern)

### Adding New Notification Channels

1. Implement `EmailService` interface (e.g., `SMSAdapter`, `PushNotificationAdapter`)
2. Inject into services that trigger notifications
3. Call `sendNotification()` alongside existing email calls

**Files:** [EmailService.java](backend/src/main/java/com/ems/backend/service/email/EmailService.java)

---

## Testing Strategy (When Implemented)

### High Priority (Protect Core Workflows)

1. **RegistrationServiceImpl.registerStudentForEvent()**
   - Simulate concurrent registrations (10+ threads)
   - Verify capacity never exceeded
   - Test retry logic on version conflicts

2. **Proposal approval workflow**
   - Verify state transitions (PENDING → APPROVED/REJECTED)
   - Test rejection feedback loop
   - Ensure organizers can resubmit

3. **JWT validation**
   - Test expired tokens (401)
   - Test malformed tokens (401)
   - Test role-based access (403)

### Medium Priority

4. Event update approval workflow
5. Schedule conflict detection accuracy
6. File upload validation (size limits, file types)

### Integration Tests

- Use `@SpringBootTest` with test containers (MySQL 8.0)
- Test optimistic locking with actual database version checks
- Mock SMTP in CI (use TestContainers MailHog or Greenmail)

**Example:**
```java
@SpringBootTest
@Testcontainers
class RegistrationConcurrencyTest {
    @Container
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0");

    @Test
    void whenConcurrentRegistrations_thenCapacityNeverExceeded() {
        // Create event with capacity = 1
        // Spawn 10 threads attempting registration
        // Assert only 1 registration succeeds
    }
}
```

## Environment Setup
Before starting any local testing or debugging, always check for .env files, required dependencies, and active virtual environments. Ask upfront about environment variables if the project has API keys or database connections.

## Code Changes
After making changes, immediately test or verify the result before moving on. Don't batch multiple unverified changes.
