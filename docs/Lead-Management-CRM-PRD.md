# Product Requirements Document (PRD)
## Lead Management CRM System

---

## Document Information

| Item | Detail |
|------|--------|
| Product Name | Lead Management CRM System |
| Document Status | Draft |
| Document Owner | Product Management |
| Target Release Date | TBD |
| Last Updated | December 2025 |

---

## Executive Summary

The Lead Management CRM System is a comprehensive sales and lead management platform designed to enable organizations to capture, track, and nurture leads through structured workflows. It is a multi-tenant system, designed to support multiple companies and supports multi-user collaboration with role-based access controls, enabling sales teams to efficiently manage leads from initial contact through conversion or loss. The platform emphasizes easy lead capture, assignment workflows, comprehensive reporting, and automated follow-up tracking to maximize sales team productivity and lead conversion rates.

---

## Product Purpose & Objectives

### Why We're Building This

Organizations struggle with scattered lead information, inefficient assignment workflows, and lack of visibility into the sales pipeline. This system solves the critical pain points of:

- **Lead Capture Inefficiency** - Leads captured across multiple channels with no centralized system
- **Assignment Bottlenecks** - Manual, ad-hoc lead assignment resulting in delays and missed opportunities
- **Follow-up Management** - Lack of systematic follow-up tracking leading to lost opportunities
- **Sales Visibility** - No clear view into pipeline status, conversion metrics, or team performance

### Strategic Alignment

This product enables:

- Increased lead conversion rates through structured workflows and timely follow-ups
- Improved sales team collaboration with transparent lead ownership and status tracking
- Data-driven decision making through comprehensive reporting (conversion, win/loss analysis)
- Scalable lead management as the company grows from single user to enterprise teams

---

## User Personas & Roles

### Primary User Personas

#### 1. System Admin
Manages companies, manages company-wide settings, manages company admin access and companies user management.

Able to select the company and should be able to see that companies dashboard, leads and report in the respective pages. Able to invite company admin users.

#### 2. Company Admin
Manages company-wide settings, user management, and lead assignment. Needs visibility into all leads, ability to reassign, and comprehensive analytics.

Creates the organizational structure, onboards new users and assigns roles to the company users and also assign manager to the team members.

Able to add, edit leads.

#### 3. Company Manager
Oversees team members and their assigned leads. Needs to assign leads to team members and view team performance.

Tracks team progress against conversion targets.

Able to add, edit leads.

#### 4. Team Member
Day-to-day lead management and follow-up execution. Needs a simple interface to view assigned leads, set follow-ups, and update status.

Primary user for lead entry and client communication.

Able to add, edit leads.

### Role-Based Permissions

| Feature | Company Admin | Company Manager | Team Member |
|---------|---------------|-----------------|-------------|
| Add/Create Leads | ✓ | ✓ | ✓ |
| View All Leads | ✓ | ✓ (team only) | ✓ (own only) |
| Assign Leads | ✓ | ✓ (to team members) | ✗ |
| Send Invitations | ✓ | ✗ | ✗ |
| Manage Users | ✓ | ✗ | ✗ |
| View Reports | ✓ | ✓ (for the team reporting to him) | ✓ (Only specific for his assigned leads) |
| Access Settings | ✓ | ✗ | ✗ |

---

## Core Features & Requirements

### 1. User Registration & Authentication

#### 1.1 Direct Registration (Self-Service)

**Requirement:** Users can register directly into the system

**Acceptance Criteria:**
- Company details are mandatory (company name, industry, size, etc.)
- User details captured: Full Name, Username (email address), Password
- Default user role is Admin for self-registered users
- OTP/verification code sent to registered email address
- Email verification required before account activation
- Technical requirement: SSO capabilities enabled

#### 1.2 Invitation-Based Registration (Admin-Invited)

**Requirement:** Admin users can invite other users from their company

**Acceptance Criteria:**
- Admin can send email invitations to new team members
- Company details auto-populated for invitees
- Email address auto-populated in invitation link
- Invitees complete username (email address defaulted) and password during registration
- OTP/verification code sent to registered email for verification
- Invitee registration links expire after 7 days

#### 1.3 Login & Access

**Requirement:** Registered users can log into the application

**Acceptance Criteria:**
- Login via username/email and password
- SSO integration available as alternative login method
- Successful login redirects to Dashboard
- Session timeout after 30 minutes of inactivity
- "Remember me" option available on login

---

### 2. Add Lead

The Add Lead feature enables users to quickly capture lead information. This form will be accessible from multiple locations (Dashboard, All Leads, My Leads).

#### 2.1 Add Lead Form Structure

**Presentation Options:**
- Modal popup form (preferred for quick lead capture)
- Inline form with expansion

##### Section 1: General Details

| Field | Type | Requirement | Validation |
|-------|------|-------------|------------|
| Lead Date | Date | Required | Default: Today's date, user can modify |
| Client Name | Short Text | Required | Max 100 characters, alphanumeric + spaces |
| Company Name | Short Text | Optional | Max 10 characters |
| Mobile Number | Phone | Required | Format: +91 XXXXX XXXXX or 10-15 digits |
| Email Address | Email | Optional | Standard email format validation |
| Lead Source | Dropdown | Required | System catalog table (tb_LeadSource) |
| Referred By | Short Text | Optional | Max 50 characters. Display it when Lead Source is Referral. |

**Lead Source Dropdown Options:**
- Referral
- Social Media
- Google Ad
- Website
- LinkedIn
- WhatsApp
- Cold Call
- Walk-in
- Others

##### Section 2: Project / Requirement Details

| Field | Type | Requirement | Validation |
|-------|------|-------------|------------|
| Interested In | Free Text | Optional | Placeholder text: "e.g., Digital Marketing, Fire System, Software" |
| Expected Budget | Short Text | Optional | Numeric, currency format optional |
| Urgency Level | Dropdown | Optional | Values: Immediate, Within 1 Week, Within 1 Month, Just Exploring |

##### Section 3: Sales Follow-up Tracking

| Field | Type | Requirement | Validation |
|-------|------|-------------|------------|
| Lead Status | Dropdown | Required | System catalog table (tb_LeadStatus). Default value "New" |
| Assigned To | Dropdown | Optional | Displays: For Admin - all company users, For Manager - self + team members, For Team Member - self only |
| Follow-up Date | Date | Optional | Date must be >= today |
| Notes / Conversation Summary | Paragraph Text | Optional | Max 1000 characters |

**Lead Status (tb_LeadStatus) Dropdown Options:**
- New Lead
- Contacted
- Meeting Scheduled
- Demo Done
- Proposal Sent
- Follow-up
- Converted
- Lost

**System Fields (Auto-populated, Read-only):**
- Created Date (timestamp)
- Created By (user who created the lead)
- Updated Date (timestamp)
- Updated By (user who last modified)

#### 2.2 Add Lead Accessibility

**Requirement:** "Add Lead" action available from:
- Dashboard (floating action button or top navigation)
- All Leads page (add button in toolbar)
- My Leads page (add button in toolbar)
- Upcoming Follow-ups page (add button in toolbar)

---

### 3. Assign Leads

Enables Admin and Managers to assign unassigned leads to team members.

#### 3.1 Assign Leads Page

**Visibility & Access:**
- Visible to: Admin, Manager roles only
- Team Members: No access

**Functionality:**
- Displays all leads where "Assigned To" is empty/null
- Grid-based list view with pagination
- Support for inline filtering and sorting
- Inline editing capability to update assignments
- Alternative: Explicit filtering panel if inline filtering not feasible

**Grid Columns (Customizable):**
- Client Name
- Company Name
- Lead Date
- Lead Source
- Interested In
- Lead Status
- Urgency Level
- Follow-up Date
- Expected Budget
- Created By
- Created Date
- Updated By
- Updated Date

**Grid Features:**
- Column visibility toggle (show/hide columns)
- Inline sorting (ascending/descending by any column)
- Inline filtering or dedicated filter panel for:
  - Date range (Lead Date, Follow-up Date)
  - Lead Status
  - Lead Source
  - Interested In
  - Urgency Level
- Pagination: 10, 25, 50 rows per page configurable
- Inline editing for "Assigned To" field with dropdown
- Bulk assignment capability (select multiple leads, assign to single user)

---

### 4. Dashboard

**Purpose:** Landing page after login providing quick overview and access to key functions

**Key Components:**
- Welcome message with user's name and role
- Quick stats: Total Leads, Unassigned Leads, Today's Follow-ups, Conversion Rate %
- "Add Lead" action button (prominent)
- Recent leads list (last 5 created)
- Upcoming follow-ups (next 2 days)
- Navigation sidebar to all main features

---

### 5. Active Leads (Admin Only)

**Purpose:** View all leads belongs to the organization with their current status

**Functionality:**
- Grid view of all leads in the system
- Filter by status, date range, lead source
- Quick actions: Edit, Delete, Change Status, Reassign

---

### 6. My Leads

**Purpose:** View leads assigned to the current user

**Functionality:**
- Display only leads where "Assigned To" = Current User
- Grid view with filtering and sorting
- Status at a glance (status distribution chart)
- Click lead to view/edit details
- Add Lead button available

---

### 7. Upcoming Follow-ups

**Purpose:** Track leads requiring follow-up action

**Functionality:**
- Display leads where Follow-up Date <= Today + 7 days
- Sort by Follow-up Date (ascending)
- Reschedule follow-up
- Quick note addition

---

### 8. All Leads (Admin Only)

**Purpose:** Comprehensive view of entire lead database

**Functionality:**
- Complete grid of all leads with all columns
- Advanced filtering and search
- Bulk actions: Bulk reassign, Bulk status update, Bulk delete
- Export to CSV/Excel
- Lead source analytics

---

### 9. Reports

#### 9.1 Conversion Report

- **Metrics:** Total Leads → Contacted → Meeting Scheduled → Demo Done → Proposal Sent → Converted
- **Visualization:** Funnel chart showing conversion rate at each stage
- **Filters:** Date range, Lead Source, Assigned User
- **Insights:** Conversion rate %, average days to conversion, top performing sources

#### 9.2 Win vs Lost Report

- **Metrics:** Total Leads, Won Leads (Status: Converted), Lost Leads (Status: Lost)
- **Visualization:** Win/Loss pie chart, bar chart by Lead Source, bar chart by Urgency Level
- **Filters:** Date range, Lead Source, Lead Owner
- **Insights:** Win rate %, lost rate %, trends over time

#### 9.3 Additional Analytics

- Leads by Source (pie chart)
- Leads by Status (horizontal bar chart)
- Leads by Urgency Level
- Team Performance (leads assigned, converted, average conversion time)

---

### 10. Manage Users (Admin Only)

**Purpose:** Manage company users and their access levels

**Functionality:**
- View all company users in table format
- Add new user (invite)
- Edit user role (Admin, Manager, Team Member)
- Deactivate/activate user accounts
- Reset user password
- View user activity log

---

### 11. Settings

**Purpose:** System configuration and preferences

**Sections:**
- **Company Settings:** Company name, logo, website, industry
- **Lead Sources:** Manage LeadSource catalog (add, edit, delete)
- **Lead Statuses:** Manage LeadStatus catalog (add, edit, delete)
- **Email Configuration:** Email notifications settings

---

## System Catalog Tables

### tb_LeadSource

| Column | Description |
|--------|-------------|
| Id (Primary Key) | Unique identifier |
| Name | Source name |
| Active | Active flag |
| CreatedDate | Record creation date |
| UpdatedDate | Last update date |

**Default Values:** Referral, Social Media, Google Ad, Website, LinkedIn, WhatsApp, Cold Call, Walk-in, Others

### tb_LeadStatus

| Column | Description |
|--------|-------------|
| Id (Primary Key) | Unique identifier |
| Name | Status name |
| Active | Active flag |
| DisplayOrder | Display sequence |
| CreatedDate | Record creation date |
| UpdatedDate | Last update date |

**Default Values:** New Lead, Contacted, Meeting Scheduled, Demo Done, Proposal Sent, Follow-up, Converted, Lost

---

## Database Schema

### Core Tables

#### tb_Company

| Column | Description |
|--------|-------------|
| CompanyId (PK) | Primary key |
| CompanyName | Company name |
| Industry | Industry type |
| Size | Company size |
| Website | Company website |
| Phone | Contact phone |
| CreatedDate | Record creation date |
| UpdatedDate | Last update date |

#### tb_User

| Column | Description |
|--------|-------------|
| UserId (PK) | Primary key |
| CompanyId (FK) | Foreign key to tb_Company |
| FullName | User's full name |
| Email | Email address |
| Username | Login username |
| PasswordHash | Hashed password |
| UserRole (FK → tb_UserRole) | System Admin, Company Admin, Company Manager, Team Member |
| IsActive | Active status |
| CreatedDate | Record creation date |
| UpdatedDate | Last update date |

#### tb_Lead

| Column | Description |
|--------|-------------|
| LeadId (PK) | Primary key |
| CompanyId (FK) | Foreign key to tb_Company |
| LeadDate | Lead capture date |
| ClientName | Client name |
| CompanyName [Optional] | Client's company |
| MobileNumber | Contact phone |
| EmailAddress [Optional] | Contact email |
| LeadSourceId (FK → tb_LeadSource) | Lead source reference |
| InterestedIn | Interest details |
| ExpectedBudget [Optional] | Budget estimate |
| UrgencyLevelId (FK → tb_Urgency) [Optional] | Urgency reference |
| LeadStatusId (FK → tb_LeadStatus) | Status reference |
| AssignedToUserId (FK → tb_User) [Optional] | Assigned user |
| FollowupDate [Optional] | Next follow-up date |
| Notes [Optional] | Additional notes |
| CreatedDate | Record creation date |
| CreatedByUserId (FK → tb_User) | Creator reference |
| UpdatedDate | Last update date |
| UpdatedByUserId (FK → tb_User) | Last modifier reference |
| StatusUpdateDate | Status change timestamp |

#### tb_LeadSource

| Column | Description |
|--------|-------------|
| LeadSourceId (PK) | Primary key |
| CompanyId (FK) | Foreign key to tb_Company |
| Name | Source name |
| IsActive | Active status |
| CreatedDate | Record creation date |
| UpdatedDate | Last update date |

#### tb_LeadStatus

| Column | Description |
|--------|-------------|
| LeadStatusId (PK) | Primary key |
| CompanyId (FK) | Foreign key to tb_Company |
| Name | Status name |
| DisplayOrder | Display sequence |
| IsActive | Active status |
| CreatedDate | Record creation date |
| UpdatedDate | Last update date |

#### tb_Urgency

| Column | Description |
|--------|-------------|
| UrgencyLevelId (PK) | Primary key |
| CompanyId (FK) | Foreign key to tb_Company |
| Name | Urgency level name |
| DisplayOrder | Display sequence |
| IsActive | Active status |
| CreatedDate | Record creation date |
| UpdatedDate | Last update date |

#### tb_UserRole

| Column | Description |
|--------|-------------|
| RoleId (PK) | Primary key |
| RoleName | Role name |
| IsActive | Active status |
| CreatedDate | Record creation date |
| UpdatedDate | Last update date |

---

## Success Metrics

| Goal | Metric | Target |
|------|--------|--------|
| Increase lead capture efficiency | Average time to add lead | < 2 min |
| Boost follow-up compliance | % of leads with completed follow-ups | > 80% |
| Enhance conversion visibility | Leads reaching "Converted" status | Track baseline, improve 15% |
| Reduce lead loss | % of leads marked "Lost" without follow-up attempt | < 10% |
| User adoption | Active users / Total users | > 85% |
| System reliability | Uptime percentage | > 99.5% |

---

## Assumptions

### User Assumptions

- Users have valid email addresses for OTP/verification
- Users understand basic CRM concepts and lead management workflows
- Admin users will properly configure system catalogs (Lead Sources, Statuses)
- Users perform regular follow-ups as scheduled

### Technical Assumptions

- System deployed on cloud infrastructure (AWS, Azure, or similar)
- HTTPS/SSL encryption enabled for all communication
- Database supports concurrent user access (SQL Server, PostgreSQL)
- Email service provider available for OTP/notification delivery

### Business Assumptions

- Minimum 5 users per company subscription
- Lead data retention minimum 2 years
- Backup and disaster recovery requirements apply

---

## Out of Scope (Phase 1)

- Advanced lead scoring and AI-powered lead qualification
- Automated lead distribution via complex routing rules
- Email campaign integration and mass communication
- Third-party CRM integration (Salesforce, HubSpot)
- SMS/WhatsApp native integration (Phase 2)
- Advanced forecasting and pipeline analytics (Phase 2)
- Duplicate lead detection and merging (Phase 2)
- Custom fields and metadata (Phase 2)

---

## Technical Requirements

### Technology Stack (Compulsory)

#### Frontend:
- React with Vite (as per team expertise)
- Bootstrap CSS for responsive UI
- Minimal, modern UI design
- Real-time data updates via WebSocket or polling

#### Backend:
- ASP.NET Core 10 Web API
- Entity Framework Core for ORM
- MS SQL Server 2022 or later
- JWT token-based authentication
- Role-based access control (RBAC)

#### Infrastructure:
- Docker containerization for deployment
- Cloud hosting (AWS ECS, Azure Container Instances, or similar)
- CDN for static assets
- Environment-based configuration (Dev, Staging, Production)

---

## Non-Functional Requirements

### Performance:
- Page load time < 2 seconds
- Grid with 1000 rows load time < 3 seconds
- Add Lead form submission < 1 second
- API response time < 500ms for 95th percentile

### Security:
- Password minimum 8 characters with complexity rules
- All data encrypted at rest and in transit (TLS 1.2+)
- SQL injection prevention via parameterized queries
- XSS protection via input sanitization
- Audit trail for all lead modifications
- GDPR-compliant data retention and deletion

### Scalability:
- Support minimum 100 companies
- Support minimum 10,000 leads per company
- Support minimum 1000 concurrent users

### Availability:
- 99.5% uptime SLA
- Automated backup every 24 hours
- Disaster recovery plan with RTO < 4 hours, RPO < 1 hour

---

## User Stories (By Feature)

### User Story: Registration

**Epic:** User Onboarding

**Story 1:** As a new business user, I want to register directly into the system so that I can start using it without waiting for an invitation.

- **Given:** User accesses the registration page
- **When:** User enters company details, full name, email, username, password
- **Then:** System sends OTP to email, and upon verification, account is created with Admin role

### User Story: Lead Capture

**Epic:** Lead Management

**Story 2:** As a Company Admin or Company Manager or Team member, I want to quickly add a new lead from multiple pages so that I can capture opportunities immediately without navigating away from my current view.

- **Given:** User is on Dashboard or Leads page
- **When:** User clicks "Add Lead" and fills the form
- **Then:** Lead is saved and user is redirected back to the current page with success message

### User Story: Lead Assignment

**Epic:** Lead Management

**Story 3:** As a company manager or company admin, I want to assign unassigned leads to team members so that leads are distributed fairly based on capacity.

- **Given:** Manager is on "Assign Leads" page viewing unassigned leads
- **When:** Manager selects leads and assigns them to team members
- **Then:** Leads are updated with assigned user and team members receive notification

### User Story: Follow-up Tracking

**Epic:** Sales Execution

**Story 4:** As a team member, I want to see upcoming follow-ups in a dedicated view so that I don't miss any scheduled follow-ups.

- **Given:** User is on "Upcoming Follow-ups" page
- **When:** User views leads requiring follow-up within the next 2 days
- **Then:** Leads are listed in chronological order with quick action to update status or reschedule

### User Story: Reporting

**Epic:** Sales Analytics

**Story 5:** As a sales manager, I want to view conversion and win/loss reports so that I can understand team performance and identify improvement areas.

- **Given:** Manager accesses Reports section
- **When:** Manager views Conversion Report or Win vs Lost Report
- **Then:** Visualizations show pipeline progress, conversion rates, and top-performing sources

---

## Design Principles

- **Simplicity First:** Minimal, clutter-free UI focused on lead management tasks
- **Role-Based Context:** UI adapts based on user role (Admin, Manager, Team Member)
- **Mobile-Responsive:** All pages responsive for phone, tablet and desktop
- **Accessibility:** WCAG 2.1 AA compliance for color contrast and keyboard navigation
- **Consistency:** Unified design patterns, typography, spacing across all pages
- **Speed:** Fast data load and form submission times for user productivity

---

## Acceptance Criteria Summary

- [x] Users can self-register with company details and email verification
- [x] Admins can invite users via email with auto-populated company details
- [x] Lead form available from multiple pages with all required and optional fields
- [x] Assign Leads page displays only unassigned leads with grid, filtering, and inline editing
- [x] Dashboard provides quick overview and easy access to main features
- [x] Role-based menus and permissions enforced consistently
- [x] Conversion and Win vs Lost reports display with visual charts
- [x] All system fields (Created Date, Created By, Updated Date, Updated By) tracked automatically

---

## References

1. Perforce. (2025). How to Write a PRD: Your Complete Guide. https://www.perforce.com/blog/alm/how-write-product-requirements-document-prd
2. Slack. (2025). Lead Management: Complete Guide to Converting. https://slack.com/blog/productivity/lead-management-complete-guide-to-converting-in-2025
3. LeadSquared. (2025). 10 CRM Best Practices for 2025. https://www.leadsquared.com/learn/sales/crm-best-practices/
4. Atlassian. (2025). How to Create a Product Requirements Document. https://www.atlassian.com/agile/product-management/requirements
5. Copy.ai. (2025). Lead Management Software in 2025: Features & Use Cases. https://www.copy.ai/blog/lead-management-software-in-2024-features-use-cases
