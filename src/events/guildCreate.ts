import { Client as DiscordClient, Guild } from "discord.js";
import Logger from "../lib/log";
import ServerSettingsRepository from "../repository/serverSettings";

export default async function GuildCreateEvent(discordClient: DiscordClient, guild: Guild) {
	ServerSettingsRepository.Create(guild.id);
	Logger.info(`Created guild ${guild.id}`);
}
