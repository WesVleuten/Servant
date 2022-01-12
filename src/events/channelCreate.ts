import { Client as DiscordClient, GuildChannel } from 'discord.js';
import ServerSettingsRepository from '../repository/serverSettings';
import { SetMutedPermissionsForChannel } from '../lib/mutedRole';

export default async function ChannelCreateEvent(discordClient: DiscordClient, channel: GuildChannel): Promise<void> {
    if (!channel?.id || !channel?.guild?.id) {
        return;
    }
	const serverSettings = await ServerSettingsRepository.GetByGuildId(channel.guild.id);
	if (serverSettings != null && serverSettings?.muteRole !== null) {
		const muteRole = channel.guild.roles.resolve(serverSettings.muteRole);
		if (muteRole !== null) {
			SetMutedPermissionsForChannel(muteRole, channel, null);
		}
	}
}
