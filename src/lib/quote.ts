import { Client as DiscordClient, MessageReaction, User, PartialUser, Message } from "discord.js";
import ServerSettingsRepository from "../repository/serverSettings";
import { getTextChannel } from "../lib/util";
import createMessageEmbed from "../wrapper/discord/messageEmbed";
import QuotesRepository from "../repository/quotes";

const IMAGE_EXTS = ['png', 'jpeg', 'jpg', 'gif'];

export async function CreateOrUpdateQuote(discordClient: DiscordClient, message: Message) {
  const guildId = message.guild?.id!;

  const serverSettings = await ServerSettingsRepository.GetByGuildId(guildId);
  if (serverSettings === null) {
    console.error('messageReactionAdd: Server settings not found');
    return;
  }

  if (serverSettings.quoteChannel === null || serverSettings.quoteEmoji === null) {
    console.error("Quote channel is disabled");
    return;
  }

  const channel = getTextChannel(discordClient, serverSettings.quoteChannel);
  if (channel === null) {
    console.error('messageReactionAdd: Channel not found');
    return;
  }

  const author = message.author;

  const reactions = message.reactions.cache.find(x => Buffer.from(x.emoji.name).toString('base64') == serverSettings.quoteEmoji);
  let reactionsCount = 0;
  if (reactions) {
    reactionsCount = (await reactions.users.fetch()).filter(u => u.id !== author.id).size;
  }

  const emoji = Buffer.from(serverSettings.quoteEmoji, 'base64');
  const content = `${reactionsCount} ${emoji} **${message.member.toString()} in ${message.channel.toString()}**`;

  const embed = createMessageEmbed({
    color: 0xFFA500,
    footer: `React with ${emoji} to get a worthy message highlighted!`,
    thumbnail: author.avatarURL()
  });
  let files = null;

  if (message.attachments.size == 1 && message.attachments.every(x => IMAGE_EXTS.some(y => x.url.endsWith(y)))) {
    embed.setImage(message.attachments.first().url)
  } else {
    files = message.attachments.array();
  }

  if (message.content != "") {
    embed.title = `**${message.member.nickname || author.username} said**`;
    embed.description = message.content;
  }

  embed.addField(`Source`, `[Click](${message.url})`);

  const quoteMsg = {
    content: content,
    files: files,
    embed: embed
  };

  const quote = await QuotesRepository.Get(guildId!, message.id);
  if (!quote) {
    const botMessage = await channel.send(quoteMsg);
    QuotesRepository.Add(guildId, botMessage.id, message.id)
  } else {
    let botMessage = await channel.messages.fetch(quote.botMessageId);
    await botMessage.edit(quoteMsg);
  }
}