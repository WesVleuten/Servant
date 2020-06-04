import { Client as DiscordClient, Presence, MessageEmbed } from "discord.js";
import ServerSettingsRepository from "../repository/severSettings";
import Logger from "../lib/log";
import { getTextChannel } from "../lib/util";
import config from "../lib/config";
import fetch from "node-fetch";

const sleep = waitTimeInMs => new Promise(resolve => setTimeout(resolve, waitTimeInMs));

export default async function PresenceUpdateEvent(discordClient: DiscordClient, oldPresence: Presence|null, newPresence: Presence) {
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
			Logger.error(`ERR: role with key 'liverole' was not found`);
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
			Logger.error(`ERR: channel with key 'streamShout' was not found`);
			return;
		}

		const streamUrl = streamingActivity.url;
		const streamUsername = streamUrl.substr(22);
		const twitchUri = `https://api.twitch.tv/helix/streams?user_login=${streamUsername}`;
		const userAgent = "Servant"

		//await sleep(2 * 60 * 1000);
		fetch(twitchUri, {
			method: 'get',
			headers: {
				'Client-ID': config.twitch.clientId,
				'User-Agent': userAgent,
				'Authorization': 'Bearer ' + config.twitch.accessToken
			}
		})
		.then(res => res.json())
		.then(json => {
			if (json.data.length == 0) {
				return;
			}

			const stream = json.data[0];
			const thumbnail = stream.thumbnail_url.replace('{width}x{height}', '384x216');

			const embed = new MessageEmbed()
				.setColor(randomColor)
				.setImage(thumbnail)
				.setAuthor(`${guildMember.displayName}`, `${guildMember.user.displayAvatarURL()}`)
				.setDescription(`**Streamer:** ${stream.user_name}`)
				.addField("**Stream Title:**", `${stream.title}`, false)
				.addField("**Stream URL:**", `${streamUrl}`, false);
				
			promotionChannel.send({embed});
		});
	}
}
