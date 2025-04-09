/*
  Warnings:

  - You are about to drop the column `jid` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `notification` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[phone]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `phone` to the `User` table without a default value. This is not possible if the table is not empty.

*/
ALTER TABLE `User` ADD COLUMN `phone` VARCHAR(191) NULL;
UPDATE `User` SET `phone` = `jid`;
ALTER TABLE `User` MODIFY COLUMN `phone` VARCHAR(191) NOT NULL;
CREATE UNIQUE INDEX `User_phone_key` ON `User`(`phone`);
ALTER TABLE `User` DROP COLUMN `jid`;
ALTER TABLE `User` DROP COLUMN `notification`;