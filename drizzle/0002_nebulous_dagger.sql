CREATE TABLE `chatSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int,
	`userId` int NOT NULL,
	`messages` json NOT NULL,
	`sessionType` enum('general','floor_plan','camera_scan','element_design') NOT NULL DEFAULT 'general',
	`extractedData` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chatSessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `designElements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`elementType` enum('flooring','walls','ceiling','windows','doors','lighting','furniture','perspective') NOT NULL,
	`roomName` varchar(100) NOT NULL,
	`roomArea` float,
	`specifications` json,
	`imageUrl` text,
	`imageKey` varchar(500),
	`costMin` float,
	`costMax` float,
	`unit` varchar(50),
	`quantity` float,
	`isCompleted` boolean DEFAULT false,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `designElements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `perspectives` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`roomName` varchar(100) NOT NULL,
	`perspectiveType` enum('3d_render','floor_plan','elevation','section','detail') NOT NULL DEFAULT '3d_render',
	`prompt` text,
	`imageUrl` text,
	`imageKey` varchar(500),
	`designStyle` varchar(100),
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `perspectives_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `analyses` MODIFY COLUMN `designStyle` varchar(100) NOT NULL DEFAULT 'modern';--> statement-breakpoint
ALTER TABLE `projects` MODIFY COLUMN `designStyle` varchar(100) NOT NULL DEFAULT 'modern';--> statement-breakpoint
ALTER TABLE `projects` MODIFY COLUMN `status` enum('draft','analyzed','designing','completed') NOT NULL DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE `projects` ADD `projectType` enum('new','renovation','partial') DEFAULT 'new' NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `floorPlanUrl` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `floorPlanKey` varchar(500);--> statement-breakpoint
ALTER TABLE `projects` ADD `floorPlanData` json;--> statement-breakpoint
ALTER TABLE `projects` ADD `cameraScans` json;--> statement-breakpoint
ALTER TABLE `projects` ADD `designElements` json;--> statement-breakpoint
ALTER TABLE `projects` ADD `totalCostMin` float;--> statement-breakpoint
ALTER TABLE `projects` ADD `totalCostMax` float;