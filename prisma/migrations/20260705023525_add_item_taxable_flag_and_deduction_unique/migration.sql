-- AlterTable
ALTER TABLE `Item` ADD COLUMN `isTaxable` BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX `Deduction_userId_year_deductionType_key` ON `Deduction`(`userId`, `year`, `deductionType`);
