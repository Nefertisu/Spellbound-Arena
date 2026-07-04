import type {
  LoginDto,
  LoginResponseDto,
  RegisterDto,
  RegisterResponseDto,
} from '@spellbound/shared';
import { apiPost } from './http-client';

export const authApi = {
  login(body: LoginDto): Promise<LoginResponseDto> {
    return apiPost<LoginResponseDto>('/auth/login', body);
  },

  register(body: RegisterDto): Promise<RegisterResponseDto> {
    return apiPost<RegisterResponseDto>('/auth/register', body);
  },
};
