import { Client as DiscordClient, Message, MessageEmbed } from "discord.js";
import ActionLogRepository from "../repository/actionLog";
import ServerSettingsRepository from "../repository/severSettings";
import Logger from "../lib/log";
import { ActionType } from "../interfaces/actionTypeEnum";
import { getTextChannel } from "../lib/util";

export default async function MessageUpdateEvent(discordClient: DiscordClient, oldMessage: Message, newMessage: Message) {
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

	const embed = new MessageEmbed()
		.setColor(0xFFA500)
		.setTimestamp()
		.setAuthor("Message Edited")
		.setFooter(`User ID: ${newMessage.author.id}`)
		.addField("User", `${newMessage.author.tag}`, true)
		.addField("Channel", `${oldMessage.channel}`, true);
	
	if (oldMessage.content) { 
		embed.addField("Before", `${oldMessage.content}`, false)
	}
	embed.addField("After", `${newMessage.content}`, false);
	
	channel.send({embed});
}