import { GuildChannel, Role, Guild } from 'discord.js';
import ServerSettingsRepository from '../repository/serverSettings';
import MutedRepository from '../repository/muted';
import { Mute } from '../interfaces/mute';

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function SetMutedPermissions(mutedRole: Role): Promise<void> {
	const serverSettings = await ServerSettingsRepository.GetByGuildId(mutedRole.guild.id);
	if (serverSettings === null) {
		return;
	}

	await Promise.all(mutedRole.guild.channels.cache
		.filter(channel => channel.type === 'voice' || channel.type === 'text')
		.map(channel => SetMutedPermissionsForChannel(mutedRole, channel, serverSettings.muteChannel)));
}

export async function SetMutedPermissionsForChannel(mutedRole: Role, channel: GuildChannel, muteChannelId: string|null): Promise<void> {
	if (!muteChannelId !== null && channel.id === muteChannelId) {
		await channel.createOverwrite(mutedRole, {
			VIEW_CHANNEL: true,
			SEND_MESSAGES: true,
			ADD_REACTIONS: false
		}, 'Automatic mute role permissions');
		return;
	}

	await channel.createOverwrite(mutedRole, {
		SEND_MESSAGES: false,
		CONNECT: false,
		ADD_REACTIONS: false
	}, 'Automatic mute role permissions');
}

export async function CheckExpires(guild: Guild, mutedRole: Role): Promise<void> {
	const interval = 24 * 60 * 60 * 1000; // 1 day
	/* eslint-disable no-constant-condition */
	while (true) {
		await sleep(interval);

		const mutes = await MutedRepository.GetAllRunning(guild.id);
		mutes?.forEach(mute => UnmuteWhenExpires(guild, mutedRole, mute));
	}
}

export async function UnmuteWhenExpires(guild: Guild, mutedRole: Role, mute: Mute): Promise<void> {
	const interval = 24 * 60 * 60 * 1000; // 1 day
	if (mute.until.getTime() - new Date().getTime() > interval) {
		return;
	}

	const waittime = mute.until.getTime() - new Date().getTime();
	await sleep(waittime);

	MutedRepository.SetUnmuted(mute.id, new Date());
	const user = guild.members.resolve(mute.userId);
	if (user === null) {
		return;
	}

	user.roles.remove(mutedRole, 'Mute automatically expired');
}
