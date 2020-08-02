import { ICommand, PermissionLevel } from "./base";
import { Message, Client } from "discord.js";
import ServerSettingsRepository from "../repository/serverSettings";
import Logger from "../lib/log";
import CheckIfWhitelisted from "../lib/checkWhitelist";

export default class LiveResetCommand implements ICommand {

	commandName = 'livereset';
	aliases = null;
	permissionLevel = PermissionLevel.BotOwner;
	guildOnly = true;

	usageText = ";livereset";
	helpText = "Manually checks all live roles";

	async run(discordClient: Client, message: Message, args: string[]) {
		const guildId = message.guild?.id;
		const ss = await ServerSettingsRepository.GetByGuildId(guildId);
		if (!ss || !message.guild) {
			return;
		}
		const guild = message.guild;

		if (ss.streamLiveRole === null) {
			message.reply(`No live role set`);
			return
		}
		const liverole = await guild.roles.fetch(ss.streamLiveRole);

		if (!liverole) {
			Logger.error(`ERR: role with key 'liverole' was not found`);
			return;
		}

		let additions = 0;
		let removals = 0;

		const members = await guild.members.fetch({ limit: 1000, time: 1000 });
		for (const [memberId, member] of members) {
			const streamingActivity = member.presence.activities.find(activity => activity.type == "STREAMING");
			const whiteListed = await CheckIfWhitelisted(guildId, streamingActivity, member);
			
			if (member.roles.cache.has(ss.streamLiveRole) && !whiteListed) {
				await member.roles.remove(liverole);
				removals++;
			} else if (whiteListed) {
				await member.roles.add(liverole);
				additions++;
			}
		}
		message.reply(`Processed ${members.size} member(s)\nAdded: ${additions} role(s), Removed: ${removals} role(s)`);
	}

}
