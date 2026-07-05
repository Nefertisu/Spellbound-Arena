import type {
  CreateCharacterDto as CreateCharacterDtoContract,
  CharacterAttributes as CharacterAttributesContract,
} from '@spellbound/shared';
import { IsNumber, IsString, MinLength } from 'class-validator';
import { NUMBER_OF_INITIAL_ATTRIBUTES } from 'src/common/constants/attributes';
import { MIN_NAME_SYMBOL_LIMIT } from 'src/common/constants/character';
import { SumRange } from 'src/common/validators/sum-range.decorator';

export class CharacterAttributes implements CharacterAttributesContract {
  @IsNumber()
  agility: number = 0;
  @IsNumber()
  strength: number = 0;
  @IsNumber()
  intelligence: number = 0;
  @IsNumber()
  fury: number = 0;
  @IsNumber()
  statusResistance: number = 0;
  @IsNumber()
  pushResistance: number = 0;
}

export class CreateCharacterDto implements CreateCharacterDtoContract {
  @IsString()
  @MinLength(MIN_NAME_SYMBOL_LIMIT)
  name!: string;
  @SumRange({
    max: NUMBER_OF_INITIAL_ATTRIBUTES,
    min: NUMBER_OF_INITIAL_ATTRIBUTES,
  })
  attributes!: CharacterAttributes;
}
