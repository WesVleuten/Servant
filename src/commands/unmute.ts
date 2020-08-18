import { ICommand, PermissionLevel } from "./base";
import { Message, Client } from "discord.js";
import MutedRepository from "../repository/muted";
import ServerSettingsRepository from "../repository/serverSettings";

export default class UnmuteCommand implements ICommand {
	
	commandName = 'unmute';
	aliases = null;
	permissionLevel = PermissionLevel.Moderator;
	guildOnly = false;

	usageText = ";unmute <user>";
	helpText = "Unmutes user";
	
	async run(discordClient: Client, message: Message, args: string[]) {
		if (args.length !== 1 || message.mentions.members === null || message.mentions.members.size === 0) {
			message.reply(this.usageText);
			return;
		}

		const guildId = message.guild?.id;
		const serverSettings = await ServerSettingsRepository.GetByGuildId(guildId);
		if (serverSettings === null || serverSettings.muteRole === null) {
			message.reply("Muting has not been configured");
			return;
		}
		
		const guildMember = message.mentions.members.first()
		if (!guildMember || !args[0].includes(guildMember!.id)) { 
			message.reply(this.usageText);
			return;
		}

		const muteRole = await message.guild?.roles.fetch(serverSettings.muteRole);
		if (!muteRole) {
			message.reply("Mute role could not be found");
			return;
		}

		const mute = await MutedRepository.GetRunning(guildId, guildMember.id)
		if (mute === null) {
			return;
		}

		MutedRepository.SetUnmuted(mute.id, new Date())
		const user = message.guild!.members.resolve(guildMember.id);
		if (user === null) { 
			return;
		}
	
		user.roles.remove(muteRole, "Mute manually removed via command")
	}
}