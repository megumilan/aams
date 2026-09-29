ALTER TABLE `users` MODIFY COLUMN `id` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `password_hash`;