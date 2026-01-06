# Modern Soft Theme - Complete Implementation Guide

## 🎨 Design System

### Color Palette

```css
/* Primary Colors */
--color-primary: #14B8A6;        /* Soft Teal */
--color-secondary: #6366F1;      /* Indigo */
--color-accent: #F59E0B;         /* Amber */

/* Background Colors */
--color-background: #FAFAFA;     /* Off-white background */
--color-surface: #FFFFFF;        /* Pure white for cards */

/* Text Colors */
--color-text-primary: #1E293B;   /* Dark slate */
--color-text-secondary: #94A3B8; /* Light slate */

/* Border & Divider Colors */
--color-border: #F1F5F9;         /* Very soft grey */
--color-divider: #E2E8F0;        /* Soft grey */

/* Status Colors */
--color-new: #10B981;            /* Green */
--color-contacted: #6366F1;      /* Indigo */
--color-proposal: #F59E0B;       /* Amber */
--color-qualified: #8B5CF6;      /* Purple */
--color-won: #22C55E;            /* Bright green */
--color-lost: #EF4444;           /* Red */

/* Shadow Values */
--shadow-sm: 0 1px 3px rgba(20, 184, 166, 0.08);
--shadow-md: 0 4px 16px rgba(20, 184, 166, 0.12);
--shadow-lg: 0 8px 24px rgba(20, 184, 166, 0.15);
--shadow-xl: 0 12px 32px rgba(20, 184, 166, 0.18);
```

### Typography

```css
/* Font Family */
--font-primary: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-secondary: 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */

/* Font Weights */
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

### Spacing & Borders

```css
/* Spacing Scale */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */

/* Border Radius */
--radius-sm: 0.375rem;  /* 6px */
--radius-md: 0.5rem;    /* 8px */
--radius-lg: 0.75rem;   /* 12px */
--radius-xl: 1rem;      /* 16px */
--radius-2xl: 1.5rem;   /* 24px */
--radius-full: 9999px;  /* Fully rounded */
```

---

## 📐 Component Specifications

### 1. Sidebar

```css
.sidebar {
  width: 260px;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  transition: transform 0.3s ease-in-out;
}

/* Collapsible behavior */
.sidebar.collapsed {
  transform: translateX(-220px);
  width: 80px;
}

.sidebar-logo {
  padding: var(--space-6);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--color-primary);
}

.sidebar-menu-item {
  padding: var(--space-4);
  margin: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  transition: all 0.2s;
}

.sidebar-menu-item:hover {
  background: rgba(20, 184, 166, 0.08);
  transform: translateX(4px);
}

.sidebar-menu-item.active {
  background: rgba(20, 184, 166, 0.15);
  color: var(--color-primary);
  font-weight: var(--font-semibold);
}
```

### 2. Top Bar

```css
.topbar {
  height: 70px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-6);
}

.topbar-search {
  flex: 1;
  max-width: 500px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  padding: var(--space-3) var(--space-5);
}

.topbar-actions {
  display: flex;
  gap: var(--space-4);
  align-items: center;
}
```

### 3. Kanban Cards (Floating Look)

```css
.kanban-card {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  margin-bottom: var(--space-4);
  box-shadow: var(--shadow-lg);
  transition: all 0.3s;
  cursor: grab;
}

.kanban-card:hover {
  box-shadow: var(--shadow-xl);
  transform: translateY(-4px);
}

.kanban-card:active {
  cursor: grabbing;
}

.kanban-card-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
}

.kanban-card-company {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-4);
}

.kanban-card-value {
  display: inline-block;
  background: rgba(20, 184, 166, 0.1);
  color: var(--color-primary);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-full);
  font-weight: var(--font-semibold);
  font-size: var(--text-base);
}
```

### 4. Data Tables

```css
.data-table {
  width: 100%;
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

.table-row {
  border-bottom: 1px solid var(--color-border);
  transition: background 0.2s;
}

.table-row:hover {
  background: rgba(20, 184, 166, 0.04);
}

.table-cell {
  padding: var(--space-4) var(--space-5);
  font-size: var(--text-sm);
}

/* Outline-style status badges */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  border: 1.5px solid;
}

.status-badge.new {
  border-color: var(--color-new);
  color: var(--color-new);
  background: rgba(16, 185, 129, 0.05);
}

.status-badge.contacted {
  border-color: var(--color-contacted);
  color: var(--color-contacted);
  background: rgba(99, 102, 241, 0.05);
}

.status-badge.proposal {
  border-color: var(--color-proposal);
  color: var(--color-proposal);
  background: rgba(245, 158, 11, 0.05);
}
```

### 5. Buttons

```css
.btn {
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-lg);
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
  transition: all 0.2s;
  cursor: pointer;
  border: none;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  box-shadow: var(--shadow-md);
}

.btn-primary:hover {
  background: #0D9488;
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.btn-secondary {
  background: var(--color-surface);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background: var(--color-background);
  border-color: var(--color-primary);
}
```

### 6. Forms & Inputs

```css
.form-group {
  margin-bottom: var(--space-5);
}

.form-label {
  display: block;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
}

.form-input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
}
```

### 7. Cards & Containers

```css
.card {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  box-shadow: var(--shadow-md);
}

.card-header {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-4);
}

.card-body {
  color: var(--color-text-secondary);
  line-height: var(--leading-relaxed);
}
```

---

## 🚀 React + Bootstrap Implementation

### Install Required Packages

```bash
npm install bootstrap react-bootstrap
npm install @popperjs/core
npm install react-beautiful-dnd  # For Kanban drag & drop
```

### Main CSS File (src/styles/theme.css)

```css
/* Import Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Nunito:wght@300;400;600;700&display=swap');

/* Root Variables */
:root {
  /* Colors */
  --color-primary: #14B8A6;
  --color-secondary: #6366F1;
  --color-accent: #F59E0B;
  --color-background: #FAFAFA;
  --color-surface: #FFFFFF;
  --color-text-primary: #1E293B;
  --color-text-secondary: #94A3B8;
  --color-border: #F1F5F9;
  
  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(20, 184, 166, 0.08);
  --shadow-md: 0 4px 16px rgba(20, 184, 166, 0.12);
  --shadow-lg: 0 8px 24px rgba(20, 184, 166, 0.15);
  --shadow-xl: 0 12px 32px rgba(20, 184, 166, 0.18);
  
  /* Typography */
  --font-primary: 'Poppins', sans-serif;
  --font-secondary: 'Nunito', sans-serif;
  
  /* Border Radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.5rem;
}

/* Global Styles */
body {
  font-family: var(--font-primary);
  background: var(--color-background);
  color: var(--color-text-primary);
}

/* Override Bootstrap with Modern Soft theme */
.btn-primary {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  border-radius: var(--radius-lg);
  font-weight: 600;
}

.btn-primary:hover {
  background-color: #0D9488;
  border-color: #0D9488;
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.card {
  border: none;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
}

.form-control {
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}

.form-control:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 0.2rem rgba(20, 184, 166, 0.15);
}
```

### Bootstrap Theme Override (src/styles/bootstrap-override.scss)

```scss
// Custom Bootstrap theme variables
$primary: #14B8A6;
$secondary: #6366F1;
$success: #10B981;
$warning: #F59E0B;
$danger: #EF4444;

$body-bg: #FAFAFA;
$body-color: #1E293B;

$font-family-sans-serif: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

$border-radius: 0.75rem;
$border-radius-lg: 1rem;
$border-radius-sm: 0.5rem;

$box-shadow: 0 4px 16px rgba(20, 184, 166, 0.12);
$box-shadow-sm: 0 1px 3px rgba(20, 184, 166, 0.08);
$box-shadow-lg: 0 8px 24px rgba(20, 184, 166, 0.15);

// Import Bootstrap
@import 'bootstrap/scss/bootstrap';
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile First Approach */

/* Small devices (landscape phones, 576px and up) */
@media (min-width: 576px) {
  .sidebar {
    width: 260px;
  }
}

/* Medium devices (tablets, 768px and up) */
@media (min-width: 768px) {
  .kanban-column {
    flex: 0 0 calc(50% - 12px);
  }
}

/* Large devices (desktops, 992px and up) */
@media (min-width: 992px) {
  .kanban-column {
    flex: 0 0 calc(25% - 12px);
  }
}

/* Extra large devices (large desktops, 1200px and up) */
@media (min-width: 1200px) {
  .container-fluid {
    max-width: 1400px;
  }
}

/* Mobile sidebar behavior */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: -260px;
    z-index: 1000;
    transition: left 0.3s;
  }
  
  .sidebar.open {
    left: 0;
  }
  
  .sidebar-overlay {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }
}
```

---

## 🎯 Key Design Principles

### 1. **Generous Padding**
- Cards: 24px (var(--space-6))
- Buttons: 12px 24px
- Forms: 12px 16px

### 2. **Rounded Corners Everywhere**
- Small elements: 8px-12px
- Cards: 16px-24px
- Full rounded: Pills and badges

### 3. **Subtle Shadows with Teal Tint**
- Use rgba(20, 184, 166, opacity) for all shadows
- Increases on hover for depth

### 4. **Minimal Borders**
- Use very soft grey (#F1F5F9)
- Prefer shadows over borders when possible

### 5. **Hover Effects**
- Slight color shift
- Transform translateY(-2px to -4px)
- Increase shadow

### 6. **Status Visualization**
- Outline-style badges (not filled)
- Use border + light background

---

## 📦 Component Examples

### Invite Screen Styling

```css
.invite-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #14B8A6 0%, #6366F1 100%);
}

.invite-card {
  background: var(--color-surface);
  border-radius: var(--radius-2xl);
  padding: var(--space-10);
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.company-logo {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-xl);
  margin: 0 auto var(--space-6);
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(20, 184, 166, 0.1);
}

.invite-heading {
  text-align: center;
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-3);
}

.invite-subheading {
  text-align: center;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-8);
}
```

---

## ✅ Implementation Checklist

- [ ] Install Poppins and Nunito fonts
- [ ] Set up CSS custom properties
- [ ] Override Bootstrap theme variables
- [ ] Create sidebar component with collapse functionality
- [ ] Implement Kanban cards with floating shadow effect
- [ ] Style data tables with hover effects
- [ ] Create outline-style status badges
- [ ] Add responsive breakpoints
- [ ] Test on mobile devices
- [ ] Implement dark mode toggle (optional)

---

## 🔗 Quick Start

1. Copy all CSS variables to your main CSS file
2. Import Google Fonts in index.html or CSS
3. Override Bootstrap variables before importing Bootstrap
4. Apply classes to your React components
5. Test responsiveness across devices

**Your Modern Soft theme is ready to implement! 🎨✨**