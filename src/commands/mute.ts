import { ICommand, PermissionLevel } from './base';
import { Message, Client } from 'discord.js';
import ServerSettingsRepository from '../repository/serverSettings';
import createMessageEmbed from '../wrapper/discord/messageEmbed';
import MutedRepository from '../repository/muted';
import { UnmuteWhenExpires } from '../lib/mutedRole';
import ObjectResolver from '../lib/objectResolver';

export default class MuteCommand implements ICommand {

	commandName = 'mute';
	aliases = null;
	permissionLevel = PermissionLevel.Moderator;
	guildOnly = false;

	usageText = ';mute <user> <time> <reason>';
	helpText = 'Mutes user';

	async run(discordClient: Client, message: Message, args: string[]): Promise<void> {
		const guild = message.guild;
		const guildId = guild?.id;
		const serverSettings = await ServerSettingsRepository.GetByGuildId(guildId);
		if (guild == null || guildId == null || serverSettings === null || serverSettings.muteRole === null) {
			message.reply('Muting has not been configured');
			return;
		}

		if (args.length < 3) {
			message.reply(this.usageText);
			return;
		}

		const objectResolver = new ObjectResolver(discordClient);
		const guildMember = await objectResolver.ResolveGuildMember(guild, args[0]);
		if (!guildMember) {
			message.reply(this.usageText);
			return;
		}

		if (guildMember.id === message.author.id) {
			message.reply('User can\'t mute themselves');
			return;
		}

		const date = this.parseDate(args[1]);
		const reason = args.slice(2).join(' ');
		const embed = createMessageEmbed({
			author: 'Bot Mod',
			fields: [
				{
					key: 'User',
					value: `${guildMember.user.tag}`,
					inline: true,
				},
				{
					key: 'Date',
					value: `${date.toUTCString()}`,
					inline: true,
				},
				{
					key: 'Reason',
					value: `${reason}`,
					inline: false,
				}
			],
		});

		const muteRole = await message.guild?.roles.fetch(serverSettings.muteRole);
		if (!muteRole) {
			message.reply('Mute role could not be found');
			return;
		}

		const oldMute = await MutedRepository.GetRunning(guildId, guildMember.id);
		if (oldMute !== null) {
			await MutedRepository.SetUnmuted(oldMute.id, new Date());
		}

		const mute = await MutedRepository.Add(guildId, guildMember.id, message.author.id, new Date(), date, reason);
		if (!mute) {
			return;
		}

		await guildMember.roles.add(muteRole, 'Automatically muted');
		message.reply({ embed });

		UnmuteWhenExpires(guild, muteRole, mute);
		return;
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
