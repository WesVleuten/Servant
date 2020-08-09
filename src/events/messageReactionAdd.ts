import { Client as DiscordClient, MessageReaction, User, PartialUser } from "discord.js";
import ServerSettingsRepository from "../repository/serverSettings";
import { getTextChannel } from "../lib/util";
import createMessageEmbed from "../wrapper/discord/messageEmbed";

export default async function MessageReactionAddEvent(discordClient: DiscordClient, messageReaction: MessageReaction, user: User | PartialUser) {
	const guildId = messageReaction.message.guild?.id;
	const serverSettings = await ServerSettingsRepository.GetByGuildId(guildId);
	if (serverSettings === null) {
		return;
	}
	
	if (messageReaction.count === null
		|| serverSettings.quoteChannel === null
		|| serverSettings.quoteEmoji === null
		|| messageReaction.count < serverSettings.quoteThreshold
		|| Buffer.from(`${messageReaction.emoji}`).toString('base64') !== serverSettings.quoteEmoji) {
		return;
	}

	const channel = getTextChannel(discordClient, serverSettings.quoteChannel);
	if (channel === null) {
		return;
	}
	
	const embed = createMessageEmbed({
		color: 0xFFA500,
		author: `${Buffer.from(serverSettings.quoteEmoji, 'base64')} Quote`,
		fields: [
			{
				key: "User",
				value:`${messageReaction.message.author}`,
			},
			{
				key: "Quote",
				value: messageReaction.message.content,
			},
		],
	});

	channel.send({embed});
}
