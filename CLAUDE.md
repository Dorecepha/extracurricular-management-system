# CLAUDE.md - Event Management System (EMS)

## Project Overview
A full-stack Event Management System for universities. 
- **Architectural Style:** Layered Architecture (Controller -> Service -> Repository).
- **Development Strategy:** Vertical Slice (Feature by feature).
- **Current Goal:** Completing the Auth Slice and moving to Events/Proposals.

## Tech Stack
- **Backend:** Java 21, Spring Boot 3.3.x, Spring Security (JWT), Hibernate/JPA, MySQL.
- **Frontend:** React 19, Vite, Tailwind CSS v4, React Query, React Hook Form, Zod.

## Build & Run Commands
### Backend (ems-backend)
- **Build:** `./mvnw clean compile`
- **Run:** `./mvnw spring-boot:run`
- **Test:** `./mvnw test`
- **Key Config:** `src/main/resources/application.properties`

### Frontend (ems-frontend)
- **Install:** `npm install`
- **Run:** `npm run dev`
- **Build:** `npm run build`
- **Lint:** `npm run lint`

## Coding Standards & Patterns
### Java / Spring Boot
- **Naming:** CamelCase for classes/methods. `userID`, `eventID` naming convention for primary keys.
- **Lombok:** Use `@Data`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor` for Entities/DTOs.
- **Responses:** ALWAYS wrap controller returns in `com.ems.backend.wrappers.Response<T>`.
- **Inheritance:** User entity uses `SINGLE_TABLE` inheritance strategy.
- **Persistence:** Use `@Version` on the `Event` entity for Optimistic Locking.
- **Packages:** Strict separation: `.entity`, `.repository`, `.service`, `.service.impl`, `.controller`, `.dto`.

### React / Frontend
- **Structure:** Feature-based folders in `src/features/[feature-name]`.
- **API:** Use the central `src/lib/axios.js` instance.
- **Styles:** Tailwind v4 (use abstract naming: `primary`, `secondary`, `success`, `danger`).
- **State:** Use `@tanstack/react-query` for server state; `useState/useContext` for UI state.
- **Routing:** Use `react-router-dom` with the `ProtectedRoute` wrapper.

## Key Files for Context
- `backend/src/main/java/com/ems/backend/wrappers/Response.java` (Standard API Wrapper)
- `frontend/src/lib/axios.js` (API Client with JWT Interceptor)
- `frontend/tailwind.config.js` (Semantic color definitions)

## Operational Protocol
1. **Always** run `./mvnw clean compile` after modifying Backend entities or DTOs.
2. **Always** check for Byte Order Mark (BOM) errors (`\ufeff`) if compilation fails on new files.
3. **Vertical Slice Order:** Database -> Repository -> Service -> Controller -> Frontend Feature.