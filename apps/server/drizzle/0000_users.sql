CREATE TABLE `users` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`username` varchar(32) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`name` varchar(64) NOT NULL,
	`email` varchar(128),
	`phone` varchar(20),
	`role` enum('student','teacher','admin') NOT NULL,
	`status` enum('active','disabled') NOT NULL DEFAULT 'active',
	`must_change_password` boolean NOT NULL DEFAULT false,
	`failed_login_count` int NOT NULL DEFAULT 0,
	`locked_until` datetime,
	`last_login_at` datetime,
	`deleted_at` datetime,
	`created_at` datetime NOT NULL DEFAULT current_timestamp,
	`updated_at` datetime NOT NULL DEFAULT current_timestamp,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_username_unique` UNIQUE(`username`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE INDEX `users_role_status_idx` ON `users` (`role`,`status`);