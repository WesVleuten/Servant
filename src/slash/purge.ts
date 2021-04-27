import {
	ISlashCommand,
	PermissionLevel,
	SlashCommandOptionType,
	SlashCommandArgument,
	ResponseMessage,
	Context,
	DiscordClient,
} from './base';

export default class PurgeSlashCommand implements ISlashCommand {

	name = 'purge';
	description = 'Purge messages';
	permissionLevel = PermissionLevel.Moderator;
	guildOnly = true;

	usageText = '/mute <amount> <user>';

	options = [
		{
			name: 'amount',
			description: 'Number of messages that should be deleted',
			type: SlashCommandOptionType.INTEGER,
			required: true,
		},
		{
			name: 'user',
			description: 'Limit deletion to only one user',
			type: SlashCommandOptionType.USER,
			required: false,
		},
	];

	async run(discordClient: DiscordClient, ctx: Context, args: SlashCommandArgument[]): Promise<ResponseMessage|undefined> {
		if (!ctx.guild) {
			return {
				title: 'Error',
				description: 'Command can only be ran within a server',
			};
		}

		let amount = parseInt(args.find(x => x.name == 'amount')?.value ?? '0', 10);
		const userfilter = args.find(x => x.name == 'user')?.value ?? null;

		if (isNaN(amount) || amount == 0) {
			return {
				title: 'Error',
				description: 'Please specify an amount of messages to be purged.',
			};
		}

		if (userfilter !== null) {
			// Up the amount massively so it can be filtered on a specific user
			amount *= 4;
		}

		let fetched = await ctx.channel.discordObject.messages.fetch({ limit: amount });
		if (userfilter !== null) {
			// Bring amount back down again
			amount /= 4;

			const maxTimestamp = new Date();
			maxTimestamp.setDate((new Date()).getDate() - 14);

			fetched = fetched.filter(m => m.author.id === userfilter && m.createdAt > maxTimestamp);
			while (fetched.size > amount) {
				const next = fetched.lastKey();
				if (!next) {
					break;
				}

				fetched.delete(next);
			}
		}

		await ctx.channel.discordObject.bulkDelete(fetched);

		return {
			title: 'Success',
			description: `${fetched.size} message(s) has been deleted.`,
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
