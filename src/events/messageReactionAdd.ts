import { Client as DiscordClient, MessageReaction, User, PartialUser, Message } from "discord.js";
import ServerSettingsRepository from "../repository/serverSettings";
import { getTextChannel } from "../lib/util";
import QuotesRepository from "../repository/quotes";
import createMessageEmbed from "../wrapper/discord/messageEmbed";

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
    || messageReaction.users.cache.filter(u => u.id !== messageReaction.message.author.id).size < serverSettings.quoteThreshold
    || Buffer.from(`${messageReaction.emoji.name}`).toString('base64') !== serverSettings.quoteEmoji) {
    return;
  }

  const channel = getTextChannel(discordClient, serverSettings.quoteChannel);
  if (channel === null) {
    return;
  }

  const quote = await QuotesRepository.Get(guildId!, messageReaction.message.id);
  if (!quote) {
    const msg = messageReaction.message;

    const emoji = Buffer.from(serverSettings.quoteEmoji, 'base64');
    let content = `${emoji} **${msg.member.toString()} in ${msg.channel.toString()}**`;
    const embed = createMessageEmbed({
      color: 0xFFA500,
      footer: `React with ${emoji} to get your message highlighted!` 
    });
    let files = null;

    if (msg.attachments.size <= 1 && msg.attachments.every(x => x.url.endsWith("png") || x.url.endsWith("jpeg") || x.url.endsWith("jpg") || x.url.endsWith("gif"))) {
      if (msg.attachments.size != 0) {
        embed.setImage(msg.attachments.first().url)
      }
    } else {
      files = msg.attachments.array();
    }

    if (msg.content != "") {
      embed.addField( `**${msg.member.nickname || msg.author.username} said**`, msg.content);
    }

    embed.addField(`Source`, `[Click](${msg.url})`);
    const botMessage = await channel.send({
      content: content,
      files: msg.attachments.array(),
      embed: embed
    });
    QuotesRepository.Add(guildId, botMessage.id, msg.id)
  }
}
