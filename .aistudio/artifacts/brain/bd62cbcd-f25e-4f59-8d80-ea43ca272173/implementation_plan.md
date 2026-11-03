# Implementation Plan: Multi-Student Registration with Shared Parent Email

Support registering and managing multiple students (e.g., siblings volunteering together with a parent or guardian) using the same email address, while preserving unique student identities, separate MCPS SSL certificates, and individual service hours.

---

## 1. Safety & Backup Strategy (Zero-Risk Execution)

Per your requirement to ensure nothing is changed without a complete backup:
- **Code Backup Snapshot**: Before any code edits, a backup snapshot branch / archive of the current working codebase will be created.
- **Database Schema Backward Compatibility**: Existing volunteer records will remain 100% valid. No breaking changes will be made to the underlying schema (`email` remains a standard field, but lookup keys shift from single `email` to compound `email + studentName` or `sweId`).
- **Data Export / Restore**: Existing localStorage state will be safeguarded; any newly added seed examples will demonstrate a parent with 2 sibling volunteers without altering existing test accounts (`Marcus Chen`, `Maya Patel`, `Jordan Washington`, `Emily Zhao`).
- **No Source Code Changes During Planning**: As requested, all existing source code remains untouched until you review and approve this plan.

---

## 2. Architecture & Data Model

### A. Individual Identity per Child
Each student remains an independent `Volunteer` record with:
- **Unique SWE ID**: Generated deterministically or randomly based on each child's initials (e.g., `AS-1234` for Alice Smith, `BS-5678` for Bob Smith).
- **Unique Student ID**: Each child's own MCPS Student ID (e.g., `MCPS-102938`).
- **Shared Contact Email**: The parent/family email address (e.g., `smith.family@gmail.com`).
- **Independent Sessions & Hours**: Each child checks in and out independently (or simultaneously), generating separate service records and supervisor sign-offs.

### B. Core Service Layer Upgrades (`src/services/storage.ts`)
1. **`findVolunteersByEmail(email: string): Volunteer[]`**: Returns all students registered under that email address.
2. **`findOrCreateVolunteer(...)`**:
   - Instead of matching solely on `email`, match on:
     - `sweId` (if provided), OR
     - `email + lowercased student name`
   - If an email matches an existing family but the student name is new, it generates a new student record and SWE ID under the same email.
3. **`findActiveSessionsByEmail(email: string): ServiceSession[]`**:
   - Returns active (checked-in) sessions for all children attached to that parent email.

---

## 3. User Experience & Workflow Changes

### A. Kiosk Mode Check-In (`src/components/volunteer/KioskCheckIn.tsx`)
- When a parent or student types a shared email:
  - If existing students are found under that email, a **"Students linked to this email"** selection card appears with quick-select buttons for each child (e.g., `[ 👤 Alice Smith (AS-1234) ]` and `[ 👤 Bob Smith (BS-5678) ]`).
  - Tapping a child instantly pre-fills their legal name, school, grade, and SWE ID.
  - A **"+ Register a New Sibling / Student"** button allows adding another child under the same parent email without retyping contact details.

### B. Kiosk Mode Fast Check-Out (`src/components/volunteer/KioskCheckOut.tsx`)
- If a student enters their unique SWE ID (`AS-1234`), they immediately check out individually.
- If a parent enters the shared family email:
  - The kiosk detects all children currently checked in on-site.
  - Presents a clear selector: *"Which student is checking out?"* with one-tap checkout for each child (or a *"Check Out All"* option for families leaving together).

### C. Personal Portal & Google Login (`src/components/volunteer/PersonalPortal.tsx`)
- When a parent logs in using their Google account or family email:
  - The portal detects all children linked to that email.
  - Displays a **Child Profile Switcher** bar at the top:
    `[ 👤 Alice Smith (14.5 hrs) ]  [ 👤 Bob Smith (6.0 hrs) ]  [ + Add Another Student ]`
  - Switching profiles dynamically toggles:
    - Current check-in / check-out status and live elapsed time for that child.
    - Verified SSL hours summary for that child.
    - Official MCPS Form 560-51 download links specific to that child's legal name and student ID.

### D. Admin Portal & SSL Form Issuance (`src/components/admin/`)
- **Approval Queue**: Shows each child by their own name and SWE ID with their assigned facility and timestamp.
- **SSL Form Generator**:
  - Lists check-outs per individual student name.
  - Issues individual MCPS 560-51 PDFs for each child with their respective name and MCPS student ID printed in Section I.
  - When distributed via email or link, the email specifically designates the child's name in the subject and certificate body (e.g., *"MCPS SSL Verification Form - Alice Smith"*).

---

## 4. Verification & Testing Plan

1. **Unit & Logic Testing**:
   - Verify `findVolunteersByEmail` retrieves multiple distinct volunteer records with the same email.
   - Verify `findOrCreateVolunteer` creates a second record when the student name differs.
2. **Kiosk Check-In Flow Test**:
   - Register Student 1 (`Alice Smith`, `parent@gmail.com`).
   - Register Student 2 (`Bob Smith`, `parent@gmail.com`).
   - Verify both receive unique SWE IDs (`AS-XXXX`, `BS-XXXX`).
   - Re-enter `parent@gmail.com` at the kiosk and verify the student selection picker renders properly.
3. **Personal Portal Test**:
   - Log in with `parent@gmail.com`.
   - Verify the profile switcher smoothly toggles between Alice and Bob with their respective hours and certificates.
4. **Browser & Mobile Viewport Verification**:
   - Test on mobile viewports (390px iPhone) to ensure student switcher buttons and selection modals maintain high touch targets ($\ge 44\text{px}$) and responsive layout.
