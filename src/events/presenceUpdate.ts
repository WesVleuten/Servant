import { Client as DiscordClient, Presence } from "discord.js";
import ServerSettingsRepository from "../repository/severSettings";
import WhiteListedGamesRepository from "../repository/whiteListedGames";
import StreamBuffer from "../repository/streamBuffer";
import Logger from "../lib/log";
import TwitchClient from "../lib/twitch";
import { getTextChannel } from "../lib/util";
import createMessageEmbed from "../wrapper/discord/messageEmbed";

export default async function PresenceUpdateEvent(discordClient: DiscordClient, oldPresence: Presence | null, newPresence: Presence) {
	const guildId = newPresence.guild?.id;
	const serverSettings = await ServerSettingsRepository.GetByGuildId(guildId);
	if (serverSettings === null) {
		Logger.error(`Couldnt get server settings for ${guildId}`);
		return;
	}

	const guild = newPresence.guild;
	const guildMember = newPresence.member;

	const streamingActivity = newPresence.activities.find(activity => activity.type == "STREAMING");
	const wasStreaming = oldPresence?.activities.some(activity => activity.type == "STREAMING") || false;

	if (!guild || !guildMember) {
		Logger.error('Weird error that shouldnt happen');
		return;
	}

	const whiteListed = await CheckGameWhitelisted(streamingActivity);
	
	if ((serverSettings.streamLiveRole !== null || serverSettings.streamShout !== null) && whiteListed) {
		const sb = StreamBuffer.getInstance()
		let timeout = sb.get(guildMember.user.id)

		if (streamingActivity !== undefined) {
			if (timeout !== null && timeout < new Date()) {
				return;
			} else {
				timeout = new Date()
				timeout.setTime(timeout.getTime() + (serverSettings.streamTimeout*3600000))
				sb.set(guildMember.user.id, timeout)
			}
		}
	}

	if (serverSettings.streamLiveRole !== null) {
		const liverole = await guild.roles.fetch(serverSettings.streamLiveRole);

		if (!liverole) {
			Logger.error(`Role with key 'liverole' was not found`);
			return;
		}

		if (guildMember.roles.cache.has(serverSettings.streamLiveRole) && streamingActivity === undefined) {
			await guildMember.roles.remove(liverole)
		} else if (whiteListed) {
			await guildMember.roles.add(liverole)
		}
	}

	if (serverSettings.streamShout !== null) {
		if (!oldPresence || !newPresence || wasStreaming || !streamingActivity || !streamingActivity.url || !whiteListed) {
			return;
		}

		const promotionChannel = getTextChannel(discordClient, serverSettings.streamShout);
		if (!promotionChannel) {
			Logger.error(`Channel with key 'streamShout' was not found`);
			return;
		}

		const streamUrl = streamingActivity.url;
		const streamUsername = streamUrl.substr(22);
		
		const twitch = TwitchClient.getInstance()
		const stream = await twitch.getStreamer(streamUsername);
		if (!stream) { 
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
					key: "**Stream Title:**",
					value: `${stream.title}`,
				},
				{
					key: "**Stream URL:**",
					value: `${streamUrl}`,
				},
			],
		});
			
		promotionChannel.send({ embed });
			
	}

	async function CheckGameWhitelisted(streamingActivity: any): Promise<boolean> {
		if (streamingActivity === undefined || !streamingActivity.url) { 
			return false;
		}

		const streamUrl = streamingActivity.url;
		const streamUsername = streamUrl.substr(22);
		
		const twitch = TwitchClient.getInstance()
		const stream = await twitch.getStreamer(streamUsername);
		if (!stream) { 
			return false;
		}

		const wlg = await WhiteListedGamesRepository.GetByGuildId(guildId);
		if (!wlg) {
			return true;
		}

		if (wlg.length > 0 && wlg.find(g => g.id === stream.game_id) === undefined) {
			return false;
		}	

		return true;
	}

}