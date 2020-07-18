import { GuildMember } from "discord.js";
import WhiteListRepository from "../repository/whiteList";
import TwitchClient from "../lib/twitch";

export default async function CheckIfWhitelisted(guildId: string|undefined, streamingActivity: any, member: GuildMember): Promise<boolean> {
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

	const gameWhiteListed = wl.games.length === 0 || wl.games.find(g => g.id === stream.game_id) !== undefined;
	const roleWhiteListed = wl.roles.length === 0 || wl.roles.find(r1 => member.roles.cache.find(r2 => r1.id === r2.id) !== undefined) !== undefined;

	return gameWhiteListed && roleWhiteListed;
}
