import type { CharacterDto, CreateCharacterDto, CreateCharacterDtoResponse } from '@spellbound/shared';
import { apiGet, apiPost } from './http-client';

export const characterApi = {
  getAll(): Promise<CharacterDto[]> {
    return apiGet<CharacterDto[]>('/character');
  },

  create(body: CreateCharacterDto): Promise<CreateCharacterDtoResponse> {
    return apiPost<CreateCharacterDtoResponse>('/character/create', body);
  },
};
