-- AlterTable: replace year-based TaxSetting with an effective-from (year-month) based one
ALTER TABLE `TaxSetting` ADD COLUMN `effectiveFrom` DATETIME(3) NULL;

-- Backfill: existing rows were keyed by calendar year, so treat them as effective from January 1st of that year
UPDATE `TaxSetting` SET `effectiveFrom` = STR_TO_DATE(CONCAT(`year`, '-01-01'), '%Y-%m-%d') WHERE `effectiveFrom` IS NULL;

ALTER TABLE `TaxSetting` MODIFY COLUMN `effectiveFrom` DATETIME(3) NOT NULL;

-- CreateIndex (create the new index before dropping the old one so the userId foreign key stays supported)
CREATE UNIQUE INDEX `TaxSetting_userId_effectiveFrom_key` ON `TaxSetting`(`userId`, `effectiveFrom`);

-- DropIndex
DROP INDEX `TaxSetting_userId_year_key` ON `TaxSetting`;

-- AlterTable
ALTER TABLE `TaxSetting` DROP COLUMN `year`;
