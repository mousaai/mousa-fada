CREATE TABLE `platformAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`platformId` varchar(50) NOT NULL,
	`alertType` enum('api_failure','low_balance','high_error_rate','pricing_updated','new_user_spike','webhook_failed','health_degraded','manual') NOT NULL,
	`severity` enum('info','warning','critical') NOT NULL DEFAULT 'info',
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`metadata` json,
	`isRead` boolean NOT NULL DEFAULT false,
	`isResolved` boolean NOT NULL DEFAULT false,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `platformAlerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `platformDailyStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`platformId` varchar(50) NOT NULL,
	`date` varchar(10) NOT NULL,
	`activeUsers` int NOT NULL DEFAULT 0,
	`newUsers` int NOT NULL DEFAULT 0,
	`totalRequests` int NOT NULL DEFAULT 0,
	`successfulRequests` int NOT NULL DEFAULT 0,
	`failedRequests` int NOT NULL DEFAULT 0,
	`creditsConsumed` int NOT NULL DEFAULT 0,
	`revenue` float NOT NULL DEFAULT 0,
	`avgResponseMs` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `platformDailyStats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `platformServices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`platformId` varchar(50) NOT NULL,
	`serviceKey` varchar(100) NOT NULL,
	`serviceName` varchar(255) NOT NULL,
	`creditCost` int NOT NULL,
	`category` varchar(100),
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`usageCount` int NOT NULL DEFAULT 0,
	`lastUsedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platformServices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `platforms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`platformId` varchar(50) NOT NULL,
	`name` varchar(100) NOT NULL,
	`domain` varchar(255) NOT NULL,
	`apiKey` varchar(255),
	`webhookSecret` varchar(255),
	`status` enum('active','inactive','maintenance') NOT NULL DEFAULT 'active',
	`category` varchar(100),
	`description` text,
	`logoUrl` text,
	`pricingWebhookSentAt` timestamp,
	`lastHealthCheckAt` timestamp,
	`healthStatus` enum('healthy','degraded','down','unknown') NOT NULL DEFAULT 'unknown',
	`totalUsers` int NOT NULL DEFAULT 0,
	`totalCreditsConsumed` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platforms_id` PRIMARY KEY(`id`),
	CONSTRAINT `platforms_platformId_unique` UNIQUE(`platformId`)
);
--> statement-breakpoint
CREATE TABLE `webhookLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`platformId` varchar(50) NOT NULL,
	`direction` enum('outbound','inbound') NOT NULL,
	`eventType` varchar(100) NOT NULL,
	`url` text,
	`statusCode` int,
	`requestBody` json,
	`responseBody` json,
	`success` boolean NOT NULL DEFAULT false,
	`durationMs` int,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `webhookLogs_id` PRIMARY KEY(`id`)
);
