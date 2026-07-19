import type {
  CharacterDto,
  CreateCharacterDto,
  CreateCharacterDtoResponse,
  SelectCharacterDto,
  SelectCharacterDtoResponse,
  SelectedCharacterDtoResponse,
} from '@spellbound/shared';
import { apiGet, apiPost } from './http-client';

export const characterApi = {
  getAll(): Promise<CharacterDto[]> {
    return apiGet<CharacterDto[]>('/character');
  },

  getSelected(): Promise<SelectedCharacterDtoResponse> {
    return apiGet<SelectedCharacterDtoResponse>('/character/selected');
  },

  create(body: CreateCharacterDto): Promise<CreateCharacterDtoResponse> {
    return apiPost<CreateCharacterDtoResponse>('/character/create', body);
  },

  select(body: SelectCharacterDto): Promise<SelectCharacterDtoResponse> {
    return apiPost<SelectCharacterDtoResponse>('/character/select', body);
  },
};
