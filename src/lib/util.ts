import { Client as DiscordClient, TextChannel } from 'discord.js';

export function getTextChannel(discordClient: DiscordClient, channelId: string): TextChannel|null {
	const channel = discordClient.channels.cache.get(channelId);
	if (!channel || channel.type !== 'text') {
		return null;
	}
	// Weird typescript hack
	// It seems to not return the correct type so we do an any convertion
	// to fix that
	return <TextChannel>channel;
}
