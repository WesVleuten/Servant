import { Client as DiscordClient, MessageReaction, User, PartialUser } from "discord.js";
import ServerSettingsRepository from "../repository/serverSettings";
import { getTextChannel } from "../lib/util";
import createMessageEmbed from "../wrapper/discord/messageEmbed";
import QuotesRepository from "../repository/quotes";

export default async function MessageReactionAddEvent(discordClient: DiscordClient, messageReaction: MessageReaction, user: User | PartialUser) {
  const guildId = messageReaction.message.guild?.id!;
  const serverSettings = await ServerSettingsRepository.GetByGuildId(guildId);
  if (serverSettings === null) {
    return;
  }

  if (messageReaction.count === null
    || serverSettings.quoteChannel === null
    || serverSettings.quoteEmoji === null
    || messageReaction.message.author.bot
    || messageReaction.count < serverSettings.quoteThreshold
    || Buffer.from(`${messageReaction.emoji.name}`).toString('base64') !== serverSettings.quoteEmoji) {
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
      author: `${Buffer.from(serverSettings.quoteEmoji, 'base64')} ${messageReaction.message.member.nickname ?? messageReaction.message.author.username}`,
      fields: [
        {
          key: `${messageReaction.message.member.nickname ?? messageReaction.message.author.username} said`,
          value: messageReaction.message.content,
        },
        {
          key: "Source",
          value: `[Click](${messageReaction.message.url})`,
        }
      ],
    });

    if (messageReaction.message.attachments.size != 0) {
      embed.setImage(messageReaction.message.attachments.first().url)
    }

    const botMessage = await channel.send({ embed });
    QuotesRepository.Add(guildId, botMessage.id, messageReaction.message.id)
  }
}
