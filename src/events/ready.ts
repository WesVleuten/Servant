import { Client as DiscordClient } from "discord.js";
import Logger from "../lib/log";
import ServerSettingsRepository from "../repository/severSettings";

export default async function ReadyEvent(discordClient: DiscordClient) {
	Logger.info(`Ready to serve, found ${discordClient.guilds.cache.size} guilds`);

	await Promise.all(discordClient.guilds.cache.map(guild => CheckGuild(guild.id)))
	async function CheckGuild(guildId: any) {
		Logger.info(`Checking for guild ${guildId}`);
	
		const serverSettings = await ServerSettingsRepository.GetByGuildId(guildId)
		if (serverSettings === null) {
			ServerSettingsRepository.Save({
				id: 0,
				guildId: guildId,
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
			Logger.info(`Created guild ${guildId}`);
		}
	}
}