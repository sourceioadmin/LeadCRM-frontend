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
  phoneNumber?: string;
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

export interface UserProfileData {
  userId: number;
  fullName: string;
  email: string;
  username: string;
  phoneNumber: string;
  companyId: number;
  companyName: string;
  roleName: string;
  roleId: number;
  managerId: number | null;
  isActive: boolean;
  isEmailVerified: boolean;
  isSSOUser: boolean;
  createdDate: string;
}

export interface UserProfileResponse {
  success: boolean;
  message: string;
  data: UserProfileData;
  errors?: string[];
}

export interface UpdateUserProfileData {
  fullName: string;
  phoneNumber: string;
}

/**
 * Get current user profile
 */
export const getCurrentUserProfile = async (): Promise<UserProfileResponse> => {
  const response = await api.get<UserProfileResponse>('/user/profile');
  return response.data;
};

/**
 * Update current user's own profile (fullName and phoneNumber)
 */
export const updateUserProfile = async (data: UpdateUserProfileData): Promise<UserProfileResponse> => {
  const response = await api.put<UserProfileResponse>('/user/profile', data);
  return response.data;
};

/**
 * Get all Referral Partners in the company
 * Uses dedicated endpoint accessible to all authenticated users (not admin-only)
 */
export const getReferralPartners = async (): Promise<UsersResponse> => {
  try {
    // Try the dedicated referral partners endpoint first
    const response = await api.get<UsersResponse>('/user/referral-partners');
    return response.data;
  } catch (error: any) {
    // Fallback to admin-only /user endpoint if referral-partners endpoint doesn't exist
    // This maintains backward compatibility during backend deployment
    console.warn('Referral partners endpoint not available, falling back to /user endpoint:', error.message);
    const fallbackResponse = await api.get<UsersResponse>('/user');
    if (fallbackResponse.data.success && fallbackResponse.data.data) {
      // Filter to only return active Referral Partners
      const referralPartners = fallbackResponse.data.data.filter(
        (user) => (user.roleName === 'Referral Partner' || user.roleId === 5) && user.isActive
      );
      return {
        ...fallbackResponse.data,
        data: referralPartners
      };
    }
    return fallbackResponse.data;
  }
};

export default {
  inviteUser,
  getUsers,
  getUserById,
  updateUser,
  toggleUserStatus,
  resetUserPassword,
  getCurrentUserProfile,
  updateUserProfile,
  getReferralPartners
};

