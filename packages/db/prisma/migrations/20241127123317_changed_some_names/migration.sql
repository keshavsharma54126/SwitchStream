/*
  Warnings:

  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the column `thumbnailUrl` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the column `videoUrl` on the `Video` table. All the data in the column will be lost.
  - Added the required column `updated_at` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `creatorId` to the `Video` table without a default value. This is not possible if the table is not empty.
  - Added the required column `thumbnail_url` to the `Video` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Video` table without a default value. This is not possible if the table is not empty.
  - Added the required column `video_url` to the `Video` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Video" DROP COLUMN "createdAt",
DROP COLUMN "thumbnailUrl",
DROP COLUMN "updatedAt",
DROP COLUMN "videoUrl",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "creatorId" TEXT NOT NULL,
ADD COLUMN     "thumbnail_url" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "video_url" TEXT NOT NULL,
ADD COLUMN     "views_count" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
