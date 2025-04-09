/*
  Warnings:

  - A unique constraint covering the columns `[chatJid]` on the table `Notification` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Notification_chatJid_key` ON `Notification`(`chatJid`);
