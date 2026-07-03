# EMS Feature Proposal: Communication Portal

**Project:** Extracurricular Management System (EMS)
**Version:** 1.0 — Pre-Meeting Draft
**Status:** Pending stakeholder discussion; not yet approved for implementation
**Scope owner:** Computer Science & Engineering School — students and staff

---

## 1. Executive Summary

EMS currently supports the full event lifecycle — proposal, three-tier approval, registration,
post-event reporting, and certificate export — but has **no in-system communication channel**.
All communication between organizers, offices, and students happens over email, social media,
or informal messaging apps. Event changes (venue, time, requirements) reach students unevenly,
questions about events are answered privately and repeatedly, and offices have no structured
way to broadcast announcements to their constituencies.

This proposal defines a **Communication Portal** delivered in three tiers of increasing
complexity, allowing stakeholders to draw the scope line at the tier that matches actual demand:

1. **Tier 1 — Announcements** (broadcast, one-to-many) + an in-app Notification system
2. **Tier 2 — Event Discussion Threads** (scoped Q&A per event)
3. **Tier 3 — Direct Messaging** (real-time student ↔ staff chat) — *recommended to defer*

Tiers 1 and 2 require no new infrastructure and reuse existing EMS patterns (JWT roles,
`Response<T>` wrapper, TanStack Query, email service). Tier 3 introduces WebSockets and a
moderation burden, and should only be approved if the meeting confirms concrete demand.

---

## 2. Feature Overview & Scope

### 2.1 In Scope

**In-App Notification System (foundation, all tiers)**

A persistent per-user notification feed backing a bell icon in the app header. All existing
email triggers (proposal decisions, report deadlines, event updates) additionally create
in-app notifications, and all Communication Portal activity flows through it.

**Tier 1 — Announcements**

Staff and organizers publish announcements to a declared audience:

- **School-wide** — visible to all users (admin/office staff only)
- **Organization-scoped** — all students affiliated with Youth Union or Student Association
- **Event-scoped** — automatically targeted to the event's registered students (organizer)

Announcements support a title, rich-text body, optional file attachments, and an optional
expiry date after which they disappear from the feed. Recipients receive an in-app
notification and (configurable) an email.

**Tier 2 — Event Discussion Threads**

Every published event automatically gets one discussion thread:

- Visible to the event's registered students, the organizer, and admins
- Students post questions/comments; one level of threaded replies
- Organizer and admins can **pin** posts and **soft-delete** (moderate) posts with audit trail
- Thread locks read-only when the event status becomes COMPLETED
- New activity notifies the organizer (always) and participating students (on replies to them)

**Tier 3 — Direct Messaging (deferred candidate)**

One-to-one conversations between students and staff (organizer/office): conversation list,
unread counts, real-time delivery via WebSocket/STOMP. Included here for discussion; the
recommendation is to defer to a separate proposal if approved in principle.

### 2.2 Out of Scope

- Student-to-student direct messaging (privacy/moderation burden; no identified need)
- Group chats / channels beyond event threads
- Push notifications (mobile) — no mobile client exists
- Rich moderation tooling (word filters, automated flagging) — manual moderation only in v1
- Editing published announcements' audience after publication (delete and repost instead)
- Migration of historical communication from email/Google Forms

---

## 3. Problem Analysis

- **No reliable broadcast path.** Venue/time changes approved through the update pipeline are
  emailed, but there is no persistent in-app record; students who miss the email miss the change.
- **Repeated private Q&A.** Organizers answer the same questions individually with no shared,
  searchable record scoped to the event.
- **No notification center.** EMS already generates many user-relevant events (approvals,
  rejections, deadlines) but surfaces them only via email, which students report ignoring.
- **Offices lack a constituency channel.** Youth Union and Student Association offices cannot
  address their affiliated students as a group inside the system that manages their events.

---

## 4. Proposed Design

### 4.1 Domain Model (follows EMS DNA)

All primary keys use the `camelCaseID` convention; all endpoints return
`ResponseEntity<Response<T>>`.

**Notification**
`notificationID · userID (recipient) · type (enum NotificationType) · title · body ·
linkPath (frontend route) · isRead · createdAt (LocalDateTime)`

**Announcement**
`announcementID · authorID · title · body · audienceType (enum: SCHOOL_WIDE,
ORGANIZATION, EVENT) · organizationType (nullable) · eventID (nullable) · attachments ·
expiresAt (nullable) · createdAt · status (enum: PUBLISHED, RETRACTED)`

**EventThread / ThreadPost**
`threadID · eventID · isLocked` /
`postID · threadID · authorID · parentPostID (nullable, one level) · body · isPinned ·
isDeleted (soft) · deletedByID (nullable) · createdAt`

> **Deliberate exception to the Temporal Data Principle:** messages and notifications are
> instantaneous records, not scheduled events, so they use `LocalDateTime` timestamps rather
> than separate `LocalDate` + `LocalTime` fields. The separate-fields rule remains in force
> for Event scheduling.

> **Concurrency note:** posts and notifications are append-only, so `@Version` optimistic
> locking is not required on them. `Announcement` gets `@Version` because staff may edit it.

### 4.2 Authorization Matrix (Tier 1 + 2)

| Action | Student | Organizer | Admin (office) | Super Admin |
|---|---|---|---|---|
| View announcements in own audience | ✅ | ✅ | ✅ | ✅ |
| Create school-wide announcement | ❌ | ❌ | ✅ | ❌ |
| Create org-scoped announcement | ❌ | ❌ | ✅ (own org type) | ❌ |
| Create event-scoped announcement | ❌ | ✅ (own events) | ✅ | ❌ |
| Post/reply in event thread | ✅ (if registered) | ✅ (own events) | ✅ | ❌ |
| Pin / moderate thread posts | ❌ | ✅ (own events) | ✅ | ❌ |
| Retract announcements | ❌ | ✅ (own) | ✅ | ❌ |
| View moderation audit log | ❌ | ❌ | ❌ | ✅ |

Super Admin remains account-management/audit-only, consistent with the Phase 3 design.

### 4.3 End-to-End Working Flow (Tier 1 + 2)

1. Proposal passes Stage 3 → event published → **system auto-creates the event thread**.
2. Organizer posts an event-scoped announcement ("venue changed to Room A2.512").
3. EMS resolves the audience (registered students), creates one `Notification` per recipient,
   and sends email per the user's notification preference.
4. Students open the thread, ask questions; the organizer replies and pins the key answer.
5. A student posts inappropriate content → organizer soft-deletes it; the action is recorded
   in the audit trail visible to Super Admin.
6. Event update request approved through the 3-tier pipeline → **system auto-posts an
   announcement** to the event audience (integration with the existing update workflow).
7. Event reaches COMPLETED → thread locks read-only; announcements past `expiresAt` drop
   out of feeds automatically.

### 4.4 Delivery Mechanics

- **Tier 1/2:** no WebSockets. TanStack Query polling (30–60 s stale time) for the
  notification badge and thread views; refetch-on-focus covers most freshness needs.
- **Tier 3 (if approved):** Spring WebSocket + STOMP over SockJS, JWT handshake
  authentication, Redis pub/sub only if horizontal scaling is ever needed (not now).
- **Email:** reuse `EmailService`; add a per-user preference (immediate / daily digest / none)
  to prevent notification fatigue. Daily digest via the existing `@EnableScheduling` setup.

---

## 5. Implementation Plan

### Phase A — Notification Foundation
- `Notification` entity, repository, service, controller (`GET /api/notifications`,
  `PATCH /api/notifications/{notificationID}/read`, mark-all-read)
- Bell icon + dropdown feed in `AppLayout`, unread badge, TanStack Query polling
- Wire existing triggers (proposal decision, update decision, report deadline) into it

**Completion check:** existing workflows produce in-app notifications; badge updates; mark-read works.

### Phase B — Announcements (Tier 1)
- `Announcement` entity + audience resolution service; creation UI for admin and organizer
- Announcement feed page + per-event announcement section
- Email fan-out with user preference (immediate / digest / none)
- Auto-announcement on approved event updates

**Completion check:** each audience type reaches exactly the right users; retraction and expiry work.

### Phase C — Event Threads (Tier 2)
- `EventThread`/`ThreadPost` entities; auto-create on publish, auto-lock on completion
- Thread UI on the event detail page (registered students only); reply, pin, soft-delete
- Moderation audit records; Super Admin audit view
- Notifications on organizer mentions/replies

**Completion check:** access control verified for non-registered students; moderation leaves audit trail; locked threads reject posts.

### Phase D — Direct Messaging (Tier 3, only if approved)
- Separate detailed design required (WebSocket infra, presence, abuse reporting, retention)

### SQL Migration
Each phase ships a manual `sql/Vn__*.sql` script (MySQL 8.0 rules: no `IF NOT EXISTS`
on columns, VARCHAR sized to enum values), consistent with V1/V2 practice.

### Testing (required, not optional)
- Authorization tests: non-registered student cannot read/post an event thread (403)
- Audience-resolution tests: org-scoped announcement never leaks across organization types
- Notification fan-out test for a large audience (batching, async via existing `AsyncConfig`)

---

## 6. Assumptions

| ID | Assumption | Basis |
|---|---|---|
| A1 | Students affiliate with exactly one organization type for org-scoped announcements | Mirrors event `organizationType`; needs confirmation — students may belong to both |
| A2 | Event threads should be restricted to registered students, not public | Keeps Q&A relevant; public events pages stay read-only |
| A3 | Organizers may publish event-scoped announcements without office approval | Moderation is after-the-fact; approval gate would bottleneck urgent changes |
| A4 | Soft-delete (hidden, audit-retained) is sufficient moderation for v1 | University context; no anonymous posting |
| A5 | Polling is acceptable UX for Tiers 1–2; real-time is only needed for DM | Announcement/Q&A latency tolerance is minutes, not seconds |
| A6 | Vietnamese content only, no bilingual requirement | Consistent with existing report templates; confirm in meeting |

---

## 7. Open Questions (for the meeting)

| ID | Question | Impact |
|---|---|---|
| Q1 | Can students post freely in event threads, or reply-only to organizer prompts? | Thread UX and moderation load |
| Q2 | Do organizer announcements need office pre-approval? | Adds an approval sub-workflow (contradicts A3) |
| Q3 | Is Tier 3 (direct messaging) actually demanded, and by whom? | Determines whether WebSocket infrastructure enters the stack |
| Q4 | How are students affiliated to Youth Union vs. Student Association in data? | Audience resolution for org-scoped announcements (A1) |
| Q5 | Email policy: immediate per announcement, daily digest default, or in-app only? | Notification fatigue vs. reach |
| Q6 | Content retention: are thread posts kept indefinitely after event completion? | Storage and any privacy policy obligations |
| Q7 | Who moderates school-wide content — each office, or a designated staff member? | Role/permission additions |

---

*Prepared 2026-07-03 as a pre-meeting draft. Tiers 1–2 are recommended for the first
implementation cycle; Tier 3 pending demand confirmation.*
