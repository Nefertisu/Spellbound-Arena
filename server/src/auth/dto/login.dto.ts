import { PickType } from '@nestjs/mapped-types';
import { RegisterDto } from './auth.dto';
import type { LoginDto as LoginDtoContract } from '@spellbound/shared';

export class LoginDto
  extends PickType(RegisterDto, ['email', 'password'] as const)
  implements LoginDtoContract {}
