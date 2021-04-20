import {
	ISlashCommand,
	PermissionLevel,
	ResponseMessage,
	DiscordClient,
} from './base';

import * as fs from 'fs-extra';
import { version as DiscordVersion } from 'discord.js';

async function getBuildHash(): Promise<string> {
	try {
		const data = await fs.readFile('./build.txt', 'utf8');
		const details = data.split('\n');
		return `${details[0]}/${details[1].slice(0,10)}`;
	} catch(e) {
		return 'Unk';
	}
}

async function getDuration(timespan: number|null): Promise<string> {
	if (timespan == null) {
		return 'Unk';
	}

	const secondspan = 1000;
	const minutespan = 60 * secondspan;
	const hourspan = 60 * minutespan;
	const dayspan = 24 * hourspan;

	const days = Math.floor(timespan / dayspan);
	timespan %= dayspan;
	const hours = Math.floor(timespan / hourspan);
	timespan %= hourspan;
	const minutes = Math.floor(timespan / minutespan);
	timespan %= minutespan;
	const seconds = Math.floor(timespan / secondspan);

	let output = '';
	if (days > 0) {
		output += `${days}d, `;
	}
	if (hours > 0 || days > 0) {
		output += `${hours}h, `;
	}
	if (minutes > 0 || hours > 0 || days > 0) {
		output += `${minutes}m, `;
	}
	if (seconds > 0 || minutes > 0 || hours > 0 || days > 0) {
		output += `${seconds}s`;
	}
	return output;
}

export default class PollSlashCommand implements ISlashCommand {

	name = 'stats';
	description = 'Get servant stats';
	permissionLevel = PermissionLevel.User;
	guildOnly = true;

	usageText = '/stats';

	options = [];

	async run(discordClient: DiscordClient): Promise<ResponseMessage|undefined> {
		const build = await getBuildHash();
		const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
		const uptime = await getDuration(discordClient.uptime);

		return {
			color: 0x33CC33,
			author: 'Bot statistics',
			footer: 'Servant developed by Westar and Notfood, originally by Danskbog',
			fields: [
				{
					name: 'Build',
					value: `${build}`,
					inline: true,
				},
				{
					name: 'Memory Usage',
					value: `${memoryUsage} MB`,
					inline: true,
				},
				{
					name: 'Uptime',
					value: `${uptime}`,
					inline: false,
				},
				{
					name: 'Discord.js',
					value: `${DiscordVersion}`,
					inline: true,
				},
				{
					name: 'Node',
					value: `${process.version}`,
					inline: true,
				},
			],
		};
	}

}
