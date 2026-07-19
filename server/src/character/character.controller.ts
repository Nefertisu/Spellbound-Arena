import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CharacterService } from './character.service';
import type {
  CreateCharacterDtoResponse,
  CharacterDto,
  SelectCharacterDtoResponse,
  SelectedCharacterDtoResponse,
} from '@spellbound/shared';
import { CreateCharacterDto, SelectCharacterDto } from './dto/character.dto';
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
  getAll(@CurrentUser() user): Promise<CharacterDto[]> {
    return this.characterService.getAll(user.userId);
  }

  @Get('selected')
  @UseGuards(JwtAuthGuard)
  getSelected(@CurrentUser() user): Promise<SelectedCharacterDtoResponse> {
    return this.characterService.getSelected(user.userId);
  }

  @Post('select')
  @UseGuards(JwtAuthGuard)
  select(
    @Body() dto: SelectCharacterDto,
    @CurrentUser() user,
  ): Promise<SelectCharacterDtoResponse> {
    return this.characterService.selectCharacter(user.userId, dto.characterId);
  }
}
