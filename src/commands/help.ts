import { ICommand, PermissionLevel } from "./base";
import { Message, Client } from "discord.js";
import { getCommands } from "../routes";
import ServerSettingsRepository from "../repository/severSettings";
import Logger from "../lib/log";
import config from "../lib/config";
import createMessageEmbed from "../wrapper/discord/messageEmbed";

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

		let permissionLevel = PermissionLevel.User;
		if (message.author.id === config.botOwnerUserId) {
			permissionLevel = PermissionLevel.BotOwner;
		} else if (message.author.id === message.guild?.ownerID) {
			permissionLevel = PermissionLevel.Administrator;
		} else if (serverSettings.adminRole && message.member?.roles.cache.has(serverSettings.adminRole)) {
			permissionLevel = PermissionLevel.Administrator;
		} else if (serverSettings.moderatorRole && message.member?.roles.cache.has(serverSettings.moderatorRole)) {
			permissionLevel = PermissionLevel.Moderator;
		}

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

