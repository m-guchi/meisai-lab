-- AlterTable
ALTER TABLE `Item` ADD COLUMN `scope` VARCHAR(191) NOT NULL DEFAULT 'both';

-- AlterTable
ALTER TABLE `TaxSetting` ADD COLUMN `employmentInsuranceRate` DECIMAL(5, 2) NOT NULL DEFAULT 0.60;
