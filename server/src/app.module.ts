import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CharacterModule } from './character/character.module';
import { LobbyModule } from './lobby/lobby.module';
import { RoomModule } from './room/room.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    CharacterModule,
    LobbyModule,
    RoomModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
