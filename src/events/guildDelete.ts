import { Client as DiscordClient, Guild } from 'discord.js';
import Logger from '../lib/log';
import ServerSettingsRepository from '../repository/serverSettings';

export default async function GuildDeleteEvent(discordClient: DiscordClient, guild: Guild): Promise<void> {
	const ss = await ServerSettingsRepository.GetByGuildId(guild.id);
	if (ss === null) {
		return;
	}
	ss.deleted = new Date();
	await ServerSettingsRepository.Save(ss);
	Logger.info(`Deleted guild ${guild.id}`);
}
