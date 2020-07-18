import { Message, Client } from "discord.js";

export enum PermissionLevel {
	BotOwner		=  0,
	Administrator	= 10,
	Moderator		= 20,
	User			= 30,
}

export interface ICommand {

	commandName: string;
	aliases: string[]|null;
	permissionLevel: PermissionLevel;
	guildOnly: boolean;

	usageText: string;
	helpText: string;

	run(discordClient: Client, message: Message, args: string[]): Promise<void>;

}
