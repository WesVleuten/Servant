import { ICommand, PermissionLevel } from "./base";
import { Message, Client } from "discord.js";
import { getCommands } from "../routes";
import ServerSettingsRepository from "../repository/serverSettings";
import Logger from "../lib/log";
import createMessageEmbed from "../wrapper/discord/messageEmbed";
import GetPermissionLevel from "../lib/authorization";

export default class HelpCommand implements ICommand {

	commandName = 'help';
	aliases = null;
	permissionLevel = PermissionLevel.User;
	guildOnly = false;

	usageText = ";help";
	helpText = "Displays commands user has access to";

	async run(discordClient: Client, message: Message, args: string[]) {
		if (args.length > 0) { 
			return;
		}

		const guildId = message.guild?.id;
		const serverSettings = await ServerSettingsRepository.GetByGuildId(guildId);
		if (serverSettings === null) {
			Logger.error(`Couldn't get server settings for ${guildId}`);
			return;
		}

		const permissionLevel = await GetPermissionLevel(message.member!);
		const commands = await getCommands(permissionLevel);
		
		const embed = createMessageEmbed({
			color: 0x33CC33,
			author: "Bot Help",
			fields: commands
				.filter(command => command.commandName != this.commandName)
				.map(command => {
					return {
						"key": command.usageText,
						"value": command.helpText,
					}
			}),
		});

		message.reply({ embed });
		return;
	}

}

