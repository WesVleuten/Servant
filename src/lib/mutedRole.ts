import { GuildChannel, Role, Guild } from "discord.js";
import ServerSettingsRepository from "../repository/severSettings";
import MutedRepository from "../repository/muted";
import Mute from "../interfaces/mute";

export async function SetMutedPermissions(mutedRole: Role) {
  const serverSettings = await ServerSettingsRepository.GetByGuildId(mutedRole.guild.id);
	if (serverSettings === null) {
		return;
  }

  let muteChannel: GuildChannel | null;
  if (serverSettings.muteChannel !== null) {
    muteChannel = mutedRole.guild.channels.resolve(serverSettings.muteChannel);
  } else { 
    muteChannel = null;
  }
  
	await Promise.all(mutedRole.guild.channels.cache.map(channel => SetMutedPermissionsForChannel(mutedRole, channel, muteChannel)))
}

export async function SetMutedPermissionsForChannel(mutedRole: Role, channel: GuildChannel, muteChannel: GuildChannel | null) {
  if (muteChannel !== null && channel.equals(muteChannel)) { 
    return;
  }

  await channel.createOverwrite(mutedRole, {
    SEND_MESSAGES: false,
    CONNECT: false,
    ADD_REACTIONS: false
  }, "Automatic mute role permissions");
}

export async function UnmuteWhenExpired(guild: Guild, mutedRole: Role, mute: Mute) {
  if (mute.until > new Date()) {
    await new Promise(function (resolve) {
      setTimeout(resolve, mute.until.getTime() - new Date().getTime());
    });
  }

  MutedRepository.Remove(mute.guildId, mute.userId)
  const user = guild.members.resolve(mute.userId);
  if (user === null) { 
    return;
  }

  user.roles.remove(mutedRole, "Mute automatically expired")
}
