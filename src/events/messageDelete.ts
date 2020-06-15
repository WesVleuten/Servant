import { Client as DiscordClient, Message } from "discord.js";
import ActionLogRepository from "../repository/actionLog";
import ServerSettingsRepository from "../repository/severSettings";
import Logger from "../lib/log";
import { ActionType } from "../interfaces/actionTypeEnum";
import { getTextChannel } from "../lib/util";
import createMessageEmbed from "../wrapper/discord/messageEmbed";

export default async function MessageDeleteEvent(discordClient: DiscordClient, message: Message) {
	if (message.author.bot) return;

	const serverSettings = await ServerSettingsRepository.GetByGuildId(message?.guild?.id);
	if (serverSettings === null) {
		Logger.error(`Couldnt get server settings for ${message?.guild?.id}`);
		return;
	}

	if (!serverSettings.logChannel) {
		return;
	}

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
		],
	});
	
	channel.send({embed});
}
