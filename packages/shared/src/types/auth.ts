/** POST /auth/register — shared contract */
export interface RegisterDto {
  email: string;
  name: string;
  password: string;
}

/** POST /auth/login — shared contract */
export interface LoginDto {
  email: string;
  password: string;
}

/** Response from POST /auth/register */
export interface RegisterResponseDto {
  id: number;
  email: string;
}

/** Response from POST /auth/login */
export interface LoginResponseDto {
  accessToken: string;
  id: number;
  email: string;
  name: string;
}
