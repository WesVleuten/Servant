import { Client as DiscordClient, VoiceState } from "discord.js";
import ActionLogRepository from "../repository/actionLog";
import ServerSettingsRepository from "../repository/serverSettings";
import Logger from "../lib/log";
import { ActionType } from "../interfaces/actionTypeEnum";
import { getTextChannel } from "../lib/util";
import createMessageEmbed from "../wrapper/discord/messageEmbed";

export default async function VoiceStateUpdateEvent(discordClient: DiscordClient, oldState: VoiceState, newState: VoiceState) {
	if (oldState.channelID === newState.channelID) {
		return;
	}

	const guildId = oldState?.guild?.id;
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

	if (oldState.channelID && newState.channelID) {
		// add action to database
		await ActionLogRepository.Add(serverSettings.id, oldState.member?.id || null, ActionType.VoiceChatMove, newState.channelID || null, {
			from: oldState.channelID,
			to: newState.channelID,
		});
		
		const embed = createMessageEmbed({
			color: 0x7CFC00,
			author: `${newState.member?.user?.tag}`,
			footer: `User ID: ${newState.id}`,
			fields: [
				{
					key: "Has switched voice channel to:",
					value: `${newState.channel?.name}`,
				},
				{
					key: "Previous voice channel:",
					value: `${oldState.channel?.name}`,
				},
			],
		});

		logchannel.send({embed});
		return;
	}

	if (!newState.channelID) {
		// add action to database
		await ActionLogRepository.Add(serverSettings.id, oldState.member?.id || null, ActionType.VoiceChatLeave, oldState.channelID || null, null);

		const embed = createMessageEmbed({
			color: 0xFF0000,
			author: `${newState.member?.user?.tag}`,
			footer: `User ID: ${newState.id}`,
			fields: [
				{
					key: "Has left the voice channel:",
					value: `${oldState.channel?.name}`,
					inline: true,
				},
			],
		});

		logchannel.send({embed});
		return;
	}

	if (!oldState.channelID) {
		// add action to database
		await ActionLogRepository.Add(serverSettings.id, oldState.member?.id || null, ActionType.VoiceChatJoin, newState.channelID || null, null);

		const embed = createMessageEmbed({
			color: 0x7CFC00,
			author: `${newState.member?.user?.tag}`,
			footer: `User ID: ${newState.member?.id}`,
			fields: [
				{
					key: "Has joined the voice channel:",
					value: `${newState.channel?.name}`,
					inline: true,
				},
			],
		});

		logchannel.send({embed});
		return;
	}
}