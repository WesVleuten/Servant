import { Client as DiscordClient, GuildChannel } from "discord.js";
import ServerSettingsRepository from "../repository/serverSettings";
import { SetMutedPermissionsForChannel } from "../lib/mutedRole";

export default async function ChannelCreateEvent(discordClient: DiscordClient, channel: GuildChannel) {
	let serverSettings = await ServerSettingsRepository.GetByGuildId(channel.guild.id)
	if (serverSettings === null) {
		return;
	}

	if (serverSettings!.muteRole !== null) {
		let muteChannel: GuildChannel | null;
		if (serverSettings.muteChannel !== null) {
			muteChannel = channel.guild.channels.resolve(serverSettings.muteChannel);
		} else { 
			muteChannel = null;
		}

		const muteRole = channel.guild.roles.resolve(serverSettings!.muteRole)
		if (muteRole !== null) {
			SetMutedPermissionsForChannel(muteRole, channel, muteChannel)
		}
	}
}