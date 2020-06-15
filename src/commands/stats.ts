import { ICommand, PermissionLevel } from "./base";
import { Message, Client, MessageEmbed, version as DiscordVersion } from "discord.js";
import * as fs from 'fs-extra';

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

		const embed = new MessageEmbed()
			.setColor(0x33CC33)
			.setTimestamp()
			.setAuthor("Bot statistics")
			.addField("Build", `${build}`, true)
			.addField("Memory Usage", `${memoryUsage} MB`, true)
			.addField("Uptime", `${uptime}`, false)
			.addField("Discord.js", `${DiscordVersion}`, true)
			.addField("Node", `${process.version}`, true)
			.setFooter(`Servant developed by Westar and Notfood, originally by Danskbog`);
		message.channel.send({embed});
	}

}

