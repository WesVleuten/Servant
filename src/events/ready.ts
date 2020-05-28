import { Client as DiscordClient } from "discord.js";
import Logger from "../lib/log";
import ServerSettingsRepository from "../repository/severSettings";

export default async function ReadyEvent(discordClient: DiscordClient) {
	Logger.info(`Ready to serve, found ${discordClient.guilds.cache.size} guilds`);

	discordClient.guilds.cache.forEach(guild => {
		Logger.info(`Checking for guild ${guild.id}`);
		ServerSettingsRepository.GetByGuildId(guild.id).then(serverSettings => {
			if (serverSettings === null) {
				ServerSettingsRepository.Save({
					id: 0,
					guildId: guild.id,
					deleted: null,
					prefix: ';',
					logChannel: null,
					modLogChannel: null,
					systemNotice: true,
					streamLiveRole: null,
					streamShout: null,
					adminRole: null, 
					moderatorRole: null,
				});
				Logger.info(`Created guild ${guild.id}`);
			}
		});
	});
}
