-- CreateTable
CREATE TABLE `jobs` (
    `id` VARCHAR(36) NOT NULL,
    `queue` VARCHAR(255) NOT NULL,
    `payload` LONGTEXT NOT NULL,
    `attempts` TINYINT UNSIGNED NOT NULL,
    `reserved_at` INTEGER UNSIGNED NULL,
    `available_at` INTEGER UNSIGNED NOT NULL,
    `created_at` INTEGER UNSIGNED NOT NULL,

    INDEX `jobs_queue_index`(`queue`),
    INDEX `jobs_available_idx`(`available_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `failed_jobs` (
    `id` VARCHAR(36) NOT NULL,
    `uuid` VARCHAR(255) NOT NULL,
    `connection` TEXT NOT NULL,
    `queue` TEXT NOT NULL,
    `payload` LONGTEXT NOT NULL,
    `exception` LONGTEXT NOT NULL,
    `failed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `failed_jobs_uuid_key`(`uuid`),
    INDEX `failed_jobs_failed_at_idx`(`failed_at`),
    UNIQUE INDEX `failed_jobs_uuid_unique`(`uuid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `menus` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NULL,
    `title` VARCHAR(255) NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `icon` VARCHAR(100) NULL,
    `position` INTEGER NOT NULL DEFAULT 0,
    `parent_id` VARCHAR(191) NULL,
    `status` ENUM('active', 'hidden', 'disabled') NOT NULL DEFAULT 'active',
    `target` VARCHAR(20) NOT NULL DEFAULT '_self',
    `css_class` VARCHAR(100) NULL,
    `role` VARCHAR(100) NULL,
    `permissions` TEXT NULL,
    `group` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `menus_parent_id_fkey`(`parent_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `authorization_codes` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(255) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `sso_application_id` VARCHAR(36) NOT NULL,
    `redirect_uri` VARCHAR(500) NOT NULL,
    `scope` VARCHAR(255) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `used_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `authorization_codes_code_key`(`code`),
    INDEX `authorization_codes_user_id_fkey`(`user_id`),
    INDEX `authorization_codes_sso_application_id_fkey`(`sso_application_id`),
    INDEX `authorization_codes_user_app_exp_idx`(`user_id`, `sso_application_id`, `expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(255) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `sso_application_id` VARCHAR(36) NOT NULL,
    `scope` VARCHAR(255) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `revoked` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `refresh_tokens_token_key`(`token`),
    INDEX `refresh_tokens_user_id_fkey`(`user_id`),
    INDEX `refresh_tokens_sso_application_id_fkey`(`sso_application_id`),
    INDEX `refresh_tokens_expires_idx`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `personal_access_tokens` (
    `id` VARCHAR(36) NOT NULL,
    `tokenable_type` VARCHAR(255) NOT NULL,
    `tokenable_id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `token` VARCHAR(64) NOT NULL,
    `abilities` TEXT NULL,
    `last_used_at` DATETIME(3) NULL,
    `expires_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NULL,
    `updated_at` DATETIME(3) NULL,

    UNIQUE INDEX `personal_access_tokens_token_unique`(`token`),
    INDEX `personal_access_tokens_tokenable_type_tokenable_id_index`(`tokenable_type`, `tokenable_id`),
    INDEX `personal_tokens_expires_idx`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `organizations` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `url` VARCHAR(255) NOT NULL,
    `shared_user_applications` BOOLEAN NOT NULL DEFAULT false,
    `settings` JSON NULL,
    `created_at` DATETIME(3) NULL,
    `updated_at` DATETIME(3) NULL,

    UNIQUE INDEX `organizations_name_key`(`name`),
    UNIQUE INDEX `organizations_url_key`(`url`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissions` (
    `id` VARCHAR(36) NOT NULL,
    `sso_application_id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `guard_name` VARCHAR(255) NULL,
    `frontend` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NULL,
    `updated_at` DATETIME(3) NULL,

    INDEX `permissions_sso_application_id_foreign`(`sso_application_id`),
    UNIQUE INDEX `permissions_name_sso_application_id_unique`(`name`, `sso_application_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `guard_name` VARCHAR(255) NULL,
    `sso_application_id` VARCHAR(36) NOT NULL,
    `frontend` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NULL,
    `updated_at` DATETIME(3) NULL,

    INDEX `roles_sso_application_id_foreign`(`sso_application_id`),
    UNIQUE INDEX `roles_name_sso_application_id_unique`(`name`, `sso_application_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `model_has_permissions` (
    `permission_id` VARCHAR(36) NOT NULL,
    `sso_application_id` VARCHAR(36) NOT NULL,
    `organization_id` VARCHAR(36) NOT NULL,
    `model_type` VARCHAR(255) NOT NULL,
    `model_id` VARCHAR(36) NOT NULL,

    INDEX `model_has_permissions_model_id_model_type_index`(`model_id`, `model_type`),
    INDEX `fk_mhp_app`(`sso_application_id`),
    INDEX `model_has_permissions_model_id_model_type_idx`(`model_id`, `model_type`),
    PRIMARY KEY (`permission_id`, `model_id`, `model_type`, `sso_application_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `model_has_roles` (
    `role_id` VARCHAR(36) NOT NULL,
    `sso_application_id` VARCHAR(36) NOT NULL,
    `model_type` VARCHAR(255) NOT NULL,
    `model_id` VARCHAR(36) NOT NULL,
    `organization_id` VARCHAR(36) NOT NULL,

    INDEX `model_has_roles_model_id_model_type_index`(`model_id`, `model_type`),
    INDEX `fk_mhr_app`(`sso_application_id`),
    INDEX `model_has_roles_model_id_model_type_idx`(`model_id`, `model_type`),
    PRIMARY KEY (`role_id`, `model_id`, `model_type`, `sso_application_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_has_permissions` (
    `permission_id` VARCHAR(36) NOT NULL,
    `role_id` VARCHAR(36) NOT NULL,

    INDEX `role_has_permissions_role_id_foreign`(`role_id`),
    PRIMARY KEY (`permission_id`, `role_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `saml2_tenants` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `application_id` VARCHAR(36) NOT NULL,
    `uuid` CHAR(36) NOT NULL,
    `key` VARCHAR(255) NULL,
    `idp_entity_id` VARCHAR(255) NOT NULL,
    `idp_login_url` VARCHAR(255) NOT NULL,
    `idp_logout_url` VARCHAR(255) NOT NULL,
    `idp_x509_cert` TEXT NOT NULL,
    `metadata` JSON NOT NULL,
    `created_at` DATETIME(3) NULL,
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,
    `relay_state_url` VARCHAR(255) NULL,
    `name_id_format` VARCHAR(255) NOT NULL DEFAULT 'persistent',

    UNIQUE INDEX `saml2_tenants_uuid_key`(`uuid`),
    INDEX `fk_saml_tenant_app`(`application_id`),
    UNIQUE INDEX `saml2_tenants_uuid_unique`(`uuid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sso_applications` (
    `id` VARCHAR(36) NOT NULL,
    `organization_id` VARCHAR(36) NOT NULL,
    `application_name` VARCHAR(255) NOT NULL,
    `application_url` VARCHAR(500) NOT NULL,
    `client_id` VARCHAR(255) NOT NULL,
    `client_secret` VARCHAR(255) NOT NULL,
    `redirect_uri` VARCHAR(500) NOT NULL,
    `scope` TEXT NULL,
    `status` ENUM('active', 'disabled') NOT NULL DEFAULT 'active',
    `allowed_origins` TEXT NULL,
    `token_expiration_time` INTEGER NOT NULL DEFAULT 3600,
    `refresh_token_enabled` BOOLEAN NOT NULL DEFAULT true,
    `refresh_token_expiration_time` INTEGER NOT NULL DEFAULT 3600,
    `description` TEXT NULL,
    `logo_url` VARCHAR(500) NULL,
    `mode_strict` INTEGER NULL DEFAULT 0,
    `whitelist` TEXT NULL,
    `callback_url` TEXT NULL,
    `webhook_url` VARCHAR(500) NULL,
    `webhook_secret` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `sso_applications_client_id_key`(`client_id`),
    UNIQUE INDEX `apps_org_name_unique`(`organization_id`, `application_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(36) NOT NULL,
    `organization_id` VARCHAR(36) NOT NULL,
    `identify` VARCHAR(255) NULL,
    `username` VARCHAR(64) NULL,
    `full_name` JSON NULL,
    `first_name` JSON NULL,
    `last_name` JSON NULL,
    `avatar` VARCHAR(500) NULL,
    `email` VARCHAR(255) NULL,
    `phone` VARCHAR(20) NULL,
    `phone_code` VARCHAR(5) NULL,
    `identify_verified_at` DATETIME(3) NULL,
    `email_verified_at` DATETIME(3) NULL,
    `phone_verified_at` DATETIME(3) NULL,
    `password` VARCHAR(255) NULL,
    `role` TINYINT NOT NULL DEFAULT 0,
    `type` TINYINT NOT NULL DEFAULT 0,
    `passport_image` VARCHAR(255) NULL,
    `gravatar` TEXT NULL,
    `data` TEXT NULL,
    `hash` TEXT NULL,
    `method` VARCHAR(100) NULL,
    `service` VARCHAR(100) NULL,
    `status` INTEGER NULL,
    `date_of_birth` DATE NULL,
    `nationality` VARCHAR(255) NULL,
    `country` CHAR(2) NULL,
    `nationality_code` CHAR(2) NULL,
    `two_factor_enabled` BOOLEAN NULL DEFAULT false,
    `two_factor_secret` VARCHAR(255) NULL,
    `email_2fa` INTEGER NULL DEFAULT 0,
    `email_2fa_secret` VARCHAR(32) NULL DEFAULT '',
    `ga_2fa` INTEGER NULL DEFAULT 0,
    `ga_2fa_secret` VARCHAR(32) NULL DEFAULT '',
    `remember_token` VARCHAR(100) NULL,
    `timezone` VARCHAR(100) NULL,
    `language` VARCHAR(10) NULL DEFAULT 'en',
    `last_login_at` DATETIME(3) NULL,
    `last_login_ip` VARCHAR(45) NULL,
    `login_attempts` INTEGER NULL DEFAULT 0,
    `locked_until` DATETIME(3) NULL,
    `password_changed_at` DATETIME(3) NULL,
    `idp_data` JSON NULL,
    `created_at` DATETIME(3) NULL,
    `updated_at` DATETIME(3) NULL,
    `full_name_en` VARCHAR(255) NULL,
    `full_name_ar` VARCHAR(255) NULL,

    INDEX `users_org_idx`(`organization_id`),
    INDEX `users_last_login_at_idx`(`last_login_at`),
    INDEX `users_status_idx`(`status`),
    INDEX `users_full_name_en_idx`(`full_name_en`),
    INDEX `users_full_name_ar_idx`(`full_name_ar`),
    UNIQUE INDEX `users_org_email_unique`(`organization_id`, `email`),
    UNIQUE INDEX `users_org_username_unique`(`organization_id`, `username`),
    UNIQUE INDEX `users_org_identify_unique`(`organization_id`, `identify`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `last_logins` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(36) NOT NULL,
    `ip_address` VARCHAR(45) NOT NULL,
    `user_agent` TEXT NULL,
    `location` VARCHAR(255) NULL,
    `device` VARCHAR(255) NULL,
    `browser` VARCHAR(255) NULL,
    `os` VARCHAR(255) NULL,
    `attempt` INTEGER NOT NULL DEFAULT 1,
    `successful` BOOLEAN NOT NULL DEFAULT true,
    `failure_reason` VARCHAR(255) NULL,
    `login_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `last_logins_user_id_fkey`(`user_id`),
    INDEX `last_logins_user_time_idx`(`user_id`, `login_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `password_reset_tokens` (
    `user_id` VARCHAR(36) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `token` VARCHAR(255) NOT NULL,
    `used_at` DATETIME(3) NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `expired_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NULL,

    UNIQUE INDEX `password_reset_tokens_token_key`(`token`),
    INDEX `forgot_passwords_user_id_fkey`(`email`),
    INDEX `password_reset_tokens_used_idx`(`used_at`),
    UNIQUE INDEX `forgot_passwords_token_key`(`token`),
    PRIMARY KEY (`user_id`, `token`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `oauth_connections` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(36) NOT NULL,
    `provider` VARCHAR(50) NOT NULL,
    `provider_id` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NULL,
    `name` VARCHAR(255) NULL,
    `avatar` VARCHAR(500) NULL,
    `access_token` TEXT NULL,
    `refresh_token` TEXT NULL,
    `token_expires_at` DATETIME(3) NULL,
    `scope` TEXT NULL,
    `profile_data` TEXT NULL,
    `connected_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `last_used_at` DATETIME(3) NULL,

    UNIQUE INDEX `oauth_connections_user_id_provider_key`(`user_id`, `provider`),
    UNIQUE INDEX `oauth_provider_account_unique`(`provider`, `provider_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `webhook_logs` (
    `id` VARCHAR(36) NOT NULL,
    `sso_application_id` VARCHAR(36) NOT NULL,
    `event_id` VARCHAR(100) NOT NULL,
    `event_key` VARCHAR(100) NOT NULL,
    `event_type` VARCHAR(100) NULL,
    `event_name` VARCHAR(100) NULL,
    `event_owner` VARCHAR(64) NULL,
    `event_data` TEXT NULL,
    `payload` TEXT NOT NULL,
    `response` TEXT NULL,
    `status` VARCHAR(50) NOT NULL,
    `http_status_code` INTEGER NULL,
    `endpoint` TEXT NULL,
    `http_status` INTEGER NULL,
    `http_response` TEXT NULL,
    `attempt` INTEGER NOT NULL DEFAULT 1,
    `error_message` TEXT NULL,
    `delivered_at` DATETIME(3) NULL,
    `next_retry_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `webhook_logs_sso_application_id_fkey`(`sso_application_id`),
    INDEX `index_log_webhooks`(`event_key`, `event_owner`),
    INDEX `webhook_logs_app_created_idx`(`sso_application_id`, `created_at`),
    INDEX `webhook_logs_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `menus` ADD CONSTRAINT `menus_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `menus`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `authorization_codes` ADD CONSTRAINT `authorization_codes_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `authorization_codes` ADD CONSTRAINT `authorization_codes_sso_application_id_fkey` FOREIGN KEY (`sso_application_id`) REFERENCES `sso_applications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_sso_application_id_fkey` FOREIGN KEY (`sso_application_id`) REFERENCES `sso_applications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `permissions` ADD CONSTRAINT `permissions_sso_application_id_foreign` FOREIGN KEY (`sso_application_id`) REFERENCES `sso_applications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `roles` ADD CONSTRAINT `roles_sso_application_id_foreign` FOREIGN KEY (`sso_application_id`) REFERENCES `sso_applications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `model_has_permissions` ADD CONSTRAINT `model_has_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `model_has_permissions` ADD CONSTRAINT `fk_mhp_app` FOREIGN KEY (`sso_application_id`) REFERENCES `sso_applications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `model_has_permissions` ADD CONSTRAINT `fk_mhp_org` FOREIGN KEY (`sso_application_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `model_has_roles` ADD CONSTRAINT `model_has_roles_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `model_has_roles` ADD CONSTRAINT `fk_mhr_app` FOREIGN KEY (`sso_application_id`) REFERENCES `sso_applications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `model_has_roles` ADD CONSTRAINT `fk_mhr_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_has_permissions` ADD CONSTRAINT `role_has_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_has_permissions` ADD CONSTRAINT `role_has_permissions_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `saml2_tenants` ADD CONSTRAINT `fk_saml_tenant_app` FOREIGN KEY (`application_id`) REFERENCES `sso_applications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sso_applications` ADD CONSTRAINT `fk_apps_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `fk_users_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `last_logins` ADD CONSTRAINT `last_logins_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `password_reset_tokens` ADD CONSTRAINT `fk_prt_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `oauth_connections` ADD CONSTRAINT `oauth_connections_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `webhook_logs` ADD CONSTRAINT `webhook_logs_sso_application_id_fkey` FOREIGN KEY (`sso_application_id`) REFERENCES `sso_applications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
