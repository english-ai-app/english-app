import {
  ApiClientError,
  requestApi,
  setAuthToken,
} from './api/apiClient';

export type AuthResponse = {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  username: string;
  roles: string[];
};

export type RegisterResponse = {
  userId: number;
  email: string;
  otpRequired: boolean;
  otpExpiresAt: string | null;
  message: string;
};

export type EmailVerificationRequired = {
  errorCode: string;
  email: string;
  canResend: boolean;
  otpExpiresAt: string | null;
  message: string;
};

type ApiEnvelope<T> = {
  code?: string;
  success?: boolean;
  message?: string;
  data?: T;
};

export type RegisterPayload = {
  fullName: string;
  email: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

const buildUsername = (email: string): string => {
  const [localPart] = email.trim().toLowerCase().split('@');
  const base = localPart.replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_');
  return (base || 'user').slice(0, 48);
};

const rememberToken = (response: AuthResponse): AuthResponse => {
  setAuthToken(response.accessToken);
  return response;
};

export const registerUser = async (
  payload: RegisterPayload,
): Promise<RegisterResponse> =>
  requestApi<RegisterResponse>({
    method: 'POST',
    url: '/api/auth/register',
    data: {
      email: payload.email.trim().toLowerCase(),
      username: buildUsername(payload.email),
      password: payload.password,
      displayName: payload.fullName.trim(),
    },
  });

export const loginUser = async (
  payload: LoginPayload,
): Promise<AuthResponse> => {
  const response = await requestApi<AuthResponse>({
    method: 'POST',
    url: '/api/auth/login',
    data: {
      username: payload.email.trim().toLowerCase(),
      password: payload.password,
    },
  });

  return rememberToken(response);
};

export const verifyEmailOtp = async (
  email: string,
  otp: string,
): Promise<AuthResponse> => {
  const response = await requestApi<AuthResponse>({
    method: 'POST',
    url: '/api/auth/verify-email',
    data: {
      email: email.trim().toLowerCase(),
      otp,
    },
  });

  return rememberToken(response);
};

export const resendEmailOtp = async (
  email: string,
): Promise<RegisterResponse> =>
  requestApi<RegisterResponse>({
    method: 'POST',
    url: '/api/auth/resend-otp',
    data: {
      email: email.trim().toLowerCase(),
    },
  });

export const getEmailVerificationRequired = (
  error: unknown,
): EmailVerificationRequired | null => {
  if (!(error instanceof ApiClientError)) {
    return null;
  }

  if (error.statusCode !== 410 && error.statusCode !== 412) {
    return null;
  }

  const details = error.details as
    | Partial<EmailVerificationRequired>
    | ApiEnvelope<Partial<EmailVerificationRequired>>
    | null;
  const payload = (
    details && 'data' in details && details.data ? details.data : details
  ) as Partial<EmailVerificationRequired> | null;

  if (!payload?.email) {
    return null;
  }

  return {
    errorCode: payload.errorCode || 'EMAIL_VERIFICATION_REQUIRED',
    email: payload.email,
    canResend: Boolean(payload.canResend),
    otpExpiresAt: payload.otpExpiresAt || null,
    message: payload.message || error.message,
  };
};
