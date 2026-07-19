import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CharacterDto,
  CreateCharacterDtoResponse,
  SelectCharacterDtoResponse,
} from '@spellbound/shared';
import { CreateCharacterDto } from './dto/character.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CharacterService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateCharacterDto,
    userId: number,
  ): Promise<CreateCharacterDtoResponse> {
    const found = await this.prisma.character.findFirst({
      where: {
        name: dto.name,
      },
    });

    if (found) throw new ConflictException('This name already taken');
    await this.prisma.character.create({
      data: {
        name: dto.name,
        userId: userId,
        attributes: {
          create: {
            agility: dto.attributes.agility,
            strength: dto.attributes.strength,
            intelligence: dto.attributes.intelligence,
            fury: dto.attributes.fury,
            statusResistance: dto.attributes.statusResistance,
            pushResistance: dto.attributes.pushResistance,
          },
        },
      },
    });

    return dto;
  }

  async getAll(userId: number): Promise<CharacterDto[]> {
    const characters = await this.prisma.character.findMany({
      where: {
        userId: userId,
      },
      select: {
        id: true,
        name: true,
        attributes: {
          select: {
            agility: true,
            strength: true,
            intelligence: true,
            fury: true,
            statusResistance: true,
            pushResistance: true,
          },
        },
      },
    });

    return characters as CharacterDto[];
  }

  async getSelected(userId: number): Promise<CharacterDto | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        selectedCharacter: {
          select: {
            id: true,
            name: true,
            attributes: {
              select: {
                agility: true,
                strength: true,
                intelligence: true,
                fury: true,
                statusResistance: true,
                pushResistance: true,
              },
            },
          },
        },
      },
    });

    if (!user?.selectedCharacter) return null;

    return user.selectedCharacter as CharacterDto;
  }

  async selectCharacter(
    userId: number,
    characterId: number,
  ): Promise<SelectCharacterDtoResponse> {
    const found = await this.prisma.character.findFirst({
      where: {
        id: characterId,
        userId,
      },
      select: {
        id: true,
        name: true,
        attributes: {
          select: {
            agility: true,
            strength: true,
            intelligence: true,
            fury: true,
            statusResistance: true,
            pushResistance: true,
          },
        },
      },
    });

    if (!found) {
      throw new NotFoundException('Character not found');
    }

    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        selectedCharacterId: characterId,
      },
    });

    return found as CharacterDto;
  }
}
