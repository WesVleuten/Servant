import { Client as DiscordClient, MessageReaction, User, PartialUser } from "discord.js";
import ServerSettingsRepository from "../repository/serverSettings";
import { getTextChannel } from "../lib/util";
import createMessageEmbed from "../wrapper/discord/messageEmbed";
import QuotesRepository from "../repository/quotes";
import { QuoteState } from "../interfaces/quoteStateUnum";

export default async function MessageReactionAddEvent(discordClient: DiscordClient, messageReaction: MessageReaction, user: User | PartialUser) {
	const guildId = messageReaction.message.guild?.id!;
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
  
  const quote = await QuotesRepository.Get(guildId!, messageReaction.message.id);
  if (!quote) {
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

    const botMessage = await channel.send({ embed });
    QuotesRepository.Add(guildId, botMessage.id, messageReaction.message.id, QuoteState.Quoted)
  } else { 
    const embed = createMessageEmbed({
      color: 0xFFA500,
      author: `${Buffer.from(serverSettings.quoteEmoji, 'base64')} Quote`,
      fields: [
        {
          key: "User",
          value: messageReaction.message.embeds[0].fields["User"],
        },
        {
          key: "Quote",
          value: messageReaction.message.embeds[0].fields["Quote"],
        },
      ],
    });
    
    const botMessage = await channel.send({ embed });
    QuotesRepository.Delete(guildId!, quote.botMessageId)
    QuotesRepository.Add(guildId!, botMessage.id, null, QuoteState.Quoted)	
  }
}
