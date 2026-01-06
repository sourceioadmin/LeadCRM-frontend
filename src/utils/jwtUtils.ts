/**
 * JWT utility functions for token validation and decoding
 */

export interface JwtPayload {
  sub: string;
  email: string;
  companyId: string;
  roleId: string;
  roleName: string;
  exp: number;
  iat: number;
  jti: string;
  rememberMe?: string;
}

/**
 * Decode JWT token without verification (for client-side use only)
 * WARNING: This does not verify the token signature - only use for UI state management
 */
export const decodeJwtToken = (token: string): JwtPayload | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
};

/**
 * Check if JWT token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeJwtToken(token);
  if (!decoded || !decoded.exp) {
    return true; // Consider invalid tokens as expired
  }

  // exp is in seconds, Date.now() is in milliseconds
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
};

/**
 * Get token expiry time in milliseconds
 */
export const getTokenExpiryTime = (token: string): number | null => {
  const decoded = decodeJwtToken(token);
  return decoded?.exp ? decoded.exp * 1000 : null;
};