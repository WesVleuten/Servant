import { Client as DiscordClient, Presence, GuildMember } from "discord.js";
import ServerSettingsRepository from "../repository/severSettings";
import WhiteListRepository from "../repository/whiteList";
import StreamTimeoutRepository from "../repository/streamTimeout";
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

	const whiteListed = await CheckIfWhitelisted(streamingActivity, guildMember);
	
	if ((serverSettings.streamLiveRole !== null || serverSettings.streamShout !== null) && whiteListed && serverSettings.streamTimeout > 0) {
		const str = StreamTimeoutRepository.getInstance()
		let timeout = str.get(guildMember.user.id)

		if (streamingActivity !== undefined) {
			if (timeout !== null && timeout < new Date()) {
				return;
			} else {
				timeout = new Date()
				timeout.setTime(timeout.getTime() + (serverSettings.streamTimeout*3600000))
				str.set(guildMember.user.id, timeout)
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

	async function CheckIfWhitelisted(streamingActivity: any, member: GuildMember): Promise<boolean> {
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

		const wl = await WhiteListRepository.GetByGuildId(guildId);
		if (!wl) {
			return true;
		}

		const gameWhiteListed = wl.roles.length === 0 || wl.games.find(g => g.id === stream.game_id) === undefined;
		const roleWhiteListed = wl.roles.length === 0 || wl.roles.find(r1 => member.roles.cache.find(r2 => r1.id === r2.id) !== undefined) === undefined;

		return gameWhiteListed && roleWhiteListed;
	}

}