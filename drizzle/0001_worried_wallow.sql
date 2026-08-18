CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(64) NOT NULL,
	`color` varchar(16) NOT NULL DEFAULT '#4F46E5',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_owner_name_unique` UNIQUE(`ownerId`,`name`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`categoryId` int,
	`githubId` varchar(32) NOT NULL,
	`name` varchar(256) NOT NULL,
	`fullName` varchar(512) NOT NULL,
	`description` text,
	`repositoryUrl` varchar(1024) NOT NULL,
	`homepageUrl` varchar(1024),
	`demoUrl` varchar(1024),
	`documentationUrl` varchar(1024),
	`language` varchar(80),
	`topics` text NOT NULL,
	`visibility` enum('public','private') NOT NULL DEFAULT 'public',
	`isArchived` boolean NOT NULL DEFAULT false,
	`isFork` boolean NOT NULL DEFAULT false,
	`status` enum('activo','pausado','publicado','en riesgo') NOT NULL DEFAULT 'activo',
	`priority` enum('alta','media','baja') NOT NULL DEFAULT 'media',
	`phase` varchar(80) NOT NULL DEFAULT 'Desarrollo',
	`progress` int NOT NULL DEFAULT 0,
	`nextAction` text,
	`notes` text,
	`milestoneAt` timestamp,
	`githubCreatedAt` timestamp NOT NULL,
	`githubUpdatedAt` timestamp NOT NULL,
	`githubPushedAt` timestamp,
	`lastSyncedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`),
	CONSTRAINT `projects_owner_github_unique` UNIQUE(`ownerId`,`githubId`)
);
--> statement-breakpoint
ALTER TABLE `categories` ADD CONSTRAINT `categories_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_categoryId_categories_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `categories_owner_index` ON `categories` (`ownerId`);--> statement-breakpoint
CREATE INDEX `projects_owner_index` ON `projects` (`ownerId`);--> statement-breakpoint
CREATE INDEX `projects_category_index` ON `projects` (`categoryId`);