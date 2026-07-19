-- AlterTable
ALTER TABLE "User" ADD COLUMN     "selectedCharacterId" INTEGER;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_selectedCharacterId_fkey" FOREIGN KEY ("selectedCharacterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;
