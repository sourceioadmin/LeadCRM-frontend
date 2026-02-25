# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server at http://localhost:5173
npm run build     # Production build (drops console logs via esbuild)
npm run preview   # Preview production build
```

No lint or test scripts are configured.

## Environment Setup

Copy `env.example.txt` to `.env.local` and populate:

```
VITE_GOOGLE_CLIENT_ID=<google-oauth-client-id>
VITE_API_BASE_URL=http://localhost:5000/api   # optional, this is the default
```

Only `VITE_`-prefixed variables are exposed to client code.

## Architecture

### Tech Stack
- React 18 + TypeScript (strict mode) + Vite
- React Router v6 (BrowserRouter)
- React Bootstrap + Bootstrap 5 — primary UI/layout framework
- Axios with request/response interceptors (`src/services/api.ts`)
- React Context API for global state (no Redux)
- `lucide-react` for icons, `recharts` + `apexcharts` for charts
- `@react-oauth/google` for Google OAuth SSO

### Routing & Auth
- `src/App.tsx` — defines all routes; protected routes are wrapped in `<PrivateRoute>`
- `src/components/PrivateRoute.tsx` — checks `isAuthenticated` and `user.roleName`; accepts `requiredRole` (comma-separated string) or `requiredRoles` (array)
- `src/contexts/AuthContext.tsx` — stores JWT + user in `localStorage`; auto-validates token expiry on load; exposes `useAuth()` hook
- `src/utils/jwtUtils.ts` — client-side JWT decode/expiry helpers (no signature verification)
- 401 responses from the API automatically clear auth and redirect to `/login` via the axios interceptor

### Role-Based Access Control
Five roles control visibility and route access:

| Role | `userRoleId` |
|---|---|
| System Admin | 1 |
| Company Admin | 2 |
| Company Manager | 3 |
| Team Member | 4 |
| Referral Partner | 5 |

Sidebar items use `allowedRoleIds`, `requiredRole`, and `hiddenForRoles` fields. Pages use `<PrivateRoute requiredRole="...">`.

### API Layer
All API calls go through the configured axios instance in `src/services/api.ts`. Services in `src/services/` follow this pattern:

```typescript
export const createLead = async (data: CreateLeadRequest): Promise<ApiResponse<Lead>> => {
  const response = await api.post('/lead', data);
  return response.data;
};
```

Responses are always wrapped: `{ success: boolean, message: string, data?: T }`.

For file uploads, pass `FormData` directly — the interceptor removes `Content-Type` so Axios sets the correct multipart boundary automatically.

### Key Directories
- `src/services/` — one file per domain (`leadService`, `userService`, `reportService`, etc.)
- `src/pages/` — one file per route
- `src/components/` — shared/reusable components (`Layout`, `Sidebar`, `Navbar`, `AddLeadModal`, `Toast`, etc.)
- `src/types/` — TypeScript interfaces (`Lead.ts`, `User.ts`, `Reports.ts`)
- `src/styles/` — `theme.css` (CSS variables), `bootstrap-override.scss`, `components.css`

### Styling
All UI must follow the theme defined in `docs/modern_soft_theme_implementation.md`. Use CSS variables from `theme.css` and extend Bootstrap via `bootstrap-override.scss` and `components.css`. Design principles: generous padding, rounded corners, subtle shadows with teal tint.

### Toast Notifications
Use the `useToast()` hook (from `src/components/Toast.tsx`) for all user feedback:

```typescript
const { showSuccess, showError, showWarning, showInfo } = useToast();
```

### Forms
- Client-side validation with inline errors via `validationErrors` state
- Disable submit button and show spinner during API calls
- Clear errors when the user modifies the relevant field
