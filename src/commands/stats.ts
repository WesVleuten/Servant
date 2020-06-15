import { ICommand, PermissionLevel } from "./base";
import { Message, Client, version as DiscordVersion } from "discord.js";
import * as fs from 'fs-extra';
import createEmbed from "../wrapper/discord/messageEmbed";

async function getBuildHash() {
	try {
		const data = await fs.readFile('./build.txt', 'utf8');
		const details = data.split('\n');
		return `${details[0]}/${details[1].slice(0,10)}`;
	} catch(e) {
		return 'Unk';
	}
}

async function getDuration(timespan: number|null) {
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

export default class StatsCommand implements ICommand {

	commandName = 'stats';
	aliases = null;
	permissionLevel = PermissionLevel.User;
	guildOnly = false;

	usageText = ";stats";
	helpText = "Shows bot stats";

	async run(discordClient: Client, message: Message, args: string[]) {
		const build = await getBuildHash();
		const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
		const uptime = await getDuration(discordClient.uptime);

		const embed = createEmbed({
			color: 0x33CC33,
			author: "Bot statistics",
			footer: `Servant developed by Westar, originally by Danskbog`,
			fields: [
				{
					key: "Build",
					value: `${build}`,
					inline: true,
				},
				{
					key: "Memory Usage",
					value: `${memoryUsage} MB`,
					inline: true,
				},
				{
					key: "Uptime",
					value: `${uptime}`,
					inline: false,
				},
				{
					key: "Discord.js",
					value: `${DiscordVersion}`,
					inline: true,
				},
				{
					key: "Node",
					value: `${process.version}`,
					inline: true,
				},
			],
		});

		message.channel.send({embed});
	}

}

