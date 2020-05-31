export default interface ApplicationConfig {
	botOwnerUserId: string;
	twitch: TwitchConfig;
	database: DatabaseConfig;
	discord: DiscordConfig;
}

export interface TwitchConfig {
	clientId: string;
	accessToken: string;
}

export interface DatabaseConfig {
	host: string;
	user: string;
	password: string;
	database: string;
}

export interface DiscordConfig {
	clientId: string;
	clientSecret: string;
	botToken: string;
}
