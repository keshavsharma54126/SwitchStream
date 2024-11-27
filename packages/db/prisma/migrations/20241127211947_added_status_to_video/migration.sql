/*
  Warnings:

  - Added the required column `category` to the `Video` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `Video` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "status" TEXT,
ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "video_urls" DROP NOT NULL;
