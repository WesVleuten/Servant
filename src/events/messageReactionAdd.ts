import { CreateOrUpdateQuote } from "../lib/quote";
import { Client as DiscordClient, MessageReaction, User, PartialUser } from "discord.js";
import ServerSettingsRepository from "../repository/serverSettings";

export default async function MessageReactionAddEvent(discordClient: DiscordClient, messageReaction: MessageReaction, user: User | PartialUser) {
  if (messageReaction.partial) {
    try {
      await messageReaction.fetch();
    } catch (error) {
      console.error(error);
      return;
    }
  }

  const guildId = messageReaction.message.guild?.id!;
  const serverSettings = await ServerSettingsRepository.GetByGuildId(guildId);
  if (serverSettings === null) {
    console.error('messageReactionAdd: Server settings not found');
    return;
  }

  const reactionsCount = messageReaction.users.cache.filter(u => u.id !== messageReaction.message.author.id).size;
  if (messageReaction.count === null
    || serverSettings.quoteChannel === null
    || serverSettings.quoteEmoji === null
    || messageReaction.message.author.bot
    || reactionsCount < serverSettings.quoteThreshold
    || Buffer.from(`${messageReaction.emoji.name}`).toString('base64') !== serverSettings.quoteEmoji) {
    return;
  }

  return CreateOrUpdateQuote(discordClient, messageReaction.message);
}
