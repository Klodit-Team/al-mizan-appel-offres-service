-- CreateTable
CREATE TABLE `appel_offres` (
    `id` CHAR(36) NOT NULL,
    `reference` VARCHAR(191) NOT NULL,
    `objet` VARCHAR(191) NOT NULL,
    `type_procedure` ENUM('AO_OUVERT', 'AO_RESTREINT', 'CONCOURS', 'GRE_A_GRE') NOT NULL,
    `montant_estime` DECIMAL(15, 2) NOT NULL,
    `date_publication` DATETIME(3) NULL,
    `date_limite_soumission` DATETIME(3) NOT NULL,
    `date_limite_retrait_cdc` DATETIME(3) NOT NULL,
    `statut` ENUM('BROUILLON', 'PUBLIE', 'EN_COURS', 'OUVERTURE_PLIS', 'EVALUATION', 'ATTRIBUE', 'ANNULE', 'CLOTURE') NOT NULL DEFAULT 'BROUILLON',
    `service_contractant_id` VARCHAR(191) NOT NULL,
    `wilaya` VARCHAR(191) NOT NULL,
    `secteur_activite` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `appel_offres_reference_key`(`reference`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lot` (
    `id` CHAR(36) NOT NULL,
    `ao_id` CHAR(36) NOT NULL,
    `numero` VARCHAR(191) NOT NULL,
    `designation` VARCHAR(191) NOT NULL,
    `montant_estime` DECIMAL(15, 2) NOT NULL,
    `statut` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `critere_eligibilite` (
    `id` CHAR(36) NOT NULL,
    `ao_id` CHAR(36) NOT NULL,
    `libelle` VARCHAR(191) NOT NULL,
    `type` ENUM('CA_MIN', 'EXPERIENCE', 'CERTIFICATION') NOT NULL,
    `valeur_minimale` VARCHAR(191) NOT NULL,
    `eliminatoire` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `critere_evaluation` (
    `id` CHAR(36) NOT NULL,
    `ao_id` CHAR(36) NOT NULL,
    `lot_id` CHAR(36) NULL,
    `libelle` VARCHAR(191) NOT NULL,
    `categorie` ENUM('TECHNIQUE', 'FINANCIER') NOT NULL,
    `poids` DOUBLE NOT NULL,
    `note_eliminatoire` DOUBLE NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `document_cdc` (
    `id` CHAR(36) NOT NULL,
    `ao_id` CHAR(36) NOT NULL,
    `document_id` CHAR(36) NOT NULL,
    `prix_retrait` DECIMAL(15, 2) NOT NULL,
    `publie_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `retrait_cdc` (
    `id` CHAR(36) NOT NULL,
    `document_cdc_id` CHAR(36) NOT NULL,
    `operateur_id` VARCHAR(191) NOT NULL,
    `date_retrait` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `avis_ao` (
    `id` CHAR(36) NOT NULL,
    `ao_id` CHAR(36) NOT NULL,
    `type_avis` ENUM('PUBLICATION', 'ATTRIBUTION_PROV', 'ATTRIBUTION_DEF', 'ANNULATION', 'RECTIFICATIF') NOT NULL,
    `contenu_bomop` TEXT NOT NULL,
    `date_publication` DATETIME(3) NOT NULL,
    `publie_bomop` BOOLEAN NOT NULL DEFAULT false,
    `publie_presse` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attribution` (
    `id` CHAR(36) NOT NULL,
    `ao_id` CHAR(36) NOT NULL,
    `lot_id` CHAR(36) NULL,
    `soumission_id` VARCHAR(191) NOT NULL,
    `type` ENUM('PROVISOIRE', 'DEFINITIVE') NOT NULL,
    `date_attribution` DATETIME(3) NOT NULL,
    `date_fin_recours` DATETIME(3) NOT NULL,
    `montant_attribue` DECIMAL(15, 2) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `marche` (
    `id` CHAR(36) NOT NULL,
    `ao_id` CHAR(36) NOT NULL,
    `attribution_id` CHAR(36) NOT NULL,
    `reference_marche` VARCHAR(191) NOT NULL,
    `montant_signe` DECIMAL(15, 2) NOT NULL,
    `date_signature` DATETIME(3) NOT NULL,
    `delai_execution` INTEGER NOT NULL,

    UNIQUE INDEX `marche_attribution_id_key`(`attribution_id`),
    UNIQUE INDEX `marche_reference_marche_key`(`reference_marche`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `demandes_gre_a_gre` (
    `id` CHAR(36) NOT NULL,
    `ao_id` CHAR(36) NOT NULL,
    `service_contractant_id` VARCHAR(191) NOT NULL,
    `statut` ENUM('BROUILLON', 'SOUMISE', 'EN_ANALYSE_IA', 'ACCEPTEE', 'REJETEE', 'EN_REVISION') NOT NULL DEFAULT 'BROUILLON',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `demandes_gre_a_gre_ao_id_key`(`ao_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `justifications_gre_a_gre` (
    `id` CHAR(36) NOT NULL,
    `demande_id` CHAR(36) NOT NULL,
    `type_justification` ENUM('URGENCE', 'TECHNIQUE', 'ECONOMIQUE', 'JURIDIQUE', 'AUTRE') NOT NULL,
    `description` TEXT NOT NULL,
    `document_id` CHAR(36) NULL,
    `ordre` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `evaluations_ia_gre_a_gre` (
    `id` CHAR(36) NOT NULL,
    `demande_id` CHAR(36) NOT NULL,
    `modele_ia` VARCHAR(100) NOT NULL,
    `score_conformite` DECIMAL(5, 2) NOT NULL,
    `recommandation` ENUM('ACCEPTER', 'REJETER', 'DEMANDER_COMPLEMENTS') NOT NULL,
    `justification_ia` TEXT NOT NULL,
    `criteres_analyses` JSON NOT NULL,
    `confiance_score` DECIMAL(5, 2) NOT NULL,
    `date_analyse` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `evaluations_ia_gre_a_gre_demande_id_key`(`demande_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `decisions_gre_a_gre` (
    `id` CHAR(36) NOT NULL,
    `demande_id` CHAR(36) NOT NULL,
    `evaluation_ia_id` CHAR(36) NULL,
    `controleur_id` VARCHAR(191) NOT NULL,
    `decision_finale` ENUM('ACCEPTER', 'REJETER', 'DEMANDER_COMPLEMENTS') NOT NULL,
    `motif_decision` TEXT NOT NULL,
    `correspond_ia` BOOLEAN NOT NULL,
    `date_decision` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `decisions_gre_a_gre_demande_id_key`(`demande_id`),
    UNIQUE INDEX `decisions_gre_a_gre_evaluation_ia_id_key`(`evaluation_ia_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `lot` ADD CONSTRAINT `lot_ao_id_fkey` FOREIGN KEY (`ao_id`) REFERENCES `appel_offres`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `critere_eligibilite` ADD CONSTRAINT `critere_eligibilite_ao_id_fkey` FOREIGN KEY (`ao_id`) REFERENCES `appel_offres`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `critere_evaluation` ADD CONSTRAINT `critere_evaluation_ao_id_fkey` FOREIGN KEY (`ao_id`) REFERENCES `appel_offres`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `critere_evaluation` ADD CONSTRAINT `critere_evaluation_lot_id_fkey` FOREIGN KEY (`lot_id`) REFERENCES `lot`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document_cdc` ADD CONSTRAINT `document_cdc_ao_id_fkey` FOREIGN KEY (`ao_id`) REFERENCES `appel_offres`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `retrait_cdc` ADD CONSTRAINT `retrait_cdc_document_cdc_id_fkey` FOREIGN KEY (`document_cdc_id`) REFERENCES `document_cdc`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `avis_ao` ADD CONSTRAINT `avis_ao_ao_id_fkey` FOREIGN KEY (`ao_id`) REFERENCES `appel_offres`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attribution` ADD CONSTRAINT `attribution_ao_id_fkey` FOREIGN KEY (`ao_id`) REFERENCES `appel_offres`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attribution` ADD CONSTRAINT `attribution_lot_id_fkey` FOREIGN KEY (`lot_id`) REFERENCES `lot`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `marche` ADD CONSTRAINT `marche_ao_id_fkey` FOREIGN KEY (`ao_id`) REFERENCES `appel_offres`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `marche` ADD CONSTRAINT `marche_attribution_id_fkey` FOREIGN KEY (`attribution_id`) REFERENCES `attribution`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `demandes_gre_a_gre` ADD CONSTRAINT `demandes_gre_a_gre_ao_id_fkey` FOREIGN KEY (`ao_id`) REFERENCES `appel_offres`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `justifications_gre_a_gre` ADD CONSTRAINT `justifications_gre_a_gre_demande_id_fkey` FOREIGN KEY (`demande_id`) REFERENCES `demandes_gre_a_gre`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evaluations_ia_gre_a_gre` ADD CONSTRAINT `evaluations_ia_gre_a_gre_demande_id_fkey` FOREIGN KEY (`demande_id`) REFERENCES `demandes_gre_a_gre`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `decisions_gre_a_gre` ADD CONSTRAINT `decisions_gre_a_gre_demande_id_fkey` FOREIGN KEY (`demande_id`) REFERENCES `demandes_gre_a_gre`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `decisions_gre_a_gre` ADD CONSTRAINT `decisions_gre_a_gre_evaluation_ia_id_fkey` FOREIGN KEY (`evaluation_ia_id`) REFERENCES `evaluations_ia_gre_a_gre`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
