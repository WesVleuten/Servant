import ServerSettingsRepository from '../repository/serverSettings';
import Logger from '../lib/log';
import { getSlashCommand } from '../routes';
import { GetPermissionLevelForRoles } from '../lib/authorization';
import MutedRepository from '../repository/muted';
import { DiscordClient, SlashCommandResponse } from '../slash/base';
import { DiscordInteractions, ApplicationCommandOptionType } from "slash-commands";
import Config from '../lib/config';

interface DiscordInteraction {
	version: number;
	type: number;
	token: string;
	member: {
		user: {
			username: string;
			public_flags: number;
			id: string;
			discriminator: string;
			avatar: string;
		};
		roles: string[];
		premium_since: string|null;
		permissions: string;
		pending: boolean;
		nick: string|null;
		joined_at: string;
		is_pending: boolean;
		deaf: boolean;
	};
	id: string;
	guild_id: string;
	data: {
		options: {
			value: string;
			type: ApplicationCommandOptionType;
			name: string;
		}[];
		name: string;
		id: string;
	};
	channel_id: string;
	application_id: string;
};

export default function interactionEvent(discord: DiscordClient) {
	// 'INTERACTION_CREATE' does not (yet) exist on WSEventType, however the we do
	// get a callback
	// @ts-ignore
	discord.ws.on('INTERACTION_CREATE', async (interaction: DiscordInteraction) => {
		const respond = async (embed: SlashCommandResponse) => {
			// @ts-ignore
			discord.api.interactions(interaction.id, interaction.token).callback.post({
				data: {
					type: 4,
					data: {
						embeds: [embed],
					}
				}
			});
			if (embed.deleteTimeout) {
				await new Promise(resolve => setTimeout(resolve, embed.deleteTimeout));
				// @ts-ignore
				discord.api.webhooks(Config.discord.clientId, interaction.token).messages('@original').delete();
			}
		};

		const guild = discord.guilds.resolve(interaction.guild_id);
		if (!guild) {
			return respond({
				title: 'Error',
				description: 'Could not resolve guild',
			});
		}

		const guildId = guild?.id;
		const serverSettings = await ServerSettingsRepository.GetByGuildId(guildId);
		if (serverSettings === null) {
			Logger.error(`Couldnt get server settings for ${guildId}`);
			return respond({
				title: 'Error',
				description: 'Could not get server settings',
			});
		}

		const cmd = await getSlashCommand(interaction.data.name);
		if (!cmd) {
			return respond({
				title: 'Error',
				description: 'Could not resolve command',
			});
		}

		const userId = interaction.member.user.id;
		const permissionLevel = await GetPermissionLevelForRoles(guild, userId, interaction.member.roles);
		const mute = await MutedRepository.GetRunning(guildId, userId);
		if (permissionLevel > cmd.permissionLevel || mute !== null) {
			return respond({
				title: 'Error',
				description: 'You do not have permission to use this command',
			});
		}

		let response = await cmd.run(discord, {
			user: {
				id: userId,
				username: interaction.member.user.username,
				discriminator: interaction.member.user.discriminator,
				discordObject: await discord.users.fetch(userId),
			},
			guild: {
				id: guildId,
				discordObject: guild,
			},
			channel_id: interaction.channel_id,
		}, interaction.data.options.map(x => ({
			name: x.name,
			type: x.type as any,
			value: x.value,
		})));

		if (!response) {
			response = {
				title: 'No result specified',
			};
		}
		respond(response);

	});
}
