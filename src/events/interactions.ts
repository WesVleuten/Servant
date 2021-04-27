import { ApplicationCommandOptionType } from 'slash-commands';
import { MessageEmbed, TextChannel } from 'discord.js';
import ServerSettingsRepository from '../repository/serverSettings';
import Logger from '../lib/log';
import { getSlashCommand } from '../routes';
import { GetPermissionLevelForRoles } from '../lib/authorization';
import MutedRepository from '../repository/muted';
import { DiscordClient, ResponseMessage, SlashCommandArgument, SlashCommandOptionType } from '../slash/base';
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
}

export default function interactionEvent(discord: DiscordClient): void {
	// 'INTERACTION_CREATE' does not (yet) exist on WSEventType, however the we do
	// get a callback
	// eslint-disable-next-line
	// @ts-ignore
	discord.ws.on('INTERACTION_CREATE', async (interaction: DiscordInteraction) => {
		const respond = async (embed: ResponseMessage) => {
			const apiEmbed = {
				title: embed.title,
				color: embed.color,
				image: embed.image,
				thumbnail: embed.thumbnail,
				description: embed.description,
				fields: embed.fields,
				author: embed.author ? { name: embed.author } : undefined,
				footer: embed.footer ? { text: embed.footer } : undefined,
			};

			// eslint-disable-next-line
			// @ts-ignore
			discord.api.interactions(interaction.id, interaction.token).callback.post({
				data: {
					type: 4,
					data: {
						embeds: [apiEmbed],
					}
				}
			});
			if (embed.deleteTimeout) {
				await new Promise(resolve => setTimeout(resolve, embed.deleteTimeout));
				// eslint-disable-next-line
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

		const guildchannel = guild.channels.resolve(interaction.channel_id);
		if (!guildchannel || guildchannel.type !== 'text') {
			return;
		}
		const channel = guildchannel as TextChannel;

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
			channel: {
				id: channel.id,
				send: async message => {

					const embed = new MessageEmbed();

					if (message.title != undefined) {
						embed.setTitle(message.title);
					}

					if (message.color != undefined) {
						embed.setColor(message.color);
					}

					if (message.author != undefined) {
						embed.setAuthor(message.author, message.authorIcon);
					}

					if (message.footer != undefined) {
						embed.setFooter(message.footer, message.footerIcon);
					}

					if (message.image != undefined) {
						embed.setImage(message.image);
					}

					if (message.thumbnail != undefined) {
						embed.setThumbnail(message.thumbnail);
					}

					if (message.description != undefined) {
						embed.setDescription(message.description);
					}

					if (message.fields != undefined) {
						for (const field of message.fields) {
							embed.addField(field.name, field.value ?? 'No Value', field.inline ?? false);
						}
					}

					if (message.hideTimestamp !== false) {
						embed.setTimestamp();
					}

					return channel.send({embed});
				},
				discordObject: channel,
			}
		}, (interaction.data?.options?.map(x => ({
			name: x.name,
			type: x.type as unknown as SlashCommandOptionType,
			value: x.value,
		})) ?? []) as SlashCommandArgument[]);

		if (!response) {
			response = {
				title: 'No result specified',
			};
		}
		respond(response);

	});
}
