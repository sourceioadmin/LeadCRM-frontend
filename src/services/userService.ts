import api from './api';

export interface InviteUserData {
  email: string;
  userRoleId: number;
}

export interface InviteUserResponse {
  success: boolean;
  message: string;
  data?: {
    invitationId: number;
    email: string;
    expiryDate: string;
  };
  errors?: string[];
}

/**
 * Invite a new user to the company
 */
export const inviteUser = async (data: InviteUserData): Promise<InviteUserResponse> => {
  const response = await api.post<InviteUserResponse>('/user/invite', data);
  return response.data;
};

export interface User {
  userId: number;
  fullName: string;
  email: string;
  username: string;
  roleName: string;
  roleId: number;
  managerId?: number;
  managerName?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  isSSOUser: boolean;
  invitationStatus: 'pending' | 'accepted';
  expiryDate?: string;
  createdDate: string;
}

export interface UpdateUserData {
  userRoleId: number;
  managerId?: number;
}

export interface UsersResponse {
  success: boolean;
  message: string;
  data: User[];
  errors?: string[];
}

export interface UserResponse {
  success: boolean;
  message: string;
  data: User;
  errors?: string[];
}

export interface UpdateUserResponse {
  success: boolean;
  message: string;
  data: {
    userId: number;
    fullName: string;
    email: string;
    roleName: string;
    roleId: number;
    managerId?: number;
    managerName?: string;
  };
  errors?: string[];
}

export interface ToggleUserStatusResponse {
  success: boolean;
  message: string;
  data: {
    userId: number;
    fullName: string;
    email: string;
    isActive: boolean;
  };
  errors?: string[];
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
  data: {
    userId: number;
    email: string;
  };
  errors?: string[];
}

/**
 * Get all users in the company (Admin only)
 */
export const getUsers = async (): Promise<UsersResponse> => {
  const response = await api.get<UsersResponse>('/user');
  return response.data;
};

/**
 * Get user by ID (Admin only)
 */
export const getUserById = async (id: number): Promise<UserResponse> => {
  const response = await api.get<UserResponse>(`/user/${id}`);
  return response.data;
};

/**
 * Update user role and manager assignment (Admin only)
 */
export const updateUser = async (id: number, data: UpdateUserData): Promise<UpdateUserResponse> => {
  const response = await api.put<UpdateUserResponse>(`/user/${id}`, data);
  return response.data;
};

/**
 * Deactivate/Activate user (Admin only)
 */
export const toggleUserStatus = async (id: number): Promise<ToggleUserStatusResponse> => {
  const response = await api.put<ToggleUserStatusResponse>(`/user/${id}/deactivate`);
  return response.data;
};

/**
 * Reset user password (Admin only)
 */
export const resetUserPassword = async (id: number): Promise<ResetPasswordResponse> => {
  const response = await api.put<ResetPasswordResponse>(`/user/${id}/reset-password`);
  return response.data;
};

/**
 * Get current user profile
 */
export const getCurrentUserProfile = async (): Promise<UserResponse> => {
  const response = await api.get<UserResponse>('/user/profile');
  return response.data;
};

export default {
  inviteUser,
  getUsers,
  getUserById,
  updateUser,
  toggleUserStatus,
  resetUserPassword,
  getCurrentUserProfile
};

