# EMS Feature Proposal: Multi-Tier Approval Pipeline & Post-Event Processing

**Project:** Extracurricular Management System (EMS)  
**Version:** 3.0 — Final Pre-Implementation Draft  
**Status:** Pre-implementation, pending approval

---

## 1. Executive Summary

The Extracurricular Management System currently handles event proposals through a simplified
single-administrator approval model. While investigating how certificates are issued, a more
complex internal workflow was identified — one that involves three institutional departments in
strict hierarchical order, and a mandatory post-event recognition process that differs depending
on the organizing body.

Beyond approval, the system currently has no post-event processing capability. Organizers are
required to submit an activity recognition package to either the Youth Union Office or the
Student Association Office within a regulated deadline after each event. These packages include
written reports, attendee lists, feedback surveys, and photographs. For events issuing digital
certificates, EMS prepares and exports the required data to the existing iuyouth certificate
infrastructure, which handles PDF generation and public issuance.

This proposal defines two features to address these gaps:

1. **Multi-Tier Approval Pipeline** — replacing the single-admin approval gate with a
   three-stage sequential workflow tied to real institutional department roles.
2. **Post-Event Processing Pipeline** — replacing the Google Form submission process with
   a structured in-system workflow that branches by event affiliation type, enforces
   submission deadlines, and prepares certificate data for handoff to iuyouth.

All design decisions are grounded in official policy documents, real attendee list templates
(Mẫu CNHD01, CNHD02), the official brief report template (Báo cáo nhanh), and a real issued
certificate. All remaining uncertainties are explicitly identified in Section 7.

---

## 2. Feature Overview & Scope

### 2.1 In Scope

**Multi-Tier Approval Pipeline**

A new three-stage sequential pipeline replaces the existing single-administrator approval. A
proposal must pass through the Youth Union or Student Association Office, then the Faculty
Office, then the University Board Office in strict order before it can be published. Each stage
is handled by an administrator assigned to the corresponding department. Rejection at any stage
returns the proposal to the organizer for revision and full resubmission from the beginning.

At proposal creation, the organizer declares the event's affiliation type — Youth Union or
Student Association — which determines which post-event workflow applies after the event ends.

**Post-Event Processing Pipeline**

When an event ends, the system opens a post-event reporting window automatically. The organizer
submits a structured activity recognition package through EMS within a regulated deadline. The
system tracks the deadline, sends reminders, and flags late submissions without blocking them.

**Certificate Data Export**

EMS does not generate certificate PDFs. The existing iuyouth infrastructure already handles
PDF generation and public certificate issuance. EMS's role is to collect, validate, and package
the required inputs — the organizer's pre-signed certificate template and the cert-eligible
participant list — into an export that the organizer submits to iuyouth. This avoids duplicating
existing institutional infrastructure and eliminates the technical risk of PDF rendering and
font compliance.

### 2.2 Out of Scope

- Certificate PDF generation — handled by iuyouth infrastructure
- Integration with the external ĐRL system (IUOSS) — attendance stored structurally for future use
- Physical certificate fulfillment — EMS flags requests; process remains offline
- Automatic digital signing by EMS — signatures are pre-baked into the template before upload
- Automatic escalation of overdue approvals
- Validation of iuyouth.edu.vn URLs submitted by organizers
- Award and competition certificates (Giấy khen A4) — subject to different policies

---

## 3. Problem Analysis

### 3.1 Current Gaps in Approval

The existing system models proposal approval as a binary decision by a single undifferentiated
administrator. This creates two problems. First, it does not reflect institutional reality —
the real process involves three distinct offices with different levels of authority, and approval
at a lower level does not imply approval at a higher level. Second, it provides no audit trail
of which department made which decision and when, making accountability difficult to establish.
The current model also has no department-based access control — any administrator can approve
any proposal regardless of their institutional role.

### 3.2 Current Gaps in Post-Event Processing

After an event concludes, there is no system support for the organizer. The activity recognition
process is handled entirely through Google Forms, email attachments, and manual follow-up. This
creates concrete problems:

- Organizers have no single place to track what they have submitted and what is outstanding.
- Offices have no centralized view of pending recognitions or overdue submissions.
- Deadline enforcement is entirely manual and inconsistent.
- There is no structured digital record of which students attended which events.
- Certificate data preparation is error-prone with no validation layer.

---

## 4. Proposed Approval Pipeline

### 4.1 Three-Stage Sequential Approval

A submitted proposal moves through three stages in strict order:

**Stage 1 — Youth Union or Student Association Office**
First review at the student organization level. The most frequent rejection point, typically
for incomplete documentation or policy violations.

**Stage 2 — Faculty Office (Văn phòng Khoa/Bộ môn)**
Review at the faculty level, confirming the event is appropriate for the academic unit.

**Stage 3 — University Board Office (Ban Giám Hiệu)**
Final institutional approval. Upon passing, the system generates an official event identifier
code and the event becomes published and open for student registration.

Each administrator can only act on proposals at their assigned stage. Attempting to act on a
different stage is rejected by the system. Every decision is recorded with the administrator's
identity, department, timestamp, and any comments provided — forming a complete audit trail.

### 4.2 Rejection and Resubmission

Rejection at any stage returns the proposal to a rejected state. The organizer receives the
reviewer's comments, revises their submission, and resubmits from the beginning. Resubmission
always restarts at Stage 1, regardless of which stage rejected.

---

## 5. Proposed Post-Event Processing Pipeline

### 5.1 Shared Entry Point

When an event ends, the system automatically opens the post-event reporting workflow. A deadline
countdown is displayed on the organizer's dashboard. Email reminders are sent as the deadline
approaches. Submissions after the deadline are accepted but marked as late — the reviewing
office sees this flag and handles it at their discretion.

### 5.2 Attendee List Format

Both flows use an EMS-provided Excel template based on the official Mẫu CNHD templates.
EMS enhances the standard template with one additional column — **Nhận GCN (Y/N)** — to
explicitly flag which attendees are eligible to receive a certificate. This replaces the
freeform `Ghi chú` annotation used in the current manual process with a machine-readable flag.

**Youth Union template columns (Mẫu CNHD02):**
STT · MSSV · Họ và tên · Khoa/Bộ môn · Vai trò (BTC/CTV/Tham gia) · Email · SĐT · Ghi chú · **Nhận GCN**

**Student Association template columns (Mẫu CNHD01):**
STT · Họ tên · MSSV · Khoa/Bộ môn hoặc Trường hoặc Nhóm dự thi · Vai trò (BTC/Tham gia) · Ghi chú · **Nhận GCN**

The Student Association template has two sub-unit sheets (LCH and CLB/ĐN) representing
different organizational senders (Faculty Student Association chapters vs. Clubs and Teams).
The data columns are identical across both sheets. EMS parses whichever sheet contains data,
using the sender's official title (e.g. BCH LCH SV KHOA/BM or BCN CLB) as the affiliated
organization identifier.

EMS parses uploaded files by column header name, not by column position, to handle formatting
variations. The `Vai trò` column is preserved per attendee record, as it determines certificate
type downstream in iuyouth (organizer certificate vs. participant certificate).

### 5.3 Youth Union Flow (YOUTH_UNION events)

**Deadline:** 14 days from event end  
**Reviewing office:** Văn phòng Đoàn trường

The organizer submits the following as a package through EMS:

1. **Brief activity report (Báo cáo nhanh)** — rendered as a structured form in EMS
   based on the official Mẫu CNHD01 Word template. EMS pre-fills known fields (event
   name, event code, dates, organizer count, participant count derived from the attendee
   list). The organizer fills in four written sections:
   - Program content and results (Nội dung và kết quả)
   - Student satisfaction summary (Tình hình và sự hài lòng)
   - Strengths of the event (Thuận lợi, điểm mạnh)
   - Difficulties and limitations (Khó khăn, điểm hạn chế)
   EMS can generate a properly formatted Word file for download if the office requires it.

2. **iuyouth.edu.vn article URL** — text field, organizer's responsibility

3. **Five labelled event photographs** — enforced count; naming convention auto-applied
   by system: `MãHĐ_TênHĐ_01` through `_05`

4. **Attendee list** — EMS Mẫu CNHD02 template (with Nhận GCN column)

5. **Activity plan link** — Google Drive URL, must use iuyouth.edu.vn account

6. **Feedback survey results** — Excel upload, mandatory (no minimum threshold)

After the Youth Union Office approves the report, a second step unlocks:

7. **Certificate template** — organizer uploads the pre-signed landscape A4 PDF.
   This step is only available after office approval (per official Đoàn guidelines).
   Once uploaded, EMS packages the template + cert-eligible participant list as an
   export for the organizer to submit to iuyouth.

### 5.4 Student Association Flow (STUDENT_ASSOCIATION events)

**Deadline:** 7 days from event end  
**Reviewing office:** Văn phòng Hội Sinh viên (VP HSV)

The organizer submits the following as a single package through EMS before office review:

1. **Attendee list** — EMS Mẫu CNHD01 template (with Nhận GCN column), prize
   winners annotated in Ghi chú

2. **iuyouth.edu.vn article URL** — text field (draft static link)

3. **Feedback survey results** — Excel upload, mandatory; responses must represent
   at least **50% of total attendees**. EMS blocks submission if this threshold is
   not met, displaying the shortfall count to the organizer.

4. **Certificate template** — organizer uploads the pre-signed landscape A4 PDF,
   if the event is issuing certificates. Submitted here as part of the initial
   package, before office review (per official Hội guidelines).

5. **Ten labelled event photographs** — naming convention: `MãHĐ_TênHĐ_1` through `_10`

6. **Brief written event summary** — structured text fields per content requirements

7. **Social media article link** — text field

8. **Total allocated budget** — numeric field (amount only)

Upon approval by the Student Association Office, EMS packages the certificate template
and cert-eligible participant list as an export for the organizer to submit to iuyouth.

### 5.5 Key Differences Between the Two Flows

| Aspect | Youth Union (Đoàn) | Student Association (Hội) |
|---|---|---|
| Submission deadline | 14 days | 7 days |
| Certificate template submitted | After office approval | With initial package |
| Feedback requirement | Mandatory, no minimum | Mandatory, minimum 50% of attendees |
| Photographs required | 5 | 10 |
| Budget reporting | Not required | Required |
| Activity plan | Google Drive link required | Not required |
| Brief report | Structured form (4 written sections) | Not required |
| Event summary | Not required | Required |
| Social media link | Not required | Required |
| Reviewing office | VP Đoàn trường | VP HSV trường |

---

## 6. Certificate Data Export Pipeline

### 6.1 Overview

EMS does not generate certificate PDFs. The iuyouth infrastructure already handles this
reliably and in compliance with university policy. EMS's role is to prepare and validate the
two inputs that iuyouth requires: the organizer's pre-signed certificate template and the
structured list of cert-eligible participants.

### 6.2 Certificate Template Requirements

The organizer designs the template externally and uploads a landscape A4 PDF to EMS. The
template must already carry the signatures of both the Faculty Secretary and the University
Secretary before upload. EMS validates that the file is a PDF of the correct dimensions
(297mm × 210mm). Signature presence cannot be validated automatically and remains the
organizer's responsibility.

The template must leave the designated blank data zone clear — positioned 8cm from the top
with 3.33cm height — for iuyouth to inject participant data.

### 6.3 Certificate Eligibility

Cert-eligible participants are identified by the `Nhận GCN = Y` flag in the uploaded
attendee list. EMS validates that all flagged recipients are present in the attendee list
before allowing export. The organizer sees a summary count of eligible recipients and
confirms before the export is generated.

Attendees who appear on the list but were not registered in EMS are accepted as walk-in
participants, flagged for the reviewing office's visibility, and may be marked cert-eligible
at the organizer's discretion.

The organizer may re-upload a corrected attendee list at any point before confirming the
export. Once the export is confirmed and downloaded, the list is locked.

### 6.4 Export Package

When the organizer confirms, EMS produces a download package containing:
- The uploaded certificate template PDF
- A participant CSV derived from the attendee list, containing:
  MSSV · Họ và tên · Khoa/Bộ môn · Vai trò · filtered to Nhận GCN = Y rows only

The organizer submits this package directly to iuyouth, which handles PDF generation,
data overlay, and public certificate issuance. EMS records the export timestamp and
participant count for audit purposes.

### 6.5 Physical Certificates

If a student requests a physical certificate, EMS records the request and notifies the
organizer. The physical printing, signing, and distribution process remains entirely
offline. EMS does not automate this step.

---

## 7. Implementation Plan

### Phase 1 — Approval Pipeline Foundation
- Administrator accounts updated to include a department assignment (Youth Union, Faculty, Rector)
- Proposal status model expanded to reflect the three-stage pipeline
- Approval logic updated so each administrator can only act at their assigned stage
- Frontend updated to reflect new proposal statuses and department context on admin dashboard
- Audit log extended to cover all new approval and rejection decisions

**Completion check:** Full three-stage approval flow works end-to-end. Department gating
enforced. Existing proposals unaffected.

### Phase 2 — Post-Event Report Core
- Post-event reporting workflow built for both affiliation types
- Submission form branches by event affiliation type
- EMS-enhanced Excel templates (Mẫu CNHD01, CNHD02) available for download
- Excel upload with column-header-based parsing into structured attendance records
- Walk-in detection and flagging (attendees not found in EMS registrations)
- Brief report structured form for Youth Union events (4 written sections, auto-filled fields)
- Photo upload with count enforcement (5 vs. 10) and auto-naming convention
- Feedback upload with 50% threshold validation for Student Association events
- Deadline countdown display and email reminder logic (at 50% elapsed, 1 day remaining)
- Late submission flagging
- Office admin review interface (approve / reject with comments)
- Email notifications: event ended, deadline warnings, submission confirmed, report decision

**Completion check:** Both flows complete end-to-end. Feedback threshold blocks submission
correctly. Late submissions flagged. Office admin can approve and reject reports.

### Phase 3 — Certificate Export Pipeline
- Certificate type declaration step (Digital / Physical / None)
- Certificate template upload with PDF dimension validation
- Cert-eligible participant extraction from attendee list (Nhận GCN column)
- Walk-in cert-eligibility handling
- Organizer confirmation step showing eligible recipient count
- Export package generation (template PDF + filtered participant CSV)
- Export lock after download confirmed
- Physical certificate request flag and organizer notification

**Completion check:** Organizer can upload template, confirm eligible list, download export
package. List is locked after export. Physical requests notify organizer correctly.

### Phase 4 — Polish and Edge Cases
- File naming convention enforcement across both flows
- Walk-in attendee visibility on office admin review dashboard
- Audit log coverage for all new actions (report approval, export confirmation)
- End-to-end testing of both complete flows (Đoàn and Hội)
- Edge case handling: resubmission after report rejection, attendee list re-upload before export

---

## 8. Assumptions

| ID | Assumption | Basis |
|---|---|---|
| A1 | Rejection at any approval stage resets the proposal to full resubmission from Stage 1 | Described as the standard manual process by event organizers |
| A2 | Walk-in attendees not registered in EMS may still receive certificates | Permitted but flagged; fraud prevention is an organizational responsibility |
| A3 | The organizer-submitted attendee list is treated as the authoritative record of attendance | No automated attendance verification mechanism exists |
| A4 | Certificate template signatures cannot be validated by the system | Signatures are pre-baked into the PDF by the organizer before upload |
| A5 | Landscape A4 (297mm × 210mm) is the standard certificate orientation | Based on real issued certificate: IT Journey Talkshow, January 2025 |
| A6 | Youth Union events may also issue certificates | Confirmed by Đoàn flow guidelines (Bước 7) and policy document HD252610 |
| A7 | LCH and CLB/ĐN sub-unit sheets in Mẫu CNHD01 share identical column structure | Verified from both Student Association template sheets |
| A8 | The `Vai trò` column value (BTC/CTV/Tham gia) determines certificate type in iuyouth | Observed from real certificate wording and template structure |

---

## 9. Open Questions

| ID | Question | Impact |
|---|---|---|
| Q1 | Can a single administrator be assigned to more than one department? | Affects whether department is a single field or a relationship |
| Q2 | Are there events that do not require activity recognition from either office? | Post-event reporting may need to be optional for some event types |
| Q3 | Is the affiliated organization a free-text field or a managed registry? | Determines whether a separate organization table is needed |
| Q4 | What is the exact CSV column format expected by iuyouth for participant upload? | Determines export CSV column names precisely |
| Q5 | Who enters the official decision number for Student Association events — the Hội office or the Youth Union office? | Determines which admin role authorizes certificate release in iuyouth |

---

*This proposal was developed through structured process discovery based on: official policy
document HD252610 (Youth Union Certificate Directive); iuyouth.edu.vn activity recognition
guidelines for Văn phòng Đoàn and Văn phòng Hội; official attendee list templates Mẫu CNHD01
and CNHD02; the official Báo cáo nhanh brief report template; and a real issued certificate
from the IT Journey Talkshow (January 2025).*
