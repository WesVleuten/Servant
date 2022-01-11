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
import { UnmuteWhenExpires } from '../lib/mutedRole';
import ObjectResolver from '../lib/objectResolver';

export default class MuteSlashCommand implements ISlashCommand {

	name = 'mute';
	description = 'Mute a member of the server';
	permissionLevel = PermissionLevel.Moderator;
	guildOnly = true;

	usageText = '/mute <user> <time> <reason>';

	options = [
		{
			name: 'user',
			description: 'User to be muted',
			type: SlashCommandOptionType.USER,
			required: true,
		},
		{
			name: 'time',
			description: 'How long the user should be muted',
			type: SlashCommandOptionType.STRING,
			required: true,
		},
		{
			name: 'reason',
			description: 'Reason why the user is muted',
			type: SlashCommandOptionType.STRING,
			required: false,
		}
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

		if (args.length < 2) {
			return {
				title: 'Error',
				description: 'Missing parameters',
			};
		}

		const targetUser = args.find(x => x.name == 'user')?.value;
		if (!targetUser) {
			return {
				title: 'Error',
				description: 'Could not find target user',
			};
		}
		const mutetime = args.find(x => x.name == 'time')?.value;
		if (!mutetime) {
			return {
				title: 'Error',
				description: 'Could not find mute time',
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

		if (guildMember.id === ctx.user.id) {
			return {
				title: 'Error',
				description: 'You cannot mute yourself',
			};
		}

		const date = this.parseDate(mutetime);
		const reason = args.find(x => x.name == 'reason')?.value ?? 'No reason given';
		const returner: ResponseMessage = {
			author: 'Bot Mod',
			description: 'Mute was successful',
			fields: [
				{
					name: 'User',
					value: `${guildMember.user.tag}`,
					inline: true,
				},
				{
					name: 'Date',
					value: `${date.toUTCString()}`,
					inline: true,
				},
				{
					name: 'Reason',
					value: `${reason}`,
					inline: false,
				}
			],
		};

		const muteRole = await ctx.guild.discordObject.roles.fetch(serverSettings.muteRole);
		if (!muteRole) {
			return {
				title: 'Error',
				description: 'Cant find the mute role',
			};
		}

		const oldMute = await MutedRepository.GetRunning(guildId, guildMember.id);
		if (oldMute !== null) {
			await MutedRepository.SetUnmuted(oldMute.id, new Date());
		}

		const mute = await MutedRepository.Add(guildId, guildMember.id, ctx.user.id, new Date(), date, reason);
		if (!mute) {
			return {
				title: 'Error',
				description: 'Couldnt add mute',
			};
		}

		await guildMember.roles.add(muteRole, 'Automatically muted');

		UnmuteWhenExpires(ctx.guild.discordObject, muteRole, mute);
		return returner;
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
