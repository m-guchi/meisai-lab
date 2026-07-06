-- AlterTable: widen insurance rate columns to allow up to 4 decimal places
ALTER TABLE `TaxSetting` MODIFY COLUMN `healthInsuranceRate` DECIMAL(7, 4) NOT NULL DEFAULT 9.15;
ALTER TABLE `TaxSetting` MODIFY COLUMN `pensionRate` DECIMAL(7, 4) NOT NULL DEFAULT 9.15;
ALTER TABLE `TaxSetting` MODIFY COLUMN `employmentInsuranceRate` DECIMAL(7, 4) NOT NULL DEFAULT 0.60;
