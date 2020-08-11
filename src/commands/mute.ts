
import { ICommand, PermissionLevel } from "./base";
import { Message, Client } from "discord.js";
import ServerSettingsRepository from "../repository/severSettings";
import createMessageEmbed from "../wrapper/discord/messageEmbed";
import MutedRepository from "../repository/muted";
import { UnmuteWhenExpired } from '../lib/mutedRole';

export default class MuteCommand implements ICommand {

	commandName = 'mute';
	aliases = null;
	permissionLevel = PermissionLevel.Moderator;
	guildOnly = false;

	usageText = ";mute <user> <time> <reason>";
	helpText = "Mutes user";
	
	async run(discordClient: Client, message: Message, args: string[]) {
		const guildId = message.guild?.id;
		const serverSettings = await ServerSettingsRepository.GetByGuildId(guildId);
		if (serverSettings === null || serverSettings.muteRole === null) {
			return;
		}

		if (args.length < 3 || message.mentions.members === null || message.mentions.members.size === 0) { 
			return;
		}

		const guildMember = message.mentions.members.first()
		if (!guildMember || !args[0].includes(guildMember.id) || guildMember.id === message.author.id) { 
			return;
		}

		const date = this.parseDate(args[1]);
		const reason = args.slice(2).join(" ");

		const embed = createMessageEmbed({
			author: "Bot Mod",
			fields: [
				{
					key: "User",
					value: `${args[0]}`,
					inline: true,
				},
				{
					key: "Date",
					value: `${date.toUTCString()}`,
					inline: true,
				},
				{
					key: "Reason",
					value: `${reason}`,
					inline: false,
				}
			],
		})
		
		const muteRole = await message.guild?.roles.fetch(serverSettings.muteRole);
		if (!muteRole) {
			return;
		}
		
		const oldMute = await MutedRepository.GetRunning(guildId, guildMember.id)
		if (oldMute !== null) {
			await MutedRepository.SetUnmuted(oldMute.id, new Date())
		}

		const mute = await MutedRepository.Add(guildId, guildMember.id, message.author.id, new Date(), date, reason)
		if (!mute) { 
			return;
		}
		
		await guildMember!.roles.add(muteRole, "Automatically muted")
		message.reply({ embed });

		UnmuteWhenExpired(message.guild!, muteRole, mute)
		return;
	}

	parseDate(str: string) {
		var date = new Date();

		var years = str.match(/(\d+)\s*Y/);
		var months = str.match(/(\d+)\s*M/);
		var weeks = str.match(/(\d+)\s*W/);
		var days = str.match(/(\d+)\s*d/);
		var hours = str.match(/(\d+)\s*h/);
		var minutes = str.match(/(\d+)\s*m/);
		var seconds = str.match(/(\d+)\s*s/);

		if (years) { date.setFullYear(date.getFullYear() + parseInt(years.toString(), 10)) }
		if (months) { date.setMonth(date.getMonth() + parseInt(months.toString(), 10)) }
		if (weeks) { date.setDate(date.getDate() + 7 * parseInt(weeks.toString(), 10)) }
		if (days) { date.setDate(date.getDate() + parseInt(days.toString(), 10)) }
		if (hours) { date.setHours(date.getHours() + parseInt(hours.toString(), 10)) }
		if (minutes) { date.setMinutes(date.getMinutes() + parseInt(minutes.toString(), 10)) }
		if (seconds) { date.setSeconds(date.getSeconds() + parseInt(seconds.toString(), 10)) }

		return date;
	}

}