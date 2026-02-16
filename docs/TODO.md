# Lead Management CRM System - Development TODO

## 📋 Execution Rules & Guidelines

### General Instructions for Cursor AI

1. **Sequential Execution**: Complete tasks in the exact order listed. Do NOT skip ahead.
2. **User Confirmation**: Before starting ANY task or subtask, ask the user: "Ready to start [Phase X.Y - Task Name]? (yes/no)"
3. **Completion Notification**: After completing each task, mark it with ✅ and notify: "✅ Completed: [Phase X.Y - Task Name]. Ready for next task?"
4. **Error Handling**: If a task fails, STOP and notify the user immediately with error details.
5. **Code Quality**: Follow React/Vite best practices, use TypeScript, implement proper error handling, and add meaningful comments.
6. **Consistency**: Maintain consistent naming conventions, folder structure, and code style throughout.
7. **Git Management**: Do NOT initialize Git repository. User will handle Git setup manually.

### Technology Stack Requirements

- **Frontend**: React 18+ with Vite, TypeScript, Bootstrap 5
- **Backend**: ASP.NET Core 10 Web API, Entity Framework Core
- **Database**: MS SQL Server 2022+
- **Authentication**: JWT tokens with role-based access control (RBAC) + SSO integration
- **State Management**: React Context API or Redux Toolkit
- **API Communication**: Axios with interceptors
- **SSO Provider**: Google OAuth 2.0 (extensible for other providers)

### Project Structure

```
Cursor-Execution-LeadMgmt/
├── frontend/          (React + Vite + TypeScript + Bootstrap)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── contexts/
│   │   ├── utils/
│   │   └── types/
│   ├── package.json
│   └── vite.config.ts
│
└── backend/           (ASP.NET Core Web API)
    ├── Controllers/
    ├── Models/
    ├── Services/
    ├── Data/
    ├── DTOs/
    ├── Utils/
    └── Program.cs
```

---

## 🚀 PHASE 1: Project Setup & Foundation

### Phase 1.1: Development Environment Setup

- [x] Create root project directory `Cursor-Execution-LeadMgmt`
- [x] Create `frontend` subfolder
- [x] Create `backend` subfolder
- [x] Inside `frontend`: Run `npm create vite@latest . -- --template react-ts` (equivalent manual Vite-style React+TS scaffold created and configured)
- [x] Inside `frontend`: Install dependencies: `bootstrap`, `react-bootstrap`, `axios`, `react-router-dom`, `jwt-decode`, `sass`, `@popperjs/core`, `react-beautiful-dnd`
- [x] Inside `backend`: Run `dotnet new webapi -n LeadManagementAPI`
- [x] Inside `backend`: Install NuGet packages: `Microsoft.EntityFrameworkCore.SqlServer`, `Microsoft.EntityFrameworkCore.Tools`, `Microsoft.AspNetCore.Authentication.JwtBearer`, `AutoMapper.Extensions.Microsoft.DependencyInjection`
- [x] Configure CORS in backend `Program.cs` to allow frontend communication
- [x] Create `README.md` in root folder with setup instructions

### Phase 1.2: Database Schema & Models

- [x] Create database `LeadManagementCRM` in SQL Server
- [x] Create Entity Model: `Company.cs` in `/backend/Models/` with properties: CompanyId (PK), CompanyName, Industry, Size, Website, Phone, CreatedDate, UpdatedDate
- [x] Create Entity Model: `UserRole.cs` in `/backend/Models/` with properties: RoleId (PK), RoleName, IsActive, CreatedDate, UpdatedDate
- [x] Create Entity Model: `User.cs` in `/backend/Models/` with properties: UserId (PK), CompanyId (FK), FullName, Email, Username, PasswordHash (nullable for SSO users), UserRoleId (FK), ManagerId (FK to User, nullable), IsActive, IsSSOUser (boolean), SSOProvider (string, nullable), SSOProviderId (string, nullable), CreatedDate, UpdatedDate
- [x] Create Entity Model: `LeadSource.cs` in `/backend/Models/` with properties: LeadSourceId (PK), CompanyId (FK), Name, IsActive, CreatedDate, UpdatedDate
- [x] Create Entity Model: `LeadStatus.cs` in `/backend/Models/` with properties: LeadStatusId (PK), CompanyId (FK), Name, DisplayOrder, IsActive, CreatedDate, UpdatedDate
- [x] Create Entity Model: `Urgency.cs` in `/backend/Models/` with properties: UrgencyLevelId (PK), CompanyId (FK), Name, DisplayOrder, IsActive, CreatedDate, UpdatedDate
- [x] Create Entity Model: `Lead.cs` in `/backend/Models/` with properties: LeadId (PK), CompanyId (FK), LeadDate, ClientName, CompanyName (nullable), MobileNumber, EmailAddress (nullable), LeadSourceId (FK), ReferredBy (string, nullable), InterestedIn, ExpectedBudget (nullable), UrgencyLevelId (FK, nullable), LeadStatusId (FK), AssignedToUserId (FK to User, nullable), FollowupDate (nullable), Notes (nullable), CreatedDate, CreatedByUserId (FK to User), UpdatedDate, UpdatedByUserId (FK to User), StatusUpdateDate
- [x] Create `ApplicationDbContext.cs` in `/backend/Data/` with DbSets and relationships (including User self-referencing relationship for ManagerId)
- [x] Create seed data method for UserRoles (System Admin, Company Admin, Company Manager, Team Member)
- [x] Create seed data for LeadSources (Referral, Social Media, Google Ad, Website, LinkedIn, WhatsApp, Cold Call, Walk-in, Others)
- [x] Create seed data for LeadStatuses (New Lead, Contacted, Meeting Scheduled, Demo Done, Proposal Sent, Follow-up, Converted, Lost)
- [x] Create seed data for Urgency levels (Immediate, Within 1 Week, Within 1 Month, Just Exploring)
- [x] Run `dotnet ef migrations add InitialCreate` in backend folder
- [x] Run `dotnet ef database update` in backend folder

### Phase 1.3: Backend Core Infrastructure

- [x] Configure `appsettings.json` with database connection string
- [x] Add JWT settings to `appsettings.json` (Secret, Issuer, Audience, ExpiryMinutes)
- [x] Add Google OAuth settings to `appsettings.json` (ClientId, ClientSecret, RedirectUri)
- [x] Install NuGet package: `Microsoft.AspNetCore.Authentication.Google`
- [x] Create `AuthService.cs` in `/backend/Services/` for JWT token generation
- [x] Configure JWT authentication middleware in `Program.cs`
- [x] Configure Google OAuth authentication in `Program.cs`
- [x] Create `PasswordHelper.cs` in `/backend/Utils/` for password hashing (BCrypt)
- [x] Create `IEmailService.cs` interface in `/backend/Services/`
- [x] Create `EmailService.cs` implementation in `/backend/Services/`
- [x] Create `OtpService.cs` in `/backend/Services/` for OTP generation and validation
- [x] Create `ApiResponse.cs` in `/backend/DTOs/` for standardized API responses
- [x] Create `ErrorResponse.cs` in `/backend/DTOs/` for error handling
- [x] Create global exception handling middleware in `/backend/Middleware/`
- [x] Register all services in `Program.cs` dependency injection

### Phase 1.4: Frontend Core Infrastructure

- [x] Create folder structure in `/frontend/src/`: `components`, `pages`, `services`, `contexts`, `utils`, `types`, `styles`
- [x] Create frontend/src/styles/theme.css with global variables and overrides from the "Modern Soft Theme" guide
- [x] Create frontend/src/styles/bootstrap-override.scss with custom SCSS variables and Bootstrap import from the "Modern Soft Theme" guide
- [x] Create frontend/src/styles/components.css with component-specific CSS (Sidebar, Kanban Card, etc.) from the "Modern Soft Theme" guide
- [x] Import bootstrap-override.scss and components.css into frontend/src/main.tsx (or App.tsx) to apply the theme globally
- [x] Install additional package: `@react-oauth/google` for Google OAuth integration
- [x] Set up React Router in `App.tsx` with basic route structure
- [x] Create `api.ts` in `/frontend/src/services/` with Axios instance
- [x] Add Axios request interceptor to attach JWT token from localStorage
- [x] Add Axios response interceptor for error handling
- [x] Create `AuthContext.tsx` in `/frontend/src/contexts/` for auth state management
- [x] Create TypeScript interfaces in `/frontend/src/types/`: `User.ts`, `Company.ts`, `Lead.ts`, `LeadSource.ts`, `LeadStatus.ts`
- [x] Create `Navbar.tsx` component in `/frontend/src/components/`
- [x] Create `Sidebar.tsx` component in `/frontend/src/components/`
- [x] Create `Layout.tsx` component combining Navbar and Sidebar with Bootstrap
- [x] Create `PrivateRoute.tsx` component for route protection
- [x] Create `Loader.tsx` component for loading states
- [x] Create `ErrorBoundary.tsx` component for error handling
- [x] Create `Toast.tsx` component for notifications
- [x] Configure Google OAuth provider in `App.tsx` with GoogleOAuthProvider wrapper

---

## 🔐 PHASE 2: Authentication & User Management

### Phase 2.1: User Registration Backend

- [x] Create `RegisterDTO.cs` in `/backend/DTOs/`
- [x] Create `AuthController.cs` in `/backend/Controllers/`
- [x] Implement `POST /api/auth/register` endpoint
- [x] Validate company and user details (required fields, email format, password strength)
- [x] Hash password using PasswordHelper
- [x] Create Company record in database
- [x] Create User record with Company Admin role
- [x] Generate 6-digit OTP and expiry time
- [x] Store OTP in database or cache
- [x] Send OTP email using EmailService
- [x] Return success response with userId

### Phase 2.2: User Registration Frontend

- [x] Create `Register.tsx` in `/frontend/src/pages/`
- [x] Create multi-step form with validation
- [x] Step 1: Company details form (name, industry, size, website, phone)
- [x] Step 2: User details form (full name, email, password, confirm password)
- [x] Implement password strength indicator
- [x] Implement form validation with error messages
- [x] Create `authService.ts` in `/frontend/src/services/` with register API call
- [x] Handle API response and navigate to OTP verification page

### Phase 2.3: OTP Verification Backend

- [x] Create `VerifyOtpDTO.cs` in `/backend/DTOs/`
- [x] Implement `POST /api/auth/verify-otp` endpoint in AuthController
- [x] Validate OTP against stored value
- [x] Check OTP expiry (10 minutes)
- [x] Mark user account as Active
- [x] Generate JWT token with claims (userId, companyId, roleId, roleName)
- [x] Return token and user details

### Phase 2.4: OTP Verification Frontend

- [x] Create `VerifyOtp.tsx` in `/frontend/src/pages/`
- [x] Create OTP input component (6 digits)
- [x] Auto-submit when all 6 digits entered
- [x] Add "Resend OTP" button with countdown timer (60 seconds)
- [x] Add verifyOtp API call to authService
- [x] Store JWT token in localStorage on success
- [x] Update AuthContext with user data
- [x] Redirect to Dashboard

### Phase 2.5: User Login Backend

- [x] Create `LoginDTO.cs` in `/backend/DTOs/`
- [x] Implement `POST /api/auth/login` endpoint in AuthController
- [x] Validate username/email and password
- [x] Check if user IsActive
- [x] Verify password hash (skip for SSO users where PasswordHash is null)
- [x] Generate JWT token with user claims
- [x] Handle "Remember Me" functionality (longer token expiry)
- [x] Return token and user details
- [x] Implement `POST /api/auth/google-login` endpoint for SSO
- [x] Validate Google OAuth token received from frontend
- [x] Check if user exists by email and SSOProviderId
- [x] If user doesn't exist, create new user with IsSSOUser=true, PasswordHash=null
- [x] If user exists, verify SSOProvider matches
- [x] Generate JWT token with user claims
- [x] Return token and user details

### Phase 2.6: User Login Frontend

- [x] Create `Login.tsx` in `/frontend/src/pages/`
- [x] Create login form with email and password fields
- [x] Add "Remember Me" checkbox
- [x] Add "Forgot Password?" link (placeholder for future implementation)
- [x] Add "Sign in with Google" button using Google OAuth
- [x] Implement form validation
- [x] Add login API call to authService
- [x] Add Google OAuth login flow (redirect to Google, handle callback)
- [x] Store JWT token in localStorage
- [x] Update AuthContext with user data
- [x] Redirect to Dashboard on success

### Phase 2.7: Invitation System Backend

- [x] Create `UserInvitation` model in `/backend/Models/`
- [x] Add DbSet to ApplicationDbContext
- [x] Create migration for UserInvitation table
- [x] Create `InviteUserDTO.cs` in `/backend/DTOs/`
- [x] Create `UserController.cs` in `/backend/Controllers/`
- [x] Implement `POST /api/users/invite` endpoint (Admin only)
- [x] Validate email and role
- [x] Generate invitation token (GUID)
- [x] Set expiry date (7 days from now)
- [x] Store invitation in database
- [x] Send invitation email with registration link
- [x] Create `RegisterInviteDTO.cs` in `/backend/DTOs/`
- [x] Implement `POST /api/auth/register-invite` endpoint
- [x] Validate invitation token and expiry
- [x] Complete user registration with auto-populated company details

### Phase 2.8: Invitation System Frontend

- [x] Create invite user form modal in Manage Users page
- [x] Add email and role selection fields
- [x] Add invite API call to userService
- [x] Create `AcceptInvite.tsx` in `/frontend/src/pages/`
- [x] Parse invitation token from URL query parameter
- [x] Auto-populate email and company details (read-only)
- [x] Allow password setup
- [x] Trigger OTP verification
- [x] Redirect to login after successful registration

### Phase 2.9: Manage Users Backend

- [x] Implement `GET /api/users` endpoint (Admin only, filtered by companyId)
- [x] Implement `GET /api/users/{id}` endpoint
- [x] Implement `PUT /api/users/{id}` endpoint for editing role
- [x] Implement `PUT /api/users/{id}/deactivate` endpoint (toggle IsActive)
- [x] Implement `PUT /api/users/{id}/reset-password` endpoint
- [x] Add authorization checks for all endpoints

### Phase 2.10: Manage Users Frontend

- [x] Create `ManageUsers.tsx` in `/frontend/src/pages/`
- [x] Display users in table/grid format
- [x] Show columns: Name, Email, Role, Status (Active/Inactive), Actions
- [x] Add "Invite User" button at top
- [x] Implement inline role edit dropdown
- [x] Add activate/deactivate toggle switch
- [x] Add reset password button
- [x] Create userService with all user management API calls
- [x] ✅ Fix: Keep "Role" badge fully visible (no truncation) in Manage Users

---

## 📊 PHASE 3: Lead Management Core Features

### Phase 3.1: Add Lead Backend

- [x] Create `LeadDTO.cs` in `/backend/DTOs/` for create/update operations
- [x] Create `LeadController.cs` in `/backend/Controllers/`
- [x] Implement `POST /api/leads` endpoint
- [x] Validate required fields (LeadDate, ClientName, MobileNumber, LeadSourceId)
- [x] Auto-populate CreatedDate, CreatedByUserId from JWT claims
- [x] Set default LeadStatusId to "New Lead"
- [x] Handle conditional "ReferredBy" field logic
- [x] Return created lead with LeadId

### Phase 3.2: Add Lead Frontend

- [x] Create `AddLeadModal.tsx` in `/frontend/src/components/`
- [x] Section 1: General Details form fields (LeadDate with date picker, ClientName, CompanyName, Mobile, Email, LeadSource dropdown, ReferredBy)
- [x] Implement conditional rendering: Show "ReferredBy" only when LeadSource = "Referral"
- [x] Section 2: Project Details form fields (InterestedIn textarea, ExpectedBudget, UrgencyLevel dropdown)
- [x] Section 3: Sales Tracking form fields (LeadStatus dropdown defaulted to "New", AssignedTo dropdown, FollowupDate, Notes textarea)
- [x] Populate "AssignedTo" dropdown based on user role using API
- [x] Implement form validation with error display
- [x] Create `leadService.ts` in `/frontend/src/services/` with createLead API call
- [x] Handle success: Show toast notification, close modal, refresh parent page
- [x] Make modal reusable from Dashboard, All Leads, My Leads, Upcoming Follow-ups pages

### Phase 3.3: Edit Lead Backend

- [x] Implement `GET /api/leads/{id}` endpoint in LeadController
- [x] Implement `PUT /api/leads/{id}` endpoint
- [x] Add authorization: Admin sees all leads, Manager sees team leads, Team Member sees own leads
- [x] Update UpdatedDate and UpdatedByUserId
- [x] If LeadStatusId changes, update StatusUpdateDate
- [x] Return updated lead

### Phase 3.4: Edit Lead Frontend

- [x] Reuse `AddLeadModal.tsx` component with edit mode prop
- [x] Pre-populate all form fields with existing lead data
- [x] Make CreatedDate and CreatedBy fields read-only
- [x] Add updateLead API call to leadService
- [x] Handle success: Show toast, close modal, refresh parent view

### Phase 3.5: Assign Leads Backend

- [x] Implement `GET /api/leads/unassigned` endpoint (Admin/Manager only)
- [x] Filter leads where AssignedToUserId IS NULL and match companyId
- [x] Support query parameters: page, pageSize, sortBy, sortDirection
- [x] Support filters: dateRange, leadStatus, leadSource, interestedIn, urgencyLevel
- [x] Return paginated results with total count
- [x] Implement `PUT /api/leads/bulk-assign` endpoint
- [x] Accept array of leadIds and targetUserId
- [x] Update AssignedToUserId for all specified leads

### Phase 3.6: Assign Leads Frontend

- [x] Create `AssignLeads.tsx` in `/frontend/src/pages/` (visible to Admin/Manager only)
- [x] Display data grid with columns: ClientName, Company, LeadDate, LeadSource, InterestedIn, Status, Urgency, FollowupDate, ExpectedBudget, CreatedBy
- [x] Implement column show/hide toggle
- [x] Add sorting capability (click column header)
- [x] Create filter panel with: Date range picker, LeadStatus multi-select, LeadSource multi-select, InterestedIn text search, UrgencyLevel multi-select
- [x] Implement pagination controls (10, 25, 50 rows per page)
- [x] Add inline edit for "AssignedTo" column with user dropdown
- [x] Add checkbox selection for rows
- [x] Add "Bulk Assign" button that opens modal to select user
- [x] Add bulkAssign API call to leadService
- [x] Show success notification after assignment

### Phase 3.7: My Leads Backend

- [x] Implement `GET /api/lead/my-leads` endpoint
- [x] Filter leads where AssignedToUserId = current user from JWT
- [x] Support comprehensive filtering: date ranges, budget range, categories, search
- [x] Support pagination, sorting on multiple columns
- [x] Return lead status distribution data for chart
- [x] Proper data mapping with related entities

### Phase 3.8: My Leads Frontend

- [x] Create `MyLeads.tsx` in `/frontend/src/pages/`
- [x] Display data grid with all lead columns (enhanced with budget, interests, notes, created date)
- [x] Add comprehensive filter panel: Multiple date ranges, budget range, categories, search
- [x] Implement sorting on all sortable columns and pagination
- [x] Add "Add Lead" button at top
- [x] Display status distribution chart using recharts library
- [x] Add quick action buttons per row: View, Edit, Update Status
- [x] Add getMyLeads API call to leadService with enhanced filtering

### Phase 3.9: All Leads Backend

- [x] Implement `GET /api/leads/all` endpoint (Admin: all company leads, Manager: team leads only)
- [x] Support advanced filtering, sorting, search across multiple fields
- [x] Implement `PUT /api/leads/bulk-update-status` endpoint
- [x] Implement `GET /api/leads/export` endpoint returning CSV/Excel file

### Phase 3.10: All Leads Frontend

- [x] Create `AllLeads.tsx` in `/frontend/src/pages/` (Admin/Manager only)
- [x] Display comprehensive data grid with all columns
- [x] Add search box for ClientName, Company, Email, Mobile
- [x] Add advanced filter panel with all available filters
- [x] Add checkbox selection for bulk operations
- [x] Implement bulk actions dropdown: Bulk Reassign, Bulk Status Update
- [x] Add "Export to Excel" button
- [x] Show lead source analytics pie chart at top
- [x] Add quick action buttons per row: Edit, Change Status, Reassign
- [x] Add getAllLeads, bulkUpdateStatus, exportLeads API calls to leadService

### Phase 3.11: Upcoming Follow-ups Backend

- [x] Implement `GET /api/leads/upcoming-followups` endpoint
- [x] Filter leads where FollowupDate IS NOT NULL AND FollowupDate <= TODAY + 7 days
- [x] Filter by companyId and based on user role (Team Member: own leads, Manager: team leads, Admin: all)
- [x] Sort by FollowupDate ascending
- [x] Implement `PUT /api/leads/{id}/reschedule-followup` endpoint
- [x] Implement `PUT /api/leads/{id}/add-note` endpoint

### Phase 3.12: Upcoming Follow-ups Frontend

- [x] Create `UpcomingFollowups.tsx` in `/frontend/src/pages/`
- [x] Display grid with columns: ClientName, Company, LeadStatus, FollowupDate, Notes, AssignedTo
- [x] Highlight overdue rows (FollowupDate < Today) with red background
- [x] Add "Reschedule" button opening date picker modal
- [x] Add "Add Note" button opening text input modal
- [x] Add "Mark Complete" button to update lead status
- [x] Show count badges: Overdue Follow-ups (red), Upcoming Follow-ups (blue)
- [x] Add getUpcomingFollowups, rescheduleFollowup, addNote API calls to leadService

---

## 📈 PHASE 4: Dashboard & Analytics

### Phase 4.1: Dashboard Backend

- [x] Create `DashboardController.cs` in `/backend/Controllers/`
- [x] Implement `GET /api/dashboard/stats` endpoint
- [x] Calculate and return: Total Leads count, Unassigned Leads count, Today's Follow-ups count, Conversion Rate percentage
- [x] Filter all metrics by current user's companyId
- [x] Implement `GET /api/dashboard/recent-leads` endpoint (last 5 created leads)
- [x] Implement `GET /api/dashboard/upcoming-followups` endpoint (next 2 days)

### Phase 4.2: Dashboard Frontend

- [x] Create `Dashboard.tsx` in `/frontend/src/pages/`
- [x] Display welcome message with user's full name and role
- [x] Create 4 stat cards using Bootstrap cards: Total Leads, Unassigned Leads, Today's Follow-ups, Conversion Rate
- [x] Display "Recent Leads" table showing last 5 leads with columns: Client Name, Company, Lead Date, Status
- [x] Display "Upcoming Follow-ups" table for next 2 days with columns: Client Name, Follow-up Date, Status
- [x] Add prominent "Add Lead" floating action button (FAB) at bottom-right
- [x] Add quick navigation links to: My Leads, All Leads, Assign Leads, Upcoming Follow-ups
- [x] Create `dashboardService.ts` in `/frontend/src/services/` with API calls

### Phase 4.3: Conversion Report Backend

- [x] Create `ReportsController.cs` in `/backend/Controllers/`
- [x] Implement `GET /api/reports/conversion` endpoint
- [x] Accept query parameters: dateFrom, dateTo, leadSourceId, assignedUserId
- [x] Calculate funnel metrics: Total Leads → Contacted → Meeting Scheduled → Demo Done → Proposal Sent → Converted
- [x] Calculate conversion rate % at each stage
- [x] Calculate average days to conversion
- [x] Identify top 5 performing lead sources by conversion rate
- [x] Return structured data for frontend charts

### Phase 4.4: Conversion Report Frontend

- [x] Create `ConversionReport.tsx` in `/frontend/src/pages/`
- [x] Add filter panel with: Date range picker (from/to), Lead Source multi-select dropdown, Assigned User dropdown
- [x] Display funnel chart using recharts library showing stage-by-stage conversion
- [x] Show conversion rate % between each stage
- [x] Display key metrics cards: Overall Conversion Rate, Average Days to Conversion, Total Converted Leads
- [x] Display "Top Performing Lead Sources" table
- [x] Add reportService.ts with getConversionReport API call

### Phase 4.5: Win vs Lost Report Backend

- [x] Implement `GET /api/reports/win-loss` endpoint in ReportsController
- [x] Accept filters: dateFrom, dateTo, leadSourceId, leadOwnerId
- [x] Calculate: Total Leads, Won Leads (Status = Converted), Lost Leads (Status = Lost)
- [x] Calculate win rate % and loss rate %
- [x] Group results by LeadSource and UrgencyLevel
- [x] Calculate weekly/monthly trends over selected date range
- [x] Return data for pie charts and bar charts

### Phase 4.6: Win vs Lost Report Frontend

- [x] Create `WinLossReport.tsx` in `/frontend/src/pages/`
- [x] Add filter panel: Date range, Lead Source, Lead Owner
- [x] Display win/loss pie chart using recharts
- [x] Display "Win/Loss by Lead Source" bar chart
- [x] Display "Win/Loss by Urgency Level" bar chart
- [x] Show key metrics cards: Win Rate %, Loss Rate %, Total Won, Total Lost
- [x] Display trends over time line chart (weekly or monthly based on date range)
- [x] Add getWinLossReport API call to reportService

### Phase 4.7: Additional Analytics Backend

- [x] Implement `GET /api/reports/leads-by-source` endpoint
- [x] Implement `GET /api/reports/leads-by-status` endpoint
- [x] Implement `GET /api/reports/leads-by-urgency` endpoint
- [x] Implement `GET /api/reports/team-performance` endpoint
- [x] Return data: leads assigned count, converted count, average conversion time per team member

### Phase 4.8: Additional Analytics Frontend

- [x] Create `AdditionalReports.tsx` in `/frontend/src/pages/`
- [x] Display "Leads by Source" pie chart
- [x] Display "Leads by Status" horizontal bar chart
- [x] Display "Leads by Urgency Level" bar chart
- [x] Display "Team Performance" table with columns: Team Member, Leads Assigned, Converted, Avg Conversion Time
- [x] Add corresponding API calls to reportService

---

## ⚙️ PHASE 5: Settings & System Administration

### Phase 5.1: Company Settings Backend

- [x] Create `SettingsController.cs` in `/backend/Controllers/`
- [x] Implement `GET /api/settings/company` endpoint (Admin only)
- [x] Implement `PUT /api/settings/company` endpoint
- [x] Add logo upload handling (save to /wwwroot/uploads/logos/ or cloud storage)
- [x] Return updated company details

### Phase 5.2: Company Settings Frontend

- [x] Create `Settings.tsx` in `/frontend/src/pages/` with tab navigation
- [x] Tab 1: Company Settings form with fields: Company Name, Logo, Website, Industry, Phone
- [x] Implement logo upload with image preview
- [x] Show current logo if exists
- [x] Add "Save Changes" button
- [x] Create `settingsService.ts` with getCompanySettings and updateCompanySettings API calls

### Phase 5.3: Manage Lead Sources Backend

- [x] Implement `GET /api/settings/lead-sources` endpoint
- [x] Implement `POST /api/settings/lead-sources` endpoint
- [x] Implement `PUT /api/settings/lead-sources/{id}` endpoint
- [x] Implement `DELETE /api/settings/lead-sources/{id}` endpoint (soft delete - set IsActive = false)
- [x] Filter by current user's companyId

### Phase 5.4: Manage Lead Sources Frontend

- [x] Tab 2: Lead Sources in Settings page
- [x] Display grid/table with columns: Name, Active Status, Actions
- [x] Add "Add New Source" button at top
- [x] Implement inline edit for name field
- [x] Add activate/deactivate toggle switch
- [x] Add delete button with confirmation dialog
- [x] Add API calls to settingsService

### Phase 5.5: Manage Lead Statuses Backend

- [x] Implement `GET /api/settings/lead-statuses` endpoint
- [x] Implement `POST /api/settings/lead-statuses` endpoint
- [x] Implement `PUT /api/settings/lead-statuses/{id}` endpoint
- [x] Support DisplayOrder field for custom ordering
- [x] Implement `DELETE /api/settings/lead-statuses/{id}` endpoint (soft delete)
- [x] Implement `PUT /api/settings/lead-statuses/reorder` endpoint for bulk order update

### Phase 5.6: Manage Lead Statuses Frontend

- [x] Tab 3: Lead Statuses in Settings page
- [x] Display grid/table with columns: Name, Display Order, Active Status, Actions
- [x] Add drag-and-drop reordering using react-beautiful-dnd or similar library
- [x] Add "Add New Status" button
- [x] Implement inline edit for name and display order
- [x] Add delete button with confirmation
- [x] Save new order when drag-and-drop completes

### Phase 5.7A: Reprioritize - Lead Import (Excel) Frontend

- [x] Insert "Import Leads from Excel" + "Import History" tasks above Urgency Levels tasks (per stakeholder request)

### Phase 5.7B: Import Leads from Excel (Frontend)

- [x] Create "Import Leads" UI that uploads an Excel file to backend import API
- [x] Show progress bar during import and disable actions while import is in progress
- [x] After completion, display:
  - Total leads in file
  - Successfully imported leads count
  - Leads rejected due to duplicate detection (list with name & phone)
- [x] Do NOT implement duplicate detection logic in the frontend (use backend response only)

### Phase 5.7B2: Align Frontend TODO with Async Import Backend

- [x] Update Phase 5.7B/5.7C tasks to match new backend endpoints: template download, async start, progress polling, history + details

### Phase 5.7B3: Import Leads from Excel (Frontend) - Async Workflow + Template

- [x] Add "Download Excel Template" button using `GET /api/lead-imports/template` (download .xlsx)
- [x] ✅ Sidebar: Move "Import Leads" link second last (after "Manage Users" and before "Settings")
- [x] ✅ Start import using `POST /api/lead-imports` (multipart/form-data, field name: `file`) and capture `leadImportId`
- [x] Show progress bar driven by polling `GET /api/lead-imports/{id}/progress` (status, processed/total, percent, counts)
- [x] Disable all actions while status is Queued/Processing
- [x] On completion, fetch final details via `GET /api/lead-imports/{id}` and display backend summary + rejected duplicate rows
- [x] Do NOT implement duplicate detection logic in the frontend (render backend `LeadImportRejectedRow` only)

### Phase 5.7C: Import History (Frontend)

- [x] ✅ Add Import History screen (read-only) using `GET /api/lead-imports`
- [x] ✅ Display previous imports (file name, date, status, counts)
- [x] ✅ Add details view (modal or page) using `GET /api/lead-imports/{id}` including rejected rows list (row number + name + phone + reason)
- [x] ✅ Fetch only from backend APIs (no local storage / no frontend business logic)
- [x] ✅ Add "Download rejected rows" button on Import Details using `GET /api/lead-imports/{id}/rejected-rows/excel` (download blob)

### Phase 5.7: Manage Urgency Levels Backend

- [ ] Implement `GET /api/settings/urgency-levels` endpoint
- [ ] Implement `POST /api/settings/urgency-levels` endpoint
- [ ] Implement `PUT /api/settings/urgency-levels/{id}` endpoint
- [ ] Implement `DELETE /api/settings/urgency-levels/{id}` endpoint
- [ ] Support DisplayOrder field

### Phase 5.8: Manage Urgency Levels Frontend

- [ ] Tab 4: Urgency Levels in Settings page
- [ ] Display grid similar to Lead Statuses
- [ ] Add CRUD operations and reordering functionality

### Phase 5.9: Email Configuration Backend

- [x] Create `EmailSettings` model in `/backend/Models/`
- [x] Implement `GET /api/settings/email` endpoint
- [x] Implement `PUT /api/settings/email` endpoint
- [x] Encrypt SMTP password before storing in database
- [x] Implement `POST /api/settings/email/test` endpoint to send test email

### Phase 5.10: Email Configuration Frontend

- [x] Tab 5: Email Settings in Settings page
- [x] Form fields: SMTP Host, Port, Username, Password (type=password), From Email, From Name, Enable SSL checkbox
- [x] Add "Test Email" button that sends test email to current user's email
- [x] Add "Save Email Settings" button
- [x] Show success/error message after test email

---

## 🎨 PHASE 6: UI/UX Enhancements & Polish

### Phase 6.1: Responsive Design

- [ ] Review all pages on mobile devices (320px, 375px, 768px widths)
- [ ] Ensure all data grids stack properly on mobile with horizontal scroll if needed
- [ ] Make navigation sidebar collapsible on mobile with hamburger menu
- [ ] Ensure all modals are mobile-friendly
- [ ] Test all forms on tablet and mobile devices

### Phase 6.2: Loading States & Skeletons

- [ ] Add loading spinners to all API calls
- [ ] Create skeleton loaders for data grids
- [ ] Add loading states to buttons during form submission
- [ ] Show "Loading..." text or spinner in dashboard stat cards while fetching data

### Phase 6.3: Error Handling & Validation

- [ ] Display user-friendly error messages for all failed API calls
- [ ] Show validation errors inline on all forms
- [ ] Add field-level validation messages (email format, required fields, password strength)
- [ ] Create error pages: 404 Not Found, 500 Server Error, 403 Forbidden

### Phase 6.4: User Experience Improvements

- [ ] Add confirmation dialogs for destructive actions (delete lead, delete user, deactivate account)
- [ ] Add "Are you sure?" prompts before bulk operations
- [ ] Implement auto-save draft for Add Lead form (store in localStorage)
- [ ] Add breadcrumbs navigation on all pages
- [ ] Add tooltips for icon buttons
- [ ] Show record count on all data grids ("Showing 1-10 of 45 results")

### Phase 6.5: Accessibility

- [ ] Ensure all buttons have aria-labels
- [ ] Add keyboard navigation support (Tab, Enter, Escape)
- [ ] Ensure color contrast meets WCAG 2.1 AA standards
- [ ] Add alt text to all images
- [ ] Make all forms accessible with screen readers

### Phase 6.6: Performance Optimization

- [ ] Implement lazy loading for routes using React.lazy()
- [ ] Add pagination to all data grids (already in requirements, ensure implemented)
- [ ] Optimize images (compress logos, use WebP format)
- [ ] Add debounce to search inputs (wait 300ms after user stops typing)
- [ ] Cache dropdown options (Lead Sources, Lead Statuses, Users) in context

### Phase 6.7: Final Touches

- [ ] Add favicon and app logo
- [ ] Update page titles for each route
- [ ] Add empty states for pages with no data ("No leads found. Add your first lead!")
- [ ] Add success animations (checkmark animation after form submission)
- [ ] Polish button styles, colors, and spacing throughout the app
- [ ] Add dark mode toggle (optional enhancement)

---

## ✅ Project Completion Checklist

### Backend Checklist

- [ ] All API endpoints implemented and documented
- [ ] JWT authentication working correctly
- [ ] Role-based authorization enforced on all endpoints
- [ ] Database migrations applied successfully
- [ ] Seed data created for all catalog tables
- [ ] Email service configured and sending emails
- [ ] Error handling middleware catching all exceptions
- [ ] CORS configured for frontend URL

### Frontend Checklist

- [ ] All pages created and routing working
- [ ] Authentication flow complete (register, login, OTP, logout)
- [ ] Add/Edit Lead functionality working
- [ ] All lead management pages functional (My Leads, All Leads, Assign Leads, Upcoming Follow-ups)
- [ ] Dashboard displaying correct statistics
- [ ] Reports showing charts and data correctly
- [ ] Settings pages allowing configuration changes
- [ ] Responsive design working on mobile, tablet, desktop
- [ ] Error handling displaying user-friendly messages
- [ ] Loading states implemented throughout

### Documentation Checklist

- [ ] README.md with setup instructions completed
- [ ] Environment variables documented
- [ ] Database connection string instructions added
- [ ] API endpoint documentation (optional: Swagger/OpenAPI)
- [ ] User role permissions documented

---

## 📝 Important Notes & Clarifications

### Database Model Specifications

**User Model - Manager Assignment:**

- The `User.cs` model includes a `ManagerId` field (FK to User, nullable) to support the Admin/Manager/Team Member hierarchy
- Company Admins can assign managers to team members
- Managers can view and manage leads for their assigned team members

**User Model - SSO Integration:**

- The `User.cs` model includes `IsSSOUser` (boolean), `SSOProvider` (string, nullable), and `SSOProviderId` (string, nullable)
- `PasswordHash` is nullable to support SSO users who don't have passwords
- SSO users authenticate via Google OAuth and are identified by their SSOProviderId
- Traditional users have PasswordHash and IsSSOUser=false

**Lead Model - Referred By Field:**

- The `Lead.cs` model includes a `ReferredBy` field (string, nullable)
- This field should only be displayed in the UI when LeadSource = "Referral"
- Backend validation should allow this field to be empty for non-referral sources

### SSO Implementation Details

**Google OAuth 2.0:**

- Primary SSO provider for Phase 1
- Users can register and login using their Google accounts
- No password required for SSO users
- Architecture is extensible for adding other SSO providers (Microsoft, Facebook, etc.) in future phases

**SSO Flow:**

1. User clicks "Sign in with Google" on login page
2. Frontend redirects to Google OAuth consent screen
3. Google returns authorization code
4. Frontend sends code to backend `/api/auth/google-login` endpoint
5. Backend validates token with Google
6. Backend creates/updates user record with SSO details
7. Backend returns JWT token for application authentication
8. User is logged in and redirected to Dashboard

---

## 📝 Notes for Cursor AI

- **Always ask for user confirmation** before starting each Phase task
- **Mark tasks as complete** with ✅ after finishing
- **Stop immediately** if any error occurs and notify the user
- **Maintain consistent code style** throughout the project
- **Follow the folder structure** specified in this document
- **Do not skip tasks** - complete them in exact order
- **Test functionality** as you build (manual verification)
- **Commit code regularly** (user will handle Git operations)

---

**END OF TODO DOCUMENT**
