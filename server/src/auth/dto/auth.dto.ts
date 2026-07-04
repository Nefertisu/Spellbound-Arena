import type { RegisterDto as RegisterDtoContract } from '@spellbound/shared';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto implements RegisterDtoContract {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(3)
  name!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
