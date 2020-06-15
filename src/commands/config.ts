import { ICommand, PermissionLevel } from "./base";
import { Message, Client } from "discord.js";
import ServerSettingsRepository from "../repository/severSettings";
import WhiteListedGamesRepository from "../repository/whiteListedGames";
import TwitchClient from "../lib/twitch";
import createEmbed from "../wrapper/discord/messageEmbed";

export default class ConfigCommand implements ICommand {

	commandName = 'config';
	aliases = null;
	permissionLevel = PermissionLevel.Administrator;
	guildOnly = false;

	usageText = ";config [set/add/remove] [key] [value]";
	helpText = "Shows bot stats";

	async run(discordClient: Client, message: Message, args: string[]) {
		const guildId = message.guild?.id;
		const ss = await ServerSettingsRepository.GetByGuildId(guildId);
		const wlg = await WhiteListedGamesRepository.GetByGuildId(guildId);
		if (!ss || !wlg || !message.guild) {
			return;
		}

		const guild = message.guild;

		if (args.length == 0) {

			let logChannelString = 'Off';
			if (ss.logChannel) {
				const logChannel = guild.channels.resolve(ss.logChannel);
				logChannelString = `${logChannel?.name || 'ERR-404'} (${ss.logChannel})`;
			}

			let streamLiveRoleString = 'Off';
			if (ss.streamLiveRole) {
				const liveRole = guild.roles.resolve(ss.streamLiveRole)
				streamLiveRoleString = `${liveRole?.name || 'ERR-404'} (${ss.streamLiveRole})`;
			}

			let streamShoutString = 'Off';
			if (ss.streamShout) {
				const shoutChannel = guild.channels.resolve(ss.streamShout)
				streamShoutString = `${shoutChannel?.name || 'ERR-404'} (${ss.streamShout})`;
			}

			let adminRoleString = 'Off';
			if (ss.adminRole) {
				const adminRole = guild.roles.resolve(ss.adminRole)
				adminRoleString = `${adminRole?.name || 'ERR-404'} (${ss.adminRole})`;
			}

			let modRoleString = 'Off';
			if (ss.moderatorRole) {
				const modRole = guild.roles.resolve(ss.moderatorRole)
				modRoleString = `${modRole?.name || 'ERR-404'} (${ss.moderatorRole})`;
			}

			let whiteListedGamesString = 'Off';
			if (wlg.length > 0) {
				whiteListedGamesString = wlg.map(g => g.name).join("\n");
			}

			const embed = createEmbed({
				color: 0x33CC33,
				author: "Bot Config",
				footer: `ServerID: ${ss.id}`,
				fields: [
					{
						key: "logChannel",
						value: logChannelString,
					},
					{
						key: "systemNotice",
						value: ss.systemNotice ? 'true' : 'false',
					},
					{
						key: "streamLiveRole",
						value: streamLiveRoleString,
					},
					{
						key: "streamShout",
						value: streamShoutString,
					},
					{
						key: "adminRole",
						value: adminRoleString,
					},
					{
						key: "moderatorRole",
						value: modRoleString,
					},
					{
						key: "whiteListedGames",
						value: whiteListedGamesString,
					},
				],
			});

			message.reply({embed});
			return;
		}

		if (args.length == 3 && args[0] == 'set') {
			const key = args[1];
			const value = args[2];

			if (key == 'logChannel') {
				if (value == 'null') {
					ss.logChannel = null;
				} else {
					const logChannel = guild.channels.cache.find(x => x.id == value || x.name == value);
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
					const liveRole = guild.roles.cache.find(x => x.id == value || x.name == value);
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
					const promotionChannel = guild.channels.cache.find(x => x.id == value || x.name == value);
					if (!promotionChannel) {
						message.reply('Couldnt find channel');
						return;
					}
					ss.streamShout = promotionChannel.id;
				}
			} else if (key == 'adminRole') {
				if (value == 'null') {
					ss.adminRole = null;
				} else {
					const adminRole = guild.roles.cache.find(x => x.id == value || x.name == value);
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
					const modRole = guild.roles.cache.find(x => x.id == value || x.name == value);
					if (!modRole) {
						message.reply('Couldnt find role');
						return;
					}
					ss.moderatorRole = modRole.id;
				}
			}
		}

		if (args.length > 3 && args[0] == 'add') {
			const key = args[1];
			const value = args.slice(2).join(" ");

			if (key == 'whiteListedGames') {
				if (value == 'null') {
					message.reply('No game specified');
					return;
				} else {
					const twitch = TwitchClient.getInstance()
					const game = await twitch.getGameData(value);
					if (!game) { 
						message.reply('Game does not exist for Twitch');
						return;
					}
					
					WhiteListedGamesRepository.Add(guildId, game.id, game.name);
				}
			}
		}

		if (args.length > 3 && args[0] == 'remove') {
			const key = args[1];
			const value = args.slice(2).join(" ");

			if (key == 'whiteListedGames') {
				if (value == 'null') {
					message.reply('No game specified');
					return;
				} else {
					if (wlg.find(g => g.name == value)) {
						WhiteListedGamesRepository.Remove(guildId, value);
					} else { 
						message.reply('Game is not in whitelist');
						return;
					}
				}
			}
		}

		if (await ServerSettingsRepository.Save(ss)) {
			message.reply('Done');
		} else {
			message.reply('Unkown error');
		}
			
	}
	
}