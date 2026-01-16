import React from 'react';
import { Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  UserCheck,
  Calendar,
  Settings,
  BarChart3,
  Plus,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface MenuItem {
  path: string;
  icon: React.ComponentType<any>;
  label: string;
  altLabel?: { [roleName: string]: string };
  allowedRoleIds?: number[];
  requiredRole?: string;
  hiddenForRoles?: string[];
}

interface SidebarProps {
  collapsed: boolean;
  isMobile: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, isMobile, onClose }) => {
  const { user } = useAuth();

  const menuItems: MenuItem[] = [
    // Dashboard - visible to all roles except Referral Partner
    { path: '/', icon: LayoutDashboard, label: 'Dashboard', hiddenForRoles: ['Referral Partner'] },

    // Add Lead - visible to Company Admin, Company Manager, Team Member and Referral Partner
    { path: '/add-lead', icon: Plus, label: 'Add Lead', allowedRoleIds: [2, 3, 4, 5] }, // Company Admin, Company Manager, Team Member and Referral Partner

    // My Leads - visible to all roles, but label changes for Referral Partner
    { path: '/my-leads', icon: FileText, label: 'My Leads', altLabel: { 'Referral Partner': 'My Referred Leads' } },

    // All Leads - visible to Managers and Admins (different scopes)
    { path: '/all-leads', icon: BarChart3, label: 'All Leads', allowedRoleIds: [1, 2, 3], hiddenForRoles: ['Referral Partner'] }, // System Admin, Company Admin and Company Manager

    // Assign Leads - visible to Managers and Admins
    { path: '/assign-leads', icon: UserCheck, label: 'Assign Leads', allowedRoleIds: [1, 2, 3], hiddenForRoles: ['Referral Partner'] }, // System Admin, Company Admin and Company Manager

    // Follow-ups - visible to all roles except Referral Partner
    { path: '/followups', icon: Calendar, label: 'Follow-ups', hiddenForRoles: ['Referral Partner'] },

    // Reports - visible to all roles except Referral Partner
    { path: '/reports', icon: TrendingUp, label: 'Reports', hiddenForRoles: ['Referral Partner'] },

    // Manage Users - Company Admin only
    { path: '/manage-users', icon: Users, label: 'Manage Users', requiredRole: 'Company Admin', hiddenForRoles: ['Referral Partner'] },

    // Settings - visible to all roles except Referral Partner
    { path: '/settings', icon: Settings, label: 'Settings', hiddenForRoles: ['Referral Partner'] },
  ];

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-logo">
        {!collapsed && !isMobile && 'Leadbox'}
        {!collapsed && isMobile && (
          <div className="d-flex justify-content-between align-items-center">
            <span>Leadbox</span>
            <button
              className="btn btn-link text-dark p-0 d-flex align-items-center justify-content-center"
              onClick={onClose}
              aria-label="Close menu"
              style={{ minWidth: '44px', minHeight: '44px', fontSize: '1.5rem' }}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      <Nav className="flex-column">
        {menuItems
          .filter((item) => {
            // Check if user has required role for specific items
            if (item.requiredRole) {
              // For Company Admin requirement, check userRoleId === 2
              if (item.requiredRole === 'Company Admin' && user?.userRoleId !== 2) {
                return false;
              }
              // For other role requirements, check roleName
              if (item.requiredRole !== 'Company Admin' && user?.roleName !== item.requiredRole) {
                return false;
              }
            }

            // Check allowed role IDs for specific inclusions
            if (item.allowedRoleIds && user?.userRoleId && !item.allowedRoleIds.includes(user.userRoleId)) {
              return false;
            }

            // Hide items for specific roles
            if (item.hiddenForRoles && user?.roleName && item.hiddenForRoles.includes(user.roleName)) {
              return false;
            }

            return true;
          })
          .map((item) => {
            const Icon = item.icon;
            // Use alternative label for specific roles if provided
            const displayLabel = item.altLabel && user?.roleName && item.altLabel[user.roleName]
              ? item.altLabel[user.roleName]
              : item.label;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-menu-item ${isActive ? 'active' : ''}`
                }
                onClick={isMobile ? onClose : undefined}
              >
                <Icon size={20} />
                {!collapsed && <span>{displayLabel}</span>}
              </NavLink>
            );
          })}
      </Nav>
    </div>
  );
};

export default Sidebar;
