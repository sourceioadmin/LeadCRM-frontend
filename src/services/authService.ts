import api from "./api";

export interface RegisterPayload {
  companyName: string;
  industry?: string;
  size?: string;
  website?: string;
  phone?: string;
  fullName: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export interface LoginPayload {
  emailOrUsername: string;
  password: string;
  rememberMe?: boolean;
}

export interface GoogleLoginPayload {
  token: string;
}

export interface RegisterInvitePayload {
  invitationToken: string;
  fullName: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export interface InvitationDetails {
  email: string;
  companyName: string;
  roleName: string;
  expiryDate: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const registerUser = (payload: RegisterPayload) => {
  return api.post("/auth/register", payload);
};

export const verifyOtp = (payload: VerifyOtpPayload) => {
  return api.post("/auth/verify-otp", payload);
};

export const resendOtp = (email: string) => {
  return api.post("/auth/resend-otp", { email, otp: "000000" }); // otp ignored server-side for resend
};

export const loginUser = (payload: LoginPayload) => {
  console.log('🔐 [authService] Login attempt:', {
    emailOrUsername: payload.emailOrUsername,
    passwordLength: payload.password?.length,
    rememberMe: payload.rememberMe
  });
  return api.post("/auth/login", payload);
};

export const googleLogin = (payload: GoogleLoginPayload) => {
  return api.post("/auth/google-login", payload);
};

export const getInvitationDetails = (token: string) => {
  return api.get(`/auth/invitation/${token}`);
};

export const registerInvite = (payload: RegisterInvitePayload) => {
  return api.post("/auth/register-invite", payload);
};

export const changePassword = (payload: ChangePasswordPayload) => {
  console.log('🌐 [authService] Making change password API call');
  console.log('📋 Payload:', {
    currentPasswordLength: payload.currentPassword?.length,
    newPasswordLength: payload.newPassword?.length,
    confirmPasswordLength: payload.confirmPassword?.length
  });

  return api.post("/auth/change-password", payload);
};

