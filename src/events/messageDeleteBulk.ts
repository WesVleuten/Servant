

import { Client as DiscordClient, Message, Collection, Snowflake } from "discord.js";
import ActionLogRepository from "../repository/actionLog";
import ServerSettingsRepository from "../repository/serverSettings";
import Logger from "../lib/log";
import { ActionType } from "../interfaces/actionTypeEnum";
import { getTextChannel } from "../lib/util";

export default async function MessageDeleteBulkEvent(discordClient: DiscordClient, messages: Collection<Snowflake, Message>) {
	const firstMessage = messages.first();
	if (!firstMessage) {
		return;
	}
	const guildId = firstMessage.guild?.id;
	const serverSettings = await ServerSettingsRepository.GetByGuildId(guildId);
	if (serverSettings === null) {
		Logger.error(`Couldnt get server settings for ${guildId}`);
		return;
	}

	if (!serverSettings.logChannel) {
		return;
	}

	const logchannel = getTextChannel(discordClient, serverSettings.logChannel);
	if (logchannel === null) {
		Logger.error(`Couldnt get log channel for server ${guildId}`);
		return;
	}

	const messageArray = messages.array();
	let output: string[] = [];
	messageArray.forEach( c => {
		output.push(`[${c.createdAt.toJSON()}] ${c.author.tag}: ${c.content}`);
	});

	// add action to database
	await ActionLogRepository.Add(serverSettings.id, null, ActionType.MessagePurge, firstMessage.channel.id, output);

	logchannel.send("--- MESSAGE PURGE\n" + output.join('\n'), {code: "asciidoc", split: { char: "\u200b" }});
}