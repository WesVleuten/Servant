import {
	ISlashCommand,
	PermissionLevel,
	SlashCommandOptionType,
	SlashCommandArgument,
	ResponseMessage,
	Context,
	DiscordClient,
} from './base';

import ServerSettingsRepository from '../repository/serverSettings';
import MutedRepository from '../repository/muted';
import ObjectResolver from '../lib/objectResolver';

export default class UnmuteSlashCommand implements ISlashCommand {

	name = 'unmute';
	description = 'Unmute a member of the server';
	permissionLevel = PermissionLevel.Moderator;
	guildOnly = true;

	usageText = '/unmute <user>';

	options = [
		{
			name: 'user',
			description: 'User to be muted',
			type: SlashCommandOptionType.USER,
			required: true,
		},
	];

	async run(discordClient: DiscordClient, ctx: Context, args: SlashCommandArgument[]): Promise<ResponseMessage|undefined> {
		if (!ctx.guild) {
			return {
				title: 'Error',
				description: 'Command can only be ran within a server',
			};
		}
		const guild = ctx.guild;
		const guildId = guild.id;
		const serverSettings = await ServerSettingsRepository.GetByGuildId(guildId);
		if (!serverSettings || !serverSettings.muteRole) {
			return {
				title: 'Error',
				description: 'No mute role set',
			};
		}

		const targetUser = args.find(x => x.name == 'user')?.value;
		if (!targetUser) {
			return {
				title: 'Error',
				description: 'Could not find target user',
			};
		}

		const objectResolver = new ObjectResolver(discordClient);
		const guildMember = await objectResolver.ResolveGuildMember(guild.discordObject, targetUser);
		if (!guildMember) {
			return {
				title: 'Error',
				description: 'Could not find user',
			};
		}

		const mute = await MutedRepository.GetRunning(guild.id, guildMember.id);
		if (mute === null) {
			return {
				title: 'Error',
				description: `User "${guildMember.user.tag}" is not muted`,
			};
		}

		MutedRepository.SetUnmuted(mute.id, new Date());
		const muteRole = await guild.discordObject.roles.fetch(serverSettings.muteRole);
		guildMember.roles.remove(muteRole, 'Mute manually removed via command');
		return {
			title: 'Success',
			description: 'User unmuted',
		};
	}

	parseDate(str: string): Date {
		const date = new Date();

		const years = str.match(/(\d+)\s*Y/);
		const months = str.match(/(\d+)\s*M/);
		const weeks = str.match(/(\d+)\s*W/);
		const days = str.match(/(\d+)\s*d/);
		const hours = str.match(/(\d+)\s*h/);
		const minutes = str.match(/(\d+)\s*m/);
		const seconds = str.match(/(\d+)\s*s/);

		if (years) { date.setFullYear(date.getFullYear() + parseInt(years.toString(), 10)); }
		if (months) { date.setMonth(date.getMonth() + parseInt(months.toString(), 10)); }
		if (weeks) { date.setDate(date.getDate() + 7 * parseInt(weeks.toString(), 10)); }
		if (days) { date.setDate(date.getDate() + parseInt(days.toString(), 10)); }
		if (hours) { date.setHours(date.getHours() + parseInt(hours.toString(), 10)); }
		if (minutes) { date.setMinutes(date.getMinutes() + parseInt(minutes.toString(), 10)); }
		if (seconds) { date.setSeconds(date.getSeconds() + parseInt(seconds.toString(), 10)); }

		return date;
	}

}
