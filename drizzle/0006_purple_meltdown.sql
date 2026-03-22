CREATE TABLE `aiUsageLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`mousaUserId` int NOT NULL,
	`operation` varchar(50) NOT NULL,
	`creditsDeducted` int NOT NULL,
	`sessionMultiplier` float NOT NULL DEFAULT 1,
	`dailySessionCount` int NOT NULL DEFAULT 1,
	`success` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aiUsageLogs_id` PRIMARY KEY(`id`)
);
