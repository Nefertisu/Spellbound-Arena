export interface QueuePlayer {
  socketId: string;
  userId: number;
}

export class MatchQueue {
  private readonly players: QueuePlayer[] = [];

  add(player: QueuePlayer): void {
    if (this.players.some((entry) => entry.socketId === player.socketId)) {
      return;
    }

    this.players.push(player);
  }

  size(): number {
    return this.players.length;
  }

  pop(count: number): QueuePlayer[] {
    return this.players.splice(0, count);
  }

  removeBySocketId(socketId: string): void {
    const index = this.players.findIndex(
      (entry) => entry.socketId === socketId,
    );
    if (index === -1) return;

    this.players.splice(index, 1);
  }
}
