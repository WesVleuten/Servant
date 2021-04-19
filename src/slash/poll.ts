import {
	ISlashCommand,
	PermissionLevel,
	SlashCommandOptionType,
	SlashCommandArgument,
	SlashCommandResponse,
	Context,
	DiscordClient,
} from './base';

import ServerSettingsRepository from '../repository/serverSettings';
import MutedRepository from '../repository/muted';
import { UnmuteWhenExpires } from '../lib/mutedRole';
import ObjectResolver from '../lib/objectResolver'
import createMessageEmbed from '../wrapper/discord/messageEmbed';
import { TextChannel } from 'discord.js';

export default class PollSlashCommand implements ISlashCommand {

	name = 'poll';
	description = 'Makes a simple poll';
	permissionLevel = PermissionLevel.User;
	guildOnly = true;

	usageText = '/poll <question> <option1> <option2>...';

	options = [
		{
			name: 'question',
			description: 'Question to be asked',
			type: SlashCommandOptionType.STRING,
			required: true,
		},
		{
			name: 'option1',
			description: 'Option for the poll',
			type: SlashCommandOptionType.STRING,
			required: false,
		},
		{
			name: 'option2',
			description: 'Option for the poll',
			type: SlashCommandOptionType.STRING,
			required: false,
		},
		{
			name: 'option3',
			description: 'Option for the poll',
			type: SlashCommandOptionType.STRING,
			required: false,
		},
		{
			name: 'option4',
			description: 'Option for the poll',
			type: SlashCommandOptionType.STRING,
			required: false,
		},
		{
			name: 'option5',
			description: 'Option for the poll',
			type: SlashCommandOptionType.STRING,
			required: false,
		}
	];

	agreeEmoji = '772552297075048468';
	disagreeEmoji = '772552252782411816';

	async run(discordClient: DiscordClient, ctx: Context, args: SlashCommandArgument[]): Promise<SlashCommandResponse|undefined> {
		if (!ctx.guild) {
			return;
		}

		let pollContent = args.find(x => x.name == "question")?.value;
		if (!pollContent) {
			return;
		}
		const icons = [
			'1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣',
		];
		const usedIcons: string[] = [];

		if (args.length > 1) {
			let options = ['', '', '', '', ''];
			for (let i = 1; i < 6; i++) {
				const value = args.find(x => x.name == 'option' + i)?.value;
				if (value) {
					options[i] = (icons[i - 1] + ' : ' + value) ?? '';
					usedIcons.push(icons[i - 1]);
				}
			}
			pollContent += '\n\n' + options.filter(x => !!x).join('\n');
		}

		const embed = createMessageEmbed({
			color: 0x33CC33,
			title: 'QuickPoll',
			description: pollContent,
			thumbnail: 'https://i.ibb.co/Y08zHnb/Pika.png',
			footer: 'Reminder: Use */poll <question>* to create a new poll'
		});

		const guildchannel = ctx.guild.discordObject.channels.resolve(ctx.channel_id);
		if (!guildchannel || guildchannel.type !== 'text') {
			return;
		}
		const channel = guildchannel as TextChannel;

		const sendMessage = await channel.send({embed});
		const promises: Promise<any>[] = [];
		if (args.length > 1) {
			for (const i of usedIcons) {
				promises.push(sendMessage.react(i));
			}
		} else {
			promises.push(sendMessage.react(this.agreeEmoji));
			promises.push(sendMessage.react(this.disagreeEmoji));
		}
		await Promise.all(promises);

		return {
			title: 'Poll created',
			footer: { text: 'Auto deleting this message in 10 seconds...' },
			deleteTimeout: 10000,
		};
	}

}