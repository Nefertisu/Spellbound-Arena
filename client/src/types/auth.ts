import type { LoginResponseDto } from '@spellbound/shared';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  token: string;
}

export type AuthErrorCode =
  | 'empty_fields'
  | 'invalid_credentials'
  | 'email_taken'
  | 'validation_error'
  | 'server_error';

export interface AuthError {
  code: AuthErrorCode;
  message: string;
}

export type AuthResult =
  | { success: true; user: AuthUser }
  | { success: false; error: AuthError };

export function mapLoginResponse(response: LoginResponseDto): AuthUser {
  return {
    id: String(response.id),
    email: response.email,
    name: response.name,
    token: response.accessToken,
  };
}
