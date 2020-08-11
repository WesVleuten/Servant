import { Guild, Client as DiscordClient } from "discord.js";
import Logger from "../lib/log";
import { SetMutedPermissions, UnmuteWhenExpired } from "../lib/mutedRole";
import MutedRepository from "../repository/muted";
import ServerSettingsRepository from "../repository/serverSettings";

export default async function ReadyEvent(discordClient: DiscordClient) {
	Logger.info(`Ready to serve, found ${discordClient.guilds.cache.size} guilds`);

	await Promise.all(discordClient.guilds.cache.map(guild => CheckGuild(guild)))
	async function CheckGuild(guild: Guild) {
		Logger.info(`Checking for guild ${guild.id}`);
	
		let serverSettings = await ServerSettingsRepository.GetByGuildId(guild.id)
		if (serverSettings === null) {
			ServerSettingsRepository.Create(guild.id);
			Logger.info(`Created guild ${guild.id}`);
		}
		
		serverSettings = await ServerSettingsRepository.GetByGuildId(guild.id)
		if (serverSettings!.muteRole !== null) {
			const muteRole = guild.roles.resolve(serverSettings!.muteRole)
			if (muteRole === null) {
				return;
			}
			SetMutedPermissions(muteRole)

			const muted = await MutedRepository.GetAllRunning(guild.id)
			if (muted === null) { 
				return;
			}
			muted.forEach(m => UnmuteWhenExpired(guild, muteRole, m))
		}
	}
}