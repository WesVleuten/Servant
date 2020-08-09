CREATE DATABASE IF NOT EXISTS `servant`;
USE `servant`;

DROP TABLE IF EXISTS `ActionLog`;
CREATE TABLE `ActionLog` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `serverId` int(11) NOT NULL,
  `userId` varchar(255) DEFAULT NULL,
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `action` int(11) DEFAULT NULL,
  `channelId` varchar(255) DEFAULT NULL,
  `data` longtext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

DROP TABLE IF EXISTS `ServerSettings`;
CREATE TABLE `ServerSettings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `guildId` varchar(255) NOT NULL,
  `deleted` datetime DEFAULT NULL,
  `prefix` varchar(2) NOT NULL,
  `logChannel` varchar(255) DEFAULT NULL,
  `modLogChannel` varchar(255) DEFAULT NULL,
  `systemNotice` tinyint(1) NOT NULL,
  `streamLiveRole` varchar(255) DEFAULT NULL,
  `streamShout` varchar(255) DEFAULT NULL,
  `streamTimeout` int(11) DEFAULT NULL,
  `adminRole` varchar(255) DEFAULT NULL,
  `moderatorRole` varchar(255) DEFAULT NULL,
  `quoteThreshold` int(11) DEFAULT NULL,
  `quoteEmoji` text DEFAULT NULL,
  `quoteChannel` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

DROP TABLE IF EXISTS `WhiteListedGames`;
CREATE TABLE `WhiteListedGames` (
  `guildId` VARCHAR(255) NOT NULL,
  `id` VARCHAR(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`guildId`, `name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

DROP TABLE IF EXISTS `WhiteListedRoles`;
CREATE TABLE `WhiteListedRoles` (
  `guildId` VARCHAR(255) NOT NULL,
  `id` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`guildId`, `id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

DROP TABLE IF EXISTS `Quotes`;
CREATE TABLE `Quotes` (
  `guildId` VARCHAR(255) NOT NULL,
  `messageId` VARCHAR(255) NOT NULL,
  `state` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`guildId`, `messageId`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;