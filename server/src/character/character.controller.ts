import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CharacterService } from './character.service';
import type { CreateCharacterDtoResponse } from '@spellbound/shared';
import { CreateCharacterDto } from './dto/character.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('character')
export class CharacterController {
  constructor(private readonly characterService: CharacterService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  create(
    @Body() dto: CreateCharacterDto,
    @CurrentUser() user,
  ): Promise<CreateCharacterDtoResponse> {
    return this.characterService.create(dto, user.userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  getAll(@CurrentUser() user) {
    return this.characterService.getAll(user.userId);
  }
}
