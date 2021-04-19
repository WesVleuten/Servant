import {
	Client as DiscordClient,
	Guild as DiscordGuild,
	User as DiscordUser
} from 'discord.js';

export {
	DiscordClient,
	DiscordGuild,
	DiscordUser,
}

export enum PermissionLevel {
	BotOwner		=  0,
	Administrator	= 10,
	Moderator		= 20,
	User			= 30,
}

export enum SlashCommandOptionType {
    SUB_COMMAND = 1,
    SUB_COMMAND_GROUP = 2,
    STRING = 3,
    INTEGER = 4,
    BOOLEAN = 5,
    USER = 6,
    CHANNEL = 7,
    ROLE = 8
}

export interface SlashCommandArgument {
	name: string;
	type: SlashCommandOptionType,
	value: string;
}

export interface Context {
	guild?: Guild;
	user: User;
	channel_id: string;
}

export interface Guild {
	id: string;
	discordObject: DiscordGuild
}

export interface User {
	id: string;
	username: string;
	discriminator: string;
	discordObject: DiscordUser
}

export interface SlashCommandResponse {
	title?: string;
	description?: string;
	url?: string;
	timestamp?: string;
	color?: number;
	footer?: {text: string};
	author?: {name: string};
	fields?: {
		name: string;
		value: string;
		inline?: boolean;
	}[];

	deleteTimeout?: number;
}

export interface ISlashCommand {
	name: string;
	description: string;
	permissionLevel: PermissionLevel
	guildOnly?: boolean;
	
	options: {
		name: string;
		description: string;
		type: SlashCommandOptionType;
		required?: boolean;
	}[];

	run: (discordClient: DiscordClient, ctx: Context, args: SlashCommandArgument[]) => Promise<SlashCommandResponse|undefined>;
}