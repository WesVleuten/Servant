import { ICommand, PermissionLevel } from './base';
import { Message, Client } from 'discord.js';
import ServerSettingsRepository from '../repository/serverSettings';
import WhiteListRepository from '../repository/whiteList';
import TwitchClient from '../lib/twitch';
import createMessageEmbed from '../wrapper/discord/messageEmbed';
import { SetMutedPermissionsForChannel } from '../lib/mutedRole';
import ObjectResolver from '../lib/objectResolver';
import { CreateOrUpdateQuote } from '../lib/quote';

export default class MQuoteCommand implements ICommand {

	commandName = 'mquote';
	aliases = null;
	permissionLevel = PermissionLevel.Administrator;
	guildOnly = true;

	usageText = ';mquote <messageid>';
	helpText = 'Manually adds a message to the quote channel';

	async run(discordClient: Client, message: Message, args: string[]): Promise<void> {
        if (args.length != 1) {
            return;
        }
        try {
            const quotemessage = await message.channel.messages.fetch(args[0]);
            CreateOrUpdateQuote(discordClient, quotemessage);
            message.reply("Should be done :)");
        } catch(e) {
            console.error(e);
            message.reply("ERROR AAAAAAAA");
        }
    }
}