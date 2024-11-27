/*
  Warnings:

  - You are about to drop the column `video_url` on the `Video` table. All the data in the column will be lost.
  - Added the required column `video_urls` to the `Video` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Video" DROP COLUMN "video_url",
ADD COLUMN     "video_urls" JSONB NOT NULL;
