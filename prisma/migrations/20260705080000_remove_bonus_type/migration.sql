-- DropIndex
DROP INDEX `Bonus_userId_bonusDate_bonusType_key` ON `Bonus`;

-- AlterTable
ALTER TABLE `Bonus` DROP COLUMN `bonusType`;

-- CreateIndex
CREATE UNIQUE INDEX `Bonus_userId_bonusDate_key` ON `Bonus`(`userId`, `bonusDate`);
