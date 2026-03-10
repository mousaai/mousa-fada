CREATE TABLE `analyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`imageUrl` text NOT NULL,
	`imageKey` varchar(500),
	`designStyle` enum('modern','gulf','classic','minimal') NOT NULL DEFAULT 'modern',
	`spaceType` varchar(100),
	`area` float,
	`analysisResult` json,
	`colorPalette` json,
	`materials` json,
	`furniture` json,
	`costEstimate` json,
	`totalCostMin` float,
	`totalCostMax` float,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analyses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`designStyle` enum('modern','gulf','classic','minimal') NOT NULL DEFAULT 'modern',
	`spaceType` varchar(100),
	`area` float,
	`status` enum('draft','analyzed','completed') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
