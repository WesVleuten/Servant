import { Client as DiscordClient } from 'discord.js';
import Logger from '../lib/log';

export default async function ErrorEvent(discordClient: DiscordClient, error: Error): Promise<void> {
	Logger.error('Discord error', error);
}
