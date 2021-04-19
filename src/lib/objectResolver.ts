import { Client, Guild, GuildMember, GuildChannel, Role } from 'discord.js';

const userTagRegex = /(.{2,32})#((?!0{4})[0-9]{4})$/;

function isNumeric(s: string) {
	for (let i = 0; i < s.length; i++) {
		const d = s.charCodeAt(i);
		if (d < 48 || d > 57) {
			return false;
		}
	}
	return true;
}

export default class ObjectResolver {

	private client: Client;

	constructor(client: Client) {
		this.client = client;
	}

	async ResolveGuildMember(guild: Guild, query: string): Promise<GuildMember|null> {
		query = query.trim();

		// Strip down mention tags
		if (query.startsWith('<@') && query.endsWith('>')) {
			query = query.slice(2, -1);
			if (query.startsWith('!'))
				query = query.slice(1);
		}

		// Check if its an ID
		if (isNumeric(query)) {
			return this.GetGuildMember(guild, query);
		}

		// First check for a # to decrease the usage of regex.
		if (query.indexOf('#') > -1 && userTagRegex.test(query)) {
			const regexmatch = userTagRegex.exec(query);
			if (!regexmatch) {
				throw new Error();
			}
			const username = regexmatch[1];
			const discriminator = regexmatch[2];
			const result = guild.members.cache.find(x => {
				return x.user.username == username && x.user.discriminator == discriminator;
			});
			if (result) {
				return result;
			}
		}

		const usernameMatch = guild.members.cache.filter(x => {
			return x.user.username == query;
		});
		if (usernameMatch.keys.length > 1) {
			return null;
		}
		const usernameMatchKey = usernameMatch.firstKey();
		if (usernameMatchKey) {
			// More than one user matches, unconfident result
			return usernameMatch.get(usernameMatchKey) ?? null;
		}

		const lowernameMatch = guild.members.cache.filter(x => {
			return x.user.username.toLowerCase() == query.toLowerCase();
		});
		if (lowernameMatch.keys.length > 1) {
			// More than one user matches, unconfident result
			return null;
		}
		const lowernameMatchKey = lowernameMatch.firstKey();
		if (lowernameMatchKey) {
			return lowernameMatch.get(lowernameMatchKey) ?? null;
		}

		return null;
	}

	async GetGuildMember(guild: Guild, id: string): Promise<GuildMember|null> {
		const cached = guild.members.cache.get(id);
		if (cached) {
			return cached;
		}
		return guild.members.fetch(id);
	}

	async ResolveGuildChannel(guild: Guild, query: string): Promise<GuildChannel|null> {
		const result = guild.channels.cache.find(x => x.id == query || x.name == query);
		if (result) {
			return result;
		}
		return null;
	}

	async ResolveGuildRole(guild: Guild, query: string): Promise<Role|null> {
		const result = guild.roles.cache.find(x => x.id == query || x.name == query);
		if (result) {
			return result;
		}
		return null;
	}

}
