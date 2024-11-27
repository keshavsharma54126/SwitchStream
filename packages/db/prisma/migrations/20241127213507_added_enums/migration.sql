/*
  Warnings:

  - Added the required column `status` to the `Video` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "VideoStatus" AS ENUM ('PENDING', 'PROCESSING', 'TRANSCODED', 'FAILED');

-- AlterTable
ALTER TABLE "Video" DROP COLUMN "status",
ADD COLUMN     "status" "VideoStatus" NOT NULL;
