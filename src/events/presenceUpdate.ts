import { Client as DiscordClient, Presence, MessageEmbed } from "discord.js";
import ServerSettingsRepository from "../repository/severSettings";
import WhiteListedGamesRepository from "../repository/whiteListedGames";
import Logger from "../lib/log";
import TwitchClient from "../lib/twitch";
import { getTextChannel } from "../lib/util";

export default async function PresenceUpdateEvent(discordClient: DiscordClient, oldPresence: Presence | null, newPresence: Presence) {
	const randomColor = "#000000".replace(/0/g, () => (~~(Math.random() * 16)).toString(16));

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
		const embed = new MessageEmbed()
			.setColor(randomColor)
			.setImage(thumbnail)
			.setAuthor(`${guildMember.displayName}`, `${guildMember.user.displayAvatarURL()}`)
			.setDescription(`**Streamer:** ${stream.user_name}`)
			.addField("**Stream Title:**", `${stream.title}`, false)
			.addField("**Stream URL:**", `${streamUrl}`, false);
			
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
			return false;
		}

		if (wlg.length > 0 && wlg.find(g => g.id === stream.game_id) === undefined) {
			return false;
		}	

		return true;
	}

}