import { Client as DiscordClient, Presence, GuildMember, Activity, Guild } from 'discord.js';
import ServerSettingsRepository from '../repository/serverSettings';
import StreamTimeoutRepository from '../repository/streamTimeout';
import Logger from '../lib/log';
import TwitchClient from '../lib/twitch';
import { getTextChannel } from '../lib/util';
import createMessageEmbed from '../wrapper/discord/messageEmbed';
import CheckIfWhitelisted from '../lib/checkWhitelist';
import { ServerSettings } from '../interfaces/serverSettings';

export default async function PresenceUpdateEvent(discordClient: DiscordClient, oldPresence: Presence | null, newPresence: Presence): Promise<void> {
	const guildId = newPresence.guild?.id;
	const serverSettings = await ServerSettingsRepository.GetByGuildId(guildId);
	if (serverSettings === null) {
		Logger.error(`Couldnt get server settings for ${guildId}`);
		return;
	}

	const guild = newPresence.guild;
	const guildMember = newPresence.member;

	const streamingActivity = newPresence.activities.find(activity => activity.type == 'STREAMING');
	const wasStreaming = oldPresence?.activities.some(activity => activity.type == 'STREAMING') || false;
	let allowPromotion = true;

	if (!guild || !guildMember) {
		Logger.error('Weird error that shouldnt happen');
		return;
	}

	const whiteListed = await CheckIfWhitelisted(guild.id, streamingActivity, guildMember);

	if (serverSettings.streamShout !== null && whiteListed && serverSettings.streamTimeout > 0) {
		const str = StreamTimeoutRepository.getInstance();
		let timeout = str.get(guildMember.user.id);

		if (streamingActivity !== undefined) {
			if (timeout !== null && new Date() < timeout) {
				allowPromotion = false;
			} else {
				timeout = new Date();
				timeout.setTime(timeout.getTime() + (serverSettings.streamTimeout*3600000));
				str.set(guildMember.user.id, timeout);
			}
		}
	}

	if (serverSettings.streamLiveRole !== null) {
		await LiveRole(discordClient, serverSettings, guild, guildMember, whiteListed);
	}

	if (allowPromotion && serverSettings.streamShout !== null) {
		await StreamShout(discordClient, serverSettings, oldPresence, newPresence, wasStreaming, whiteListed, streamingActivity);
	}
}

async function LiveRole(discordClient: DiscordClient, serverSettings: ServerSettings, guild: Guild, guildMember: GuildMember, whiteListed: boolean) {
	if (!serverSettings?.streamLiveRole) {
		// Stream live role not configured
		return;
	}

	const liverole = await guild.roles.fetch(serverSettings.streamLiveRole);

	if (!liverole) {
		Logger.error('Role with key \'liverole\' was not found');
		return;
	}

	if (guildMember.roles.cache.has(serverSettings.streamLiveRole) && !whiteListed) {
		await guildMember.roles.remove(liverole);
	} else if (whiteListed) {
		await guildMember.roles.add(liverole);
	}
}

async function StreamShout(discordClient: DiscordClient, serverSettings: ServerSettings, oldPresence: Presence | null, newPresence: Presence, wasStreaming: boolean, whiteListed: boolean, streamingActivity: Activity|undefined) {
	if (!oldPresence || !newPresence?.member || wasStreaming || !streamingActivity?.url || !whiteListed || !serverSettings?.streamShout) {
		return;
	}

	const guildMember = newPresence.member;

	const promotionChannel = getTextChannel(discordClient, serverSettings.streamShout);
	if (!promotionChannel) {
		Logger.error('Channel with key \'streamShout\' was not found');
		return;
	}

	const streamUrl = streamingActivity.url;
	const streamUsername = streamUrl.substr(22);

	const twitch = TwitchClient.getInstance();
	const stream = await twitch.getStreamer(streamUsername);
	if (!stream) {
		Logger.error('Could not get stream from twitch');
		return;
	}

	const thumbnail = stream.thumbnail_url.replace('{width}x{height}', '384x216');

	const embed = createMessageEmbed({
		color: 'random',
		author: `${guildMember.displayName}`,
		authorIcon: `${guildMember.user.displayAvatarURL()}`,
		description: `**Streamer:** ${stream.user_name}`,
		image: thumbnail,
		fields: [
			{
				key: '**Stream Title:**',
				value: `${stream.title}`,
			},
			{
				key: '**Stream URL:**',
				value: `${streamUrl}`,
			},
		],
	});

	promotionChannel.send({ embed });
}
