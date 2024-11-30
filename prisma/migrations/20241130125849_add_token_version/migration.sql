/*
  Warnings:

  - You are about to drop the column `forget_password_token` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `token_send_at` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "forget_password_token",
DROP COLUMN "token_send_at",
ADD COLUMN     "tokenVersion" INTEGER NOT NULL DEFAULT 0;
