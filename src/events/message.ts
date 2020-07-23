import { Client as DiscordClient, Message } from "discord.js";
import ServerSettingsRepository from "../repository/serverSettings";
import Logger from "../lib/log";
import stringArgv from 'string-argv';
import { getCommand } from "../routes";
import GetPermissionLevel from "../lib/authorization";

export default async function MessageEvent(discordClient: DiscordClient, message: Message) {
	if (message.author.bot || message.content.length < 1 || message.content[0] !== ';') {
		return;
	}

	const guildId = message.guild?.id;
	const serverSettings = await ServerSettingsRepository.GetByGuildId(guildId);
	if (serverSettings === null) {
		Logger.error(`Couldnt get server settings for ${guildId}`);
		return;
	}

	const full = stringArgv(message.content.slice(1));
	const command = full[0];
	const args = full.slice(1);

	const cmd = await getCommand(command);
	if (!cmd || !message.guild && cmd.guildOnly) {
		return;
	}
	
	const permissionLevel = await GetPermissionLevel(message.member!);
	if (permissionLevel > cmd.permissionLevel) {
		// no permission
		return;
	}
	
	await cmd.run(discordClient, message, args);
}