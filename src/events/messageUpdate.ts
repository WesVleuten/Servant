import { Client as DiscordClient, Message } from 'discord.js';
import ActionLogRepository from '../repository/actionLog';
import ServerSettingsRepository from '../repository/serverSettings';
import Logger from '../lib/log';
import { ActionType } from '../interfaces/actionTypeEnum';
import { getTextChannel } from '../lib/util';
import createMessageEmbed from '../wrapper/discord/messageEmbed';

export default async function MessageUpdateEvent(discordClient: DiscordClient, oldMessage: Message, newMessage: Message): Promise<void> {
	if (oldMessage.author.bot) return;

	const serverSettings = await ServerSettingsRepository.GetByGuildId(oldMessage?.guild?.id);
	if (serverSettings === null) {
		Logger.error(`Couldnt get server settings for ${oldMessage?.guild?.id}`);
		return;
	}

	if (!serverSettings.logChannel || oldMessage.content === newMessage.content) {
		return;
	}

	// add action to database
	await ActionLogRepository.Add(serverSettings.id, oldMessage.author.id, ActionType.MessageEdit, oldMessage.channel.id, {
		from: oldMessage.content,
		to: newMessage.content,
	});

	const channel = getTextChannel(discordClient, serverSettings.logChannel);
	if (channel === null) {
		Logger.error(`Couldnt get log channel for server ${oldMessage?.guild?.id}`);
		return;
	}

	const embed = createMessageEmbed({
		color: 0xFFA500,
		author: 'Message Edited',
		footer: `User ID: ${newMessage.author.id}`,
		fields: [
			{
				key: 'User',
				value: newMessage.author.tag,
				inline: true,
			},
			{
				key: 'Channel',
				value: `${oldMessage.channel}`,
				inline: true,
			},
			{
				key: 'Before',
				value: oldMessage.content,
			},
			{
				key: 'After',
				value: newMessage.content,
			},
		],
	});

	channel.send({embed});
}
