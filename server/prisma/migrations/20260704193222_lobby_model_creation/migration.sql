-- CreateEnum
CREATE TYPE "LobbyMode" AS ENUM ('ONE_VS_ONE', 'TWO_VS_TWO', 'THREE_VS_THREE');

-- CreateEnum
CREATE TYPE "LobbyStatus" AS ENUM ('WAITING', 'READY', 'IN_GAME', 'FINISHED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Lobby" (
    "id" SERIAL NOT NULL,
    "lobbyStatus" "LobbyStatus" NOT NULL,
    "mode" "LobbyMode" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lobby_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LobbyMember" (
    "id" INTEGER NOT NULL,
    "isBot" BOOLEAN NOT NULL,
    "slot" INTEGER NOT NULL,
    "userId" INTEGER,
    "lobbyId" SERIAL NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "LobbyMember_id_key" ON "LobbyMember"("id");

-- CreateIndex
CREATE UNIQUE INDEX "LobbyMember_lobbyId_key" ON "LobbyMember"("lobbyId");

-- AddForeignKey
ALTER TABLE "LobbyMember" ADD CONSTRAINT "LobbyMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LobbyMember" ADD CONSTRAINT "LobbyMember_lobbyId_fkey" FOREIGN KEY ("lobbyId") REFERENCES "Lobby"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
