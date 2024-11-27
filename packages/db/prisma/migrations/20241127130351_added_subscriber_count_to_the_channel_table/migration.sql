/*
  Warnings:

  - Made the column `description` on table `Channel` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Channel" ADD COLUMN     "subscriber_count" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "description" SET NOT NULL;
