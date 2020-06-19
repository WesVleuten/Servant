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
			ServerSettingsRepository.Create(guildId);
			Logger.info(`Created guild ${guildId}`);
		}
	}
}