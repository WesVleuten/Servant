import { Client as DiscordClient, MessageReaction, User, PartialUser } from "discord.js";
import ServerSettingsRepository from "../repository/serverSettings";
import { getTextChannel } from "../lib/util";
import createMessageEmbed from "../wrapper/discord/messageEmbed";
import QuotesRepository from "../repository/quotes";

export default async function MessageReactionAddEvent(discordClient: DiscordClient, messageReaction: MessageReaction, user: User | PartialUser) {
  if (messageReaction.partial) {
    try {
      await messageReaction.fetch();
    } catch (error) {
      return;
    }
  }

  const guildId = messageReaction.message.guild?.id!;
  const serverSettings = await ServerSettingsRepository.GetByGuildId(guildId);
  if (serverSettings === null) {
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

  const channel = getTextChannel(discordClient, serverSettings.quoteChannel);
  if (channel === null) {
    return;
  }

  const msg = messageReaction.message;
  const emoji = Buffer.from(serverSettings.quoteEmoji, 'base64');
  const content = `${reactionsCount} ${emoji} **${msg.member.toString()} in ${msg.channel.toString()}**`;

  const embed = createMessageEmbed({
    color: 0xFFA500,
    footer: `React with ${emoji} to get a worthy message highlighted!`,
    thumbnail: msg.author.avatarURL()
  });
  let files = null;

  if (msg.attachments.size == 1 && msg.attachments.every(x => x.url.endsWith("png") || x.url.endsWith("jpeg") || x.url.endsWith("jpg") || x.url.endsWith("gif"))) {
    embed.setImage(msg.attachments.first().url)
  } else {
    files = msg.attachments.array();
  }

  if (msg.content != "") {
    embed.addField(`**${msg.member.nickname || msg.author.username} said**`, msg.content);
  }

  embed.addField(`Source`, `[Click](${msg.url})`);

  const quoteMsg = {
    content: content,
    files: msg.attachments.array(),
    embed: embed
  };

  const quote = await QuotesRepository.Get(guildId!, messageReaction.message.id);
  if (!quote) {
    const botMessage = await channel.send(quoteMsg);
    QuotesRepository.Add(guildId, botMessage.id, msg.id)
  } else {
    let botMessage = await channel.messages.fetch(quote.botMessageId);
    await botMessage.edit(quoteMsg);
  }
}
