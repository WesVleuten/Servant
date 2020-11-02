import { Client as DiscordClient, Message, GuildAuditLogs } from "discord.js";
import ActionLogRepository from "../repository/actionLog";
import ServerSettingsRepository from "../repository/serverSettings";
import Logger from "../lib/log";
import { ActionType } from "../interfaces/actionTypeEnum";
import { getTextChannel } from "../lib/util";
import createMessageEmbed from "../wrapper/discord/messageEmbed";

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

export default async function MessageDeleteEvent(discordClient: DiscordClient, message: Message) {
	if (!message.guild) return; // DM message

	const serverSettings = await ServerSettingsRepository.GetByGuildId(message?.guild?.id);
	if (serverSettings === null) {
		Logger.error(`Couldnt get server settings for ${message?.guild?.id}`);
		return;
	}

	if (!serverSettings.logChannel) {
		return;
	}

	await sleep(1000); // wait 1sec for audit logs to generate

	const guild = message.guild;
	const auditLogs = await guild.fetchAuditLogs({
		limit: 7,
		type: 'MESSAGE_DELETE',
	});

	const auditEntry = auditLogs.entries.find(x => {
		const target: any = x.target;
		const extra: any = x.extra;
		return target.id === message.author.id &&
			extra.channel.id === message.channel.id &&
			Date.now() - x.createdTimestamp < 20000
	});

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
		author: "Message Deleted",
		footer: `User ID: ${message.author.id}`,
		fields: [
			{
				key: "User",
				value: message.author.tag,
				inline: true,
			},
			{
				key: "Channel",
				value: `${message.channel}`,
				inline: true,
			},
			{
				key: "Message Deleted",
				value: message.content,
			},
			{
				key: "Deleted by",
				value: deletedBy,
			},
		],
	});
	
	channel.send({embed});
}
