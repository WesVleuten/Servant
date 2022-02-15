import { Client as DiscordClient } from 'discord.js';
import { DiscordInteractions, ApplicationCommandOption } from 'slash-commands';
import Logger from './lib/log';
import ReadyEvent from './events/ready';
import MessageDeleteEvent from './events/messageDelete';
import MessageUpdateEvent from './events/messageUpdate';
import GuildCreateEvent from './events/guildCreate';
import GuildDeleteEvent from './events/guildDelete';
import ChannelCreateEvent from './events/channelCreate';
import VoiceStateUpdateEvent from './events/voiceStateUpdate';
import MessageDeleteBulkEvent from './events/messageDeleteBulk';
import MessageReactionAddEvent from './events/messageReactionAdd';
import ErrorEvent from './events/error';
import MessageEvent from './events/message';
import InteractionEvent from './events/interactions';

import { ISlashCommand } from './slash/base';
import MuteSlashCommand from './slash/mute';
import PollSlashCommand from './slash/poll';
import UnmuteSlashCommand from './slash/unmute';
import StatsSlashCommand from './slash/stats';
import PurgeSlashCommand from './slash/purge';

import { ICommand, PermissionLevel } from './commands/base';
import HelpCommand from './commands/help';
import PurgeCommand from './commands/purge';
import StatsCommand from './commands/stats';
import ConfigCommand from './commands/config';
import LiveResetCommand from './commands/resetlive';
import PresenceUpdateEvent from './events/presenceUpdate';
import MuteCommand from './commands/mute';
import UnmuteCommand from './commands/unmute';
import PollCommand from './commands/poll';
import MQuoteCommand from './commands/mquote';

const SlashCommands: ISlashCommand[] = [
	PollSlashCommand,
	MuteSlashCommand,
	UnmuteSlashCommand,
	StatsSlashCommand,
	PurgeSlashCommand,
].map(x => new x());

const Commands: ICommand[] = [
	HelpCommand,
	PurgeCommand,
	StatsCommand,
	ConfigCommand,
	LiveResetCommand,
	MuteCommand,
	UnmuteCommand,
	PollCommand,
    MQuoteCommand,
].map(x => new x());

const EventBind = {
	'ready': ReadyEvent,
	'message': MessageEvent,
	'error': ErrorEvent,
	'messageUpdate': MessageUpdateEvent,
	'messageDelete': MessageDeleteEvent,
	'messageDeleteBulk': MessageDeleteBulkEvent,
	'messageReactionAdd': MessageReactionAddEvent,
	'guildCreate': GuildCreateEvent,
	'guildDelete': GuildDeleteEvent,
	'channelCreate': ChannelCreateEvent,
	'voiceStateUpdate': VoiceStateUpdateEvent,
	'presenceUpdate': PresenceUpdateEvent
};

export async function BindRoutes(discordClient: DiscordClient): Promise<void> {
	// Bind events
	for (const key in EventBind) {
		/* eslint-disable @typescript-eslint/no-explicit-any */
		const eventName: any = key;
		/* eslint-enable */
		const eventFunction = EventBind[eventName];
		discordClient.on(eventName, eventFunction.bind(null, discordClient));
	}

	InteractionEvent(discordClient);
}

export async function getCommand(commandStr: string): Promise<ICommand|null> {
	for (const command of Commands) {
		if (command.commandName == commandStr || (command.aliases && command.aliases.includes(commandStr))) {
			return command;
		}
	}
	return null;
}

export async function getCommands(permissionLevel: PermissionLevel): Promise<ICommand[]> {
	const commands: ICommand[] = [];
	for (const command of Commands) {
		if (permissionLevel <= command.permissionLevel) {
			commands.push(command);
		}
	}
	return commands;
}

export async function registerSlashCommand(interaction: DiscordInteractions): Promise<void> {
	const commands = await interaction.getApplicationCommands();

	const bindings: {[key: string]: string;} = {};
	for (const cmd of commands) {
		bindings[cmd.name] = cmd.id;
	}

	for (const cmd of SlashCommands) {
		const action = !bindings[cmd.name] ? 'create' : 'update';
		Logger.info(action, cmd.name, bindings[cmd.name]);

		interaction.createApplicationCommand({
			name: cmd.name,
			description: cmd.description,
			options: cmd.options.map(y => y as unknown as ApplicationCommandOption),
		}, undefined, bindings[cmd.name] ?? undefined).catch(console.error);
	}
}

export async function getSlashCommand(commandName: string): Promise<ISlashCommand|null> {
	for (const scmd of SlashCommands) {
		if (scmd.name == commandName) {
			return scmd;
		}
	}
	return null;
}
