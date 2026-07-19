import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import type { MatchMode } from '@spellbound/shared';
import { Server, Socket } from 'socket.io';
import { RoomService } from './room.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly roomService: RoomService) {}

  handleConnection(client: Socket) {
    client.emit('connected', { id: client.id });
  }

  handleDisconnect(client: Socket) {
    this.roomService.handleDisconnect(client.id, this.server);
  }

  @SubscribeMessage('room:search-game')
  handleSearchGame(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { mode: MatchMode; withBots: boolean; userId: number },
  ) {
    this.roomService.searchForLobby(
      client,
      data.mode,
      data.withBots,
      data.userId,
      this.server,
    );
  }
}
