import { Client as DiscordClient, Message, User, Channel } from 'discord.js';
import ActionLogRepository from '../repository/actionLog';
import ServerSettingsRepository from '../repository/serverSettings';
import Logger from '../lib/log';
import { ActionType } from '../interfaces/actionTypeEnum';
import { getTextChannel } from '../lib/util';
import createMessageEmbed from '../wrapper/discord/messageEmbed';
import QuotesRepository from '../repository/quotes';

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

interface ExtraChannel {
	channel: Channel;
}

/*
 * MessageDeleteEvent
 *
 * It is not possible to exactly know who deleted a message, but by scanning
 * the audit logs we can get a pretty clear idea of who was responsible.
 * The "Deleted By" field is "Unkown" if we cannot figure out who deleted it
 */

export default async function MessageDeleteEvent(discordClient: DiscordClient, message: Message): Promise<void> {
	if (message.partial) {
		try {
			await message.fetch();
		} catch (error) {
			return;
		}
	}

	if (!message.guild) return; // DM message

	const serverSettings = await ServerSettingsRepository.GetByGuildId(message?.guild?.id);
	if (serverSettings === null) {
		Logger.error(`Couldnt get server settings for ${message?.guild?.id}`);
		return;
	}

	const guild = message.guild;

	// Call delete on quotes repository in case it's a quote
	QuotesRepository.Delete(guild.id, message.id)

	if (!serverSettings.logChannel) {
		return;
	}

	await sleep(1000); // wait 1sec for audit logs to generate

	// fetch last 7 audit logs
	const auditLogs = await guild.fetchAuditLogs({
		limit: 7,
		type: 'MESSAGE_DELETE',
	});

	// search through audit logs and filter out any irrelevant logs
	//  - match on target and author
	//  - match on channel
	//  - shouldn't be too long ago
	const auditEntry = auditLogs.entries.find(x => {
		if (x.targetType == 'USER' && x.target instanceof User) {
			const target: User = x.target;
			const extra: ExtraChannel = <ExtraChannel>x.extra;
			return target.id === message.author.id &&
				extra.channel.id === message.channel.id &&
				Date.now() - x.createdTimestamp < 20000;
		}
		return false;
	});

	// set the deleted by tag IF we found who deleted it
	const deletedBy = auditEntry ? auditEntry.executor.tag : 'Unkown';

	// add action to database
	await ActionLogRepository.Add(serverSettings.id, message.author.id, ActionType.MessageDelete, message.channel.id, {
		content: message.content,
	});

	const channel = getTextChannel(discordClient, serverSettings.logChannel);
	if (channel === null) {
		Logger.error(`Couldnt get log channel for server ${message?.guild?.id}`);
		return;
	}

	const embed = createMessageEmbed({
		color: 0xFF0000,
		author: 'Message Deleted',
		footer: `User ID: ${message.author.id}`,
		fields: [
			{
				key: 'User',
				value: message.author.tag,
				inline: true,
			},
			{
				key: 'Channel',
				value: `${message.channel}`,
				inline: true,
			},
			{
				key: 'Message Deleted',
				value: message.content,
			},
			{
				key: 'Deleted by',
				value: deletedBy,
			},
		],
	});

	channel.send({ embed });
}
