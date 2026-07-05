-- CreateTable
CREATE TABLE `TaxCalculationOverride` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `year` INTEGER NOT NULL,
    `field` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TaxCalculationOverride_userId_year_idx`(`userId`, `year`),
    UNIQUE INDEX `TaxCalculationOverride_userId_year_field_key`(`userId`, `year`, `field`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TaxCalculationOverride` ADD CONSTRAINT `TaxCalculationOverride_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
