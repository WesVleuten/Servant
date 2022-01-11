import { ICommand, PermissionLevel } from './base';
import { Message, Client } from 'discord.js';
import MutedRepository from '../repository/muted';
import ServerSettingsRepository from '../repository/serverSettings';
import ObjectResolver from '../lib/objectResolver';

export default class UnmuteCommand implements ICommand {

	commandName = 'unmute';
	aliases = null;
	permissionLevel = PermissionLevel.Moderator;
	guildOnly = false;

	usageText = ';unmute <user>';
	helpText = 'Unmutes user';

	async run(discordClient: Client, message: Message, args: string[]): Promise<void> {
		if (args.length !== 1) {
			message.reply(this.usageText);
			return;
		}

		const guild = message.guild;
		if (guild === null) {
			message.reply('Command can only be run inside of a guild');
			return;
		}

		const serverSettings = await ServerSettingsRepository.GetByGuildId(guild.id);
		if (serverSettings === null || serverSettings.muteRole === null) {
			message.reply('Muting has not been configured');
			return;
		}

		const objectResolver = new ObjectResolver(discordClient);
		const guildMember = await objectResolver.ResolveGuildMember(guild, args[0]);
		if (!guildMember) {
			message.reply(this.usageText);
			return;
		}

		const muteRole = await message.guild?.roles.fetch(serverSettings.muteRole);
		if (!muteRole) {
			message.reply('Mute role could not be found');
			return;
		}

		const mute = await MutedRepository.GetRunning(guild.id, guildMember.id);
		if (mute === null) {
			message.reply(`User "${guildMember.user.tag}" is not muted`);
			return;
		}

		MutedRepository.SetUnmuted(mute.id, new Date());
		const user = guild.members.resolve(guildMember.id);
		if (user === null) {
			return;
		}

		user.roles.remove(muteRole, 'Mute manually removed via command');
		message.reply(`User "${guildMember.user.tag}" has been unmuted`);
	}
}
