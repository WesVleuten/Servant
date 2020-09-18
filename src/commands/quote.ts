import { ICommand, PermissionLevel } from "./base";
import { Message, Client } from "discord.js";
import ServerSettingsRepository from "../repository/serverSettings";
import Logger from "../lib/log";
import { getTextChannel } from "../lib/util";
import createMessageEmbed from "../wrapper/discord/messageEmbed";
import QuotesRepository from "../repository/quotes";
import { QuoteState } from "../interfaces/quoteStateUnum";

export default class QuoteCommand implements ICommand {

	commandName = 'quote';
	aliases = null;
	permissionLevel = PermissionLevel.User;
	guildOnly = false;

	usageText = ";quote";
	helpText = "Propose quote";

	async run(discordClient: Client, message: Message, args: string[]) {
		if (args.length < 2
			|| message.mentions.members === null
			|| message.mentions.members.size === 0) { 
			return;
		}

		const guildId = message.guild?.id!;
		const serverSettings = await ServerSettingsRepository.GetByGuildId(guildId);
		if (serverSettings === null) {
			Logger.error(`Couldn't get server settings for ${guildId}`);
			return;
		}
		
		if (serverSettings.quoteChannel === null || serverSettings.quoteEmoji === null) { 
			return;
		}

		const guildMember = message.mentions.members.first()
		if (!guildMember || !args[0].includes(guildMember.id) || guildMember.id === message.author.id) { 
			return;
		}
		
		const channel = getTextChannel(discordClient, serverSettings.quoteChannel);
		if (channel === null) {
			return;
		}
		
		const reason = args.slice(1).join(" ");
		
		const embed = createMessageEmbed({
			color: 0xFFA500,
			author: `${Buffer.from(serverSettings.quoteEmoji, 'base64')} Proposed quote`,
			description: `Vote on this quote with ${Buffer.from(serverSettings.quoteEmoji, 'base64')}`,
			fields: [
				{
					key: "User",
					value:`${guildMember}`,
				},
				{
					key: "Quote",
					value: reason,
				},
			],
    });
	
    const botMessage = await channel.send({ embed });
    QuotesRepository.Add(guildId, botMessage.id, null, QuoteState.Pending)
	}

}

