import { ICommand, PermissionLevel } from './base';
import { Message, Client } from 'discord.js';
import ServerSettingsRepository from '../repository/serverSettings';
import WhiteListRepository from '../repository/whiteList';
import TwitchClient from '../lib/twitch';
import createMessageEmbed from '../wrapper/discord/messageEmbed';
import { SetMutedPermissionsForChannel } from '../lib/mutedRole';
import ObjectResolver from '../lib/objectResolver';

export default class ConfigCommand implements ICommand {

	commandName = 'config';
	aliases = null;
	permissionLevel = PermissionLevel.Administrator;
	guildOnly = false;

	usageText = ';config [(set|add|remove) <key> <value>]';
	helpText = 'Shows bot config';

	async run(discordClient: Client, message: Message, args: string[]): Promise<void> {
		const guildId = message.guild?.id;
		const ss = await ServerSettingsRepository.GetByGuildId(guildId);
		const wl = await WhiteListRepository.GetByGuildId(guildId);
		const objectResolver = new ObjectResolver(discordClient);
		if (!ss || !wl || !message.guild) {
			return;
		}

		const guild = message.guild;

		if (args.length == 0) {

			let logChannelString = 'Off';
			if (ss.logChannel) {
				const logChannel = await objectResolver.ResolveGuildChannel(guild, ss.logChannel);
				logChannelString = `${logChannel?.name || 'ERR-404'} (${ss.logChannel})`;
			}

			let streamLiveRoleString = 'Off';
			if (ss.streamLiveRole) {
				const liveRole = await objectResolver.ResolveGuildRole(guild, ss.streamLiveRole);
				streamLiveRoleString = `${liveRole?.name || 'ERR-404'} (${ss.streamLiveRole})`;
			}

			let streamShoutString = 'Off';
			if (ss.streamShout) {
				const shoutChannel = await objectResolver.ResolveGuildChannel(guild, ss.streamShout);
				streamShoutString = `${shoutChannel?.name || 'ERR-404'} (${ss.streamShout})`;
			}

			let streamTimeoutString = 'Off';
			if (ss.streamTimeout > 0) {
				streamTimeoutString = ss.streamTimeout + ' hours';
			}

			let adminRoleString = 'Off';
			if (ss.adminRole) {
				const adminRole = await objectResolver.ResolveGuildRole(guild, ss.adminRole);
				adminRoleString = `${adminRole?.name || 'ERR-404'} (${ss.adminRole})`;
			}

			let modRoleString = 'Off';
			if (ss.moderatorRole) {
				const modRole = await objectResolver.ResolveGuildRole(guild, ss.moderatorRole);
				modRoleString = `${modRole?.name || 'ERR-404'} (${ss.moderatorRole})`;
			}

			let muteRoleString = 'Off';
			if (ss.muteRole) {
				const muteRole = await objectResolver.ResolveGuildRole(guild, ss.muteRole);
				muteRoleString = `${muteRole?.name || 'ERR-404'} (${ss.muteRole})`;
			}

			let muteChannelString = 'Off';
			if (ss.muteChannel) {
				const muteChannel = await objectResolver.ResolveGuildChannel(guild, ss.muteChannel);
				muteChannelString = `${muteChannel?.name || 'ERR-404'} (${ss.muteChannel})`;
			}

			let whiteListedGamesString = 'Off';
			if (wl.games.length > 0) {
				whiteListedGamesString = wl.games.map(g => g.name).join('\n');
			}

			let whiteListedRolesString = 'Off';
			if (wl.roles.length > 0) {
				whiteListedRolesString = (await Promise.all(wl.roles.map(async r => {
					const role = await objectResolver.ResolveGuildRole(guild, r.id);
					return role?.name + ' (' + r.id + ')';
				}))).join('\n');
			}

			let quoteThresholdString = 'Off';
			if (ss.quoteThreshold > 0) {
				quoteThresholdString = ss.quoteThreshold + ' reactions';
			}

			let quoteEmojiString = 'Off';
			if (ss.quoteEmoji) {
				quoteEmojiString = `${Buffer.from(ss.quoteEmoji, 'base64')}`;
			}

			let quoteChannelString = 'Off';
			if (ss.quoteChannel) {
				const quoteChannel = await objectResolver.ResolveGuildChannel(guild, ss.quoteChannel);
				quoteChannelString = `${quoteChannel?.name || 'ERR-404'} (${ss.quoteChannel})`;
			}

			const embed = createMessageEmbed({
				color: 0x33CC33,
				author: 'Bot Config',
				footer: `ServerID: ${ss.id}`,
				fields: [
					{
						key: 'logChannel',
						value: logChannelString,
					},
					{
						key: 'systemNotice',
						value: ss.systemNotice ? 'true' : 'false',
					},
					{
						key: 'streamLiveRole',
						value: streamLiveRoleString,
					},
					{
						key: 'streamShout',
						value: streamShoutString,
					},
					{
						key: 'streamTimeout',
						value: streamTimeoutString,
					},
					{
						key: 'adminRole',
						value: adminRoleString,
					},
					{
						key: 'moderatorRole',
						value: modRoleString,
					},
					{
						key: 'muteRole',
						value: muteRoleString,
					},
					{
						key: 'muteChannel',
						value: muteChannelString,
					},
					{
						key: 'whiteListedGames',
						value: whiteListedGamesString,
					},
					{
						key: 'whiteListedRoles',
						value: whiteListedRolesString,
					},
					{
						key: "quoteThreshold",
						value: quoteThresholdString,
					},
					{
						key: "quoteEmoji",
						value: quoteEmojiString,
					},
					{
						key: "quoteChannel",
						value: quoteChannelString,
					},
				],
			});

			message.reply({ embed });
			return;
		}

		if (args.length == 3 && args[0] == 'set') {
			const key = args[1];
			const value = args[2];

			if (key == 'logChannel') {
				if (value == 'null') {
					ss.logChannel = null;
				} else {
					const logChannel = await objectResolver.ResolveGuildChannel(guild, value);
					if (!logChannel) {
						message.reply('Couldnt find channel');
						return;
					}
					ss.logChannel = logChannel.id;
				}
			} else if (key == 'systemNotice') {
				ss.systemNotice = Boolean(value);
			} else if (key == 'streamLiveRole') {
				if (value == 'null') {
					ss.streamLiveRole = null;
				} else {
					const liveRole = await objectResolver.ResolveGuildRole(guild, value);
					if (!liveRole) {
						message.reply('Couldnt find role');
						return;
					}
					ss.streamLiveRole = liveRole.id;
				}
			} else if (key == 'streamShout') {
				if (value == 'null') {
					ss.streamShout = null;
				} else {
					const promotionChannel = await objectResolver.ResolveGuildChannel(guild, value);
					if (!promotionChannel) {
						message.reply('Couldnt find channel');
						return;
					}
					ss.streamShout = promotionChannel.id;
				}
			} else if (key == 'streamTimeout') {
				if (value == 'null') {
					ss.streamTimeout = 0;
				} else {
					const timeout = Number(value);
					if (isNaN(timeout)) {
						message.reply('Couldnt parse timeout');
						return;
					}
					ss.streamTimeout = timeout;
				}
			} else if (key == 'adminRole') {
				if (value == 'null') {
					ss.adminRole = null;
				} else {
					const adminRole = await objectResolver.ResolveGuildRole(guild, value);
					if (!adminRole) {
						message.reply('Couldnt find role');
						return;
					}
					ss.adminRole = adminRole.id;
				}
			} else if (key == 'moderatorRole') {
				if (value == 'null') {
					ss.moderatorRole = null;
				} else {
					const modRole = await objectResolver.ResolveGuildRole(guild, value);
					if (!modRole) {
						message.reply('Couldnt find role');
						return;
					}
					ss.moderatorRole = modRole.id;
				}
			} else if (key == 'quoteThreshold') {
				if (value == 'null') {
					ss.quoteThreshold = 10;
				} else {
					const threshold = Number(value)
					if (isNaN(threshold)) {
						message.reply('Couldnt parse threshold');
						return;
					}
					ss.quoteThreshold = threshold;
				}
			} else if (key == 'quoteEmoji') {
				if (value == 'null') {
					ss.quoteChannel = null;
				} else {
					ss.quoteEmoji = Buffer.from(value).toString('base64');
				}
			} else if (key == 'quoteChannel') {
				if (value == 'null') {
					ss.quoteChannel = null;
				} else {
					const quoteChannel = await objectResolver.ResolveGuildChannel(guild, value);
					if (!quoteChannel) {
						message.reply('Couldnt find channel');
						return;
					}
					ss.quoteChannel = quoteChannel.id;
				}
			} else if (key == 'muteRole') {
				if (value == 'null') {
					ss.muteRole = null;
				} else {
					const muteRole = await objectResolver.ResolveGuildRole(guild, value);
					if (!muteRole) {
						message.reply('Couldnt find role');
						return;
					}
					ss.muteRole = muteRole.id;
				}
			} else if (key == 'muteChannel') {
				if (value == 'null') {
					const oldMutedChannelId = ss.muteChannel;
					ss.muteChannel = null;

					if (ss.muteRole && oldMutedChannelId) {
						const muteChannel = await objectResolver.ResolveGuildChannel(guild, oldMutedChannelId);
						if (!muteChannel) {
							return;
						}

						const muteRole = await objectResolver.ResolveGuildRole(guild, ss.muteRole);
						if (!muteRole) {
							return;
						}

						SetMutedPermissionsForChannel(muteRole, muteChannel, null);
					}
				} else {
					const muteChannel = await objectResolver.ResolveGuildChannel(guild, value);
					if (!muteChannel) {
						message.reply('Couldnt find channel');
						return;
					}
					ss.muteChannel = muteChannel.id;

					if (ss.muteRole) {
						const muteRole = await objectResolver.ResolveGuildRole(guild, ss.muteRole);
						if (!muteRole) {
							return;
						}

						SetMutedPermissionsForChannel(muteRole, muteChannel, muteChannel.id);
					}
				}
			}
		}

		if (args.length >= 3 && args[0] == 'add') {
			const key = args[1];
			const value = args.slice(2).join(' ');
			if (value == 'null') {
				message.reply('No value specified');
				return;
			}

			if (key == 'whiteListedGames') {
				const twitch = TwitchClient.getInstance();
				const game = await twitch.getGameData(value);
				if (!game) {
					message.reply('Game does not exist for Twitch');
					return;
				}
				WhiteListRepository.AddGame(guildId, game.id, game.name);
			} else if (key == 'whiteListedRoles') {
				const role = await objectResolver.ResolveGuildRole(guild, value);
				if (role == null) {
					message.reply('Role id does not exist in this guild');
					return;
				}
				WhiteListRepository.AddRole(guildId, role.id);
			}
		}

		if (args.length >= 3 && args[0] == 'remove') {
			const key = args[1];
			const value = args.slice(2).join(' ');
			if (value == 'null') {
				message.reply('No value specified');
				return;
			}

			if (key == 'whiteListedGames') {
				if (wl.games.find(g => g.name == value)) {
					WhiteListRepository.RemoveGame(guildId, value);
				} else {
					message.reply('Game is not in whitelist');
					return;
				}
			} else if (key == 'whiteListedRoles') {
				if (wl.roles.find(r => r.id == value)) {
					WhiteListRepository.RemoveRole(guildId, value);
				} else {
					message.reply('Role is not in whitelist');
					return;
				}
			}
		}

		if (await ServerSettingsRepository.Save(ss)) {
			message.reply('Done');
		} else {
			message.reply('Unkown error');
		}

		return;
	}

}
