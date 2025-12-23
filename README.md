# Extracurricular Management System (EMS)

## Table of Contents
- [Overview](#overview)
- [EMS DNA (Technical Constraints)](#ems-dna-technical-constraints)
- [Tech Stack](#tech-stack)
- [Core Features](#core-features)
- [Architecture Highlights](#architecture-highlights)
- [API & Data Conventions](#api--data-conventions)
- [Local Setup](#local-setup)
  - [Backend](#backend)
  - [Frontend](#frontend)
- [Developer Notes](#developer-notes)
- [Evaluation Pointers](#evaluation-pointers)

## Overview
Extracurricular Management System (EMS) is a robust university platform for event proposals, approval workflows, and student registration management. It emphasizes data integrity, predictable APIs, and high performance under registration surges.

## EMS DNA (Technical Constraints)
- **Identity Naming:** Unified `camelCaseID` naming for identifiers (e.g., `userID`, `eventID`).
- **The Wrapper Rule:** All controllers return `ResponseEntity<Response<T>>` to standardize status, message, and payload.
- **Concurrency Law:** Optimistic Locking via `@Version` on event records to guard high-traffic registration races.
- **Temporal Data:** Event scheduling strictly uses `LocalDate` and `LocalTime` (no time zones in payloads).

## Tech Stack
- **Backend:** Spring Boot 3.3.5, Java 21, Spring Security (JWT), Spring Data JPA, MySQL 8.0.
- **Frontend:** React 19, Tailwind CSS v4, TanStack Query v5, Axios, Lucide Icons, Vite.

## Core Features
- **Role-Based Access Control (STI):** Single Table Inheritance differentiates Students, Event Organizers, and Administrators with distinct authorization flows.
- **Proposal Pipeline:** Multi-part uploads for paperwork, rejection-aware resubmission, and reviewer feedback loops.
- **Registration Engine:** Capacity enforcement plus schedule-conflict detection to protect student calendars.
- **Management Hub:** Live event modification requests and participant rosters for organizers.
- **Governance:** Admin review inbox, account lifecycle management (Suspend/Disable), and an immutable audit trail.

## Architecture Highlights
- **Layered Architecture:** Controllers → Services → Repositories with DTO boundaries for transport safety.
- **Adapter Pattern:** Pluggable Email Notification Engine (e.g., Outlook SMTP via `OutlookEmailAdapter`) to swap mail providers without touching services.
- **Safe Hydration:** `frontend/ems-frontend/src/lib/safeParse.js` hardens session parsing to avoid runtime crashes from malformed persisted state.
- **Optimistic Locking:** `@Version` on event entities prevents lost updates during concurrent registrations and change requests.

## API & Data Conventions
- **Response Shape:** Controllers wrap payloads in `ResponseEntity<Response<T>>`:
  ```json
  {
    "statusCode": 200,
    "message": "success",
    "data": { /* resource payload */ }
  }
  ```
- **Identifiers:** Always `camelCaseID` (e.g., `proposalID`, `registrationID`) for consistency across layers.
- **Temporal Fields:** Dates and times are separate (`LocalDate` + `LocalTime`) to avoid implicit time zone shifts.
- **Pagination & Filtering:** Exposed via query params on list endpoints; keep filters narrow to preserve index efficiency (MySQL 8).

## Local Setup

### Backend
Prereqs: Java 21, Maven, MySQL 8.0 (running), and an SMTP account (Mailtrap/Outlook).

1) Copy `backend/src/main/resources/application.properties` and set environment-specific values:
   ```properties
   # Database
   spring.datasource.url=jdbc:mysql://localhost:3306/ems_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true
   spring.datasource.username=app_user
   spring.datasource.password=YOUR_PASSWORD
   spring.jpa.hibernate.ddl-auto=update

   # JWT (matches JwtUtils.java)
   secreteJwtString=REPLACE_WITH_SECURE_HEX
   expirationInt=86400000

   # Email (SMTP)
   spring.mail.host=smtp.office365.com
   spring.mail.port=587
   spring.mail.username=YOUR_SMTP_USER
   spring.mail.password=YOUR_SMTP_PASSWORD
   spring.mail.properties.mail.smtp.auth=true
   spring.mail.properties.mail.smtp.starttls.enable=true
   ```
2) Start the API:
   ```bash
   cd backend
   mvn spring-boot:run
   ```

### Frontend
Prereqs: Node.js 20+ and npm.

1) Create `frontend/ems-frontend/.env`:
   ```bash
   VITE_API_BASE_URL=http://localhost:8080/api
   ```
2) Install and run:
   ```bash
   cd frontend/ems-frontend
   npm install
   npm run dev
   ```

## Developer Notes
- **Security:** JWT-based auth; keep `secreteJwtString` secret and rotate if leaked.
- **Uploads:** Proposal documents use multipart form-data; verify backend max file size before production deployment.
- **Data Integrity:** `@Version` is enforced on events; always fetch the latest entity before applying mutations to avoid `OptimisticLockException`.
- **Testing:** Prefer integration tests against a disposable MySQL schema to mirror production constraints; mock SMTP in CI.

## Evaluation Pointers
- Highlight the Adapter Pattern (email), Optimistic Locking, and Single Table Inheritance to demonstrate architectural intent.
- Show the standardized `ResponseEntity<Response<T>>` envelope when presenting API examples.
- Emphasize temporal handling (`LocalDate`/`LocalTime`) and registration race protection when discussing reliability.
