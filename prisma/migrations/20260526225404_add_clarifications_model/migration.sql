-- CreateTable
CREATE TABLE `demandes_clarification` (
    `id` CHAR(36) NOT NULL,
    `ao_id` CHAR(36) NOT NULL,
    `operateur_id` CHAR(36) NOT NULL,
    `question` TEXT NOT NULL,
    `reponse` TEXT NULL,
    `repondu_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `demandes_clarification_ao_id_idx`(`ao_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `demandes_clarification` ADD CONSTRAINT `demandes_clarification_ao_id_fkey` FOREIGN KEY (`ao_id`) REFERENCES `appel_offres`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
