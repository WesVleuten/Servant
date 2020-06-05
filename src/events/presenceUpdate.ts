import { Client as DiscordClient, Presence, MessageEmbed } from "discord.js";
import ServerSettingsRepository from "../repository/severSettings";
import Logger from "../lib/log";
import { getTextChannel } from "../lib/util";
import config from "../lib/config";
import fetchRetry from "../lib/fetchRetry";
import fetch from "node-fetch";

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

	if (serverSettings.streamLiveRole !== null) {
		const liverole = await guild.roles.fetch(serverSettings.streamLiveRole);

		if (!liverole) {
			Logger.error(`Role with key 'liverole' was not found`);
			return;
		}
		if (guildMember.roles.cache.has(serverSettings.streamLiveRole) && streamingActivity === undefined) {
			await guildMember.roles.remove(liverole)
		} else if (streamingActivity !== undefined) {
			await guildMember.roles.add(liverole)
		}
	}

	if (serverSettings.streamShout !== null) {
		if (!oldPresence || !newPresence || wasStreaming || !streamingActivity || !streamingActivity.url) {
			return;
		}

		const promotionChannel = getTextChannel(discordClient, serverSettings.streamShout);
		if (!promotionChannel) {
			Logger.error(`Channel with key 'streamShout' was not found`);
			return;
		}

		const authUrl = `https://id.twitch.tv/oauth2/token?client_id=${config.twitch.clientId}&client_secret=${config.twitch.clientSecret}&grant_type=client_credentials`;
		const authResponse = await fetch(authUrl, {
			method: 'post',
		});

		const authJson = await authResponse.json();
		if (authResponse.status !== 200) {
			Logger.error(`Couldn't fetch authentication token`);
			return;
		}

		const streamUrl = streamingActivity.url;
		const streamUsername = streamUrl.substr(22);
		const twitchUri = `https://api.twitch.tv/helix/streams?user_login=${streamUsername}`;
		const userAgent = "Servant"

		try {
			const statusResponse = await fetchRetry(twitchUri, {
				retries: 10,
				retryDelay: 30000,
				retryOn: async function (attempt, error, response) {
					const clone = response?.clone()
					if (!clone) {
						Logger.error(`No response, attempt ${attempt + 1}`);
						return true;
					}
	
					const responseData = await clone.json()
					if (responseData.data.length == 0) {
						Logger.error(`Streamer is offline, attempt ${attempt + 1}`);
						return true;
					}
	
					return false;
				},
				method: 'get',
				headers: {
					'Client-ID': config.twitch.clientId,
					'User-Agent': userAgent,
					'Authorization': 'Bearer ' + authJson.access_token
				}
			})
	
			const statusJson = await statusResponse.json();
			if (statusJson.data.length == 0) {
				Logger.error(`Streamer appears to be offline`);
				return;
			}
	
			const stream = statusJson.data[0];
			const thumbnail = stream.thumbnail_url.replace('{width}x{height}', '384x216');
	
			const embed = new MessageEmbed()
				.setColor(randomColor)
				.setImage(thumbnail)
				.setAuthor(`${guildMember.displayName}`, `${guildMember.user.displayAvatarURL()}`)
				.setDescription(`**Streamer:** ${stream.user_name}`)
				.addField("**Stream Title:**", `${stream.title}`, false)
				.addField("**Stream URL:**", `${streamUrl}`, false);
				
			promotionChannel.send({ embed });
			
		} catch(e) {
			Logger.error(`PresenceUpdate Caught Error`, e);
			return;
		}
	}

}