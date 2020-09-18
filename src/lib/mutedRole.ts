import { GuildChannel, Role, Guild } from "discord.js";
import ServerSettingsRepository from "../repository/serverSettings";
import MutedRepository from "../repository/muted";
import Mute from "../interfaces/mute";

export async function SetMutedPermissions(mutedRole: Role) {
	const serverSettings = await ServerSettingsRepository.GetByGuildId(mutedRole.guild.id);
	if (serverSettings === null) {
		return;
	}
	
	await Promise.all(mutedRole.guild.channels.cache
		.filter(channel => channel.type === "voice" || channel.type === "text")
		.map(channel => SetMutedPermissionsForChannel(mutedRole, channel, serverSettings.muteChannel)))
}

export async function SetMutedPermissionsForChannel(mutedRole: Role, channel: GuildChannel, muteChannelId: string|null) {
	if (!muteChannelId !== null && channel.id === muteChannelId) {
		await channel.createOverwrite(mutedRole, {
			VIEW_CHANNEL: true,
			SEND_MESSAGES: true,
			ADD_REACTIONS: false
		}, "Automatic mute role permissions");
		return;
	}

	await channel.createOverwrite(mutedRole, {
		SEND_MESSAGES: false,
		CONNECT: false,
		ADD_REACTIONS: false
	}, "Automatic mute role permissions");
}

export async function CheckExpires(guild: Guild, mutedRole: Role) {
	const interval = 24 * 60 * 60 * 1000; // 1 day
	while (true) {
		await new Promise(async function (resolve) {
			setTimeout(resolve, interval);
		});
		
		const mutes = await MutedRepository.GetAllRunning(guild.id);
		mutes?.forEach(mute => UnmuteWhenExpires(guild, mutedRole, mute));
	}
}

export async function UnmuteWhenExpires(guild: Guild, mutedRole: Role, mute: Mute) {
	const interval = 24 * 60 * 60 * 1000; // 1 day
	if (mute.until.getTime() - new Date().getTime() > interval) {
		return;
	}
	
	await new Promise(async function (resolve) {
		setTimeout(resolve, mute.until.getTime() - new Date().getTime());
	});
	
	MutedRepository.SetUnmuted(mute.id, new Date())
	const user = guild.members.resolve(mute.userId);
	if (user === null) { 
		return;
	}

	user.roles.remove(mutedRole, "Mute automatically expired")
}