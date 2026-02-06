export interface User {
  userId: number;
  companyId: number;
  fullName: string;
  email: string;
  username: string;
  userRoleId?: number;
  managerId?: number;
  isActive?: boolean;
  isSSOUser?: boolean;
  roleName?: string;
  companyName?: string;
  companyLogo?: string;
  // Some backend responses may return the company logo as `logo`
  logo?: string;
  company?: Company;
  createdDate?: string;
  updatedDate?: string;
}

export interface UserRole {
  roleId: number;
  roleName: string;
  isActive: boolean;
  createdDate: string;
  updatedDate?: string;
}

export interface Company {
  companyId: number;
  companyName: string;
  industry?: string;
  size?: string;
  website?: string;
  phone?: string;
  logo?: string;
  createdDate: string;
  updatedDate?: string;
}
