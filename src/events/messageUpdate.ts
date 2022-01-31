import { Client as DiscordClient, Message } from 'discord.js';
import ActionLogRepository from '../repository/actionLog';
import ServerSettingsRepository from '../repository/serverSettings';
import Logger from '../lib/log';
import { ActionType } from '../interfaces/actionTypeEnum';
import { getTextChannel } from '../lib/util';
import createMessageEmbed from '../wrapper/discord/messageEmbed';

export default async function MessageUpdateEvent(discordClient: DiscordClient, oldMessage: Message, newMessage: Message): Promise<void> {
	const serverSettings = await ServerSettingsRepository.GetByGuildId(newMessage?.guild?.id);
	if (serverSettings === null) {
		Logger.error(`Couldnt get server settings for ${newMessage?.guild?.id}`);
		return;
	}

	if (oldMessage.partial) {
		try {
			await oldMessage.fetch();
		} catch (error) {
			return;
		}
	}

	const author = newMessage.author;
	const channel = newMessage.channel;
	if (author.bot || !serverSettings.logChannel || oldMessage.content === newMessage.content) {
		return;
	}

	// add action to database
	await ActionLogRepository.Add(serverSettings.id, author.id, ActionType.MessageEdit, channel.id, {
		from: oldMessage.content,
		to: newMessage.content,
	});

	const logChannel = getTextChannel(discordClient, serverSettings.logChannel);
	if (logChannel === null) {
		Logger.error(`Couldnt get log channel for server ${newMessage?.guild?.id}`);
		return;
	}

	const embed = createMessageEmbed({
		color: 0xFFA500,
		author: 'Message Edited',
		footer: `User ID: ${author.id}`,
		fields: [
			{
				key: 'User',
				value: author.tag,
				inline: true,
			},
			{
				key: 'Channel',
				value: `${channel}`,
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

	logChannel.send({ embed });
}
