CREATE TABLE `designReferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`imageUrl` text NOT NULL,
	`imageKey` varchar(500),
	`title` varchar(255) NOT NULL,
	`spaceType` varchar(100),
	`styleLabel` varchar(100),
	`styleKey` varchar(50),
	`description` text,
	`colorMood` varchar(100),
	`palette` json,
	`materials` json,
	`highlights` json,
	`analysisData` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `designReferences_id` PRIMARY KEY(`id`)
);
