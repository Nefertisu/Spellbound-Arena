import type { LoginDto, RegisterDto } from '@spellbound/shared';
import { authApi } from '../api/auth.api';
import { ApiError } from '../api/http-client';
import type { AuthError, AuthResult } from '../types/auth';
import { mapLoginResponse } from '../types/auth';

function emptyFields(fields: Record<string, string>): AuthResult | null {
  if (Object.values(fields).some((value) => !value.trim())) {
    return {
      success: false,
      error: {
        code: 'empty_fields',
        message: 'Fill in all required fields.',
      },
    };
  }

  return null;
}

function mapApiError(error: unknown, fallback: string): AuthError {
  if (!(error instanceof ApiError)) {
    return { code: 'server_error', message: fallback };
  }

  const message = error.message || fallback;

  if (error.status === 401) {
    return { code: 'invalid_credentials', message };
  }
  if (error.status === 400) {
    return { code: 'validation_error', message };
  }
  if (error.status === 409 || message.toLowerCase().includes('already')) {
    return { code: 'email_taken', message };
  }
  if (error.status === 0) {
    return { code: 'server_error', message: 'Could not reach the server.' };
  }

  return { code: 'server_error', message };
}

export async function loginUser(request: LoginDto): Promise<AuthResult> {
  const email = request.email.trim();
  const password = request.password.trim();
  const validationError = emptyFields({ email, password });

  if (validationError) {
    validationError.error.message = 'Enter email and password.';
    return validationError;
  }

  try {
    const response = await authApi.login({ email, password });
    return { success: true, user: mapLoginResponse(response) };
  } catch (error) {
    return {
      success: false,
      error: mapApiError(error, 'Invalid email or password.'),
    };
  }
}

export async function registerUser(request: RegisterDto): Promise<AuthResult> {
  const email = request.email.trim();
  const name = request.name.trim();
  const password = request.password.trim();
  const validationError = emptyFields({ email, name, password });

  if (validationError) return validationError;

  try {
    await authApi.register({ email, name, password });
    return loginUser({ email, password });
  } catch (error) {
    return {
      success: false,
      error: mapApiError(error, 'Registration failed.'),
    };
  }
}
