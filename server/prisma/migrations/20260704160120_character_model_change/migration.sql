/*
  Warnings:

  - You are about to drop the column `furry` on the `Attributes` table. All the data in the column will be lost.
  - You are about to drop the column `knokbackResistance` on the `Attributes` table. All the data in the column will be lost.
  - Added the required column `fury` to the `Attributes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pushResistance` to the `Attributes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Attributes" DROP COLUMN "furry",
DROP COLUMN "knokbackResistance",
ADD COLUMN     "fury" INTEGER NOT NULL,
ADD COLUMN     "pushResistance" INTEGER NOT NULL;
