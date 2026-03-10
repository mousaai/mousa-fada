CREATE TABLE `arScans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int,
	`scanId` varchar(100) NOT NULL,
	`scanDate` timestamp NOT NULL,
	`projectType` enum('room','apartment','villa','office') NOT NULL DEFAULT 'room',
	`rooms` json NOT NULL,
	`totalArea` float,
	`floorPlanImageUrl` text,
	`modelUrl` text,
	`status` enum('received','processing','completed','error') NOT NULL DEFAULT 'received',
	`aiAnalysis` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `arScans_id` PRIMARY KEY(`id`),
	CONSTRAINT `arScans_scanId_unique` UNIQUE(`scanId`)
);
--> statement-breakpoint
CREATE TABLE `marketPrices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` enum('flooring','walls','ceiling','windows','doors','lighting','furniture','labor') NOT NULL,
	`subcategory` varchar(100) NOT NULL,
	`itemName` varchar(255) NOT NULL,
	`itemNameAr` varchar(255) NOT NULL,
	`brand` varchar(100),
	`unit` varchar(50) NOT NULL,
	`priceMin` float NOT NULL,
	`priceMax` float NOT NULL,
	`quality` enum('economy','standard','premium','luxury') NOT NULL DEFAULT 'standard',
	`country` varchar(50) NOT NULL DEFAULT 'SA',
	`isActive` boolean NOT NULL DEFAULT true,
	`lastUpdated` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `marketPrices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `moodBoards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`designStyle` varchar(100) NOT NULL,
	`colorPalette` json,
	`materials` json,
	`images` json,
	`boardImageUrl` text,
	`boardImageKey` varchar(500),
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `moodBoards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`reportType` enum('full','design_only','cost_only','boq') NOT NULL DEFAULT 'full',
	`fileUrl` text,
	`fileKey` varchar(500),
	`fileName` varchar(255),
	`fileSize` int,
	`status` enum('generating','ready','error') NOT NULL DEFAULT 'generating',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `perspectives` MODIFY COLUMN `perspectiveType` enum('3d_render','floor_plan','elevation','section','detail','mood_board') NOT NULL DEFAULT '3d_render';--> statement-breakpoint
ALTER TABLE `analyses` ADD `harmonyScore` float;--> statement-breakpoint
ALTER TABLE `analyses` ADD `harmonyNotes` json;--> statement-breakpoint
ALTER TABLE `designElements` ADD `harmonyScore` float;--> statement-breakpoint
ALTER TABLE `projects` ADD `arScanData` json;--> statement-breakpoint
ALTER TABLE `projects` ADD `arScanId` varchar(100);