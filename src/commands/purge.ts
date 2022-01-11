import { ICommand, PermissionLevel } from './base';
import { Message, Client } from 'discord.js';

export default class PurgeCommand implements ICommand {

	commandName = 'purge';
	aliases = null;
	permissionLevel = PermissionLevel.Moderator;
	guildOnly = false;

	usageText = ';purge <amount> [user]';
	helpText = 'Deletes amount of messages, optionally of specific user';

	async run(discordClient: Client, message: Message, args: string[]): Promise<void> {
		if (args.length < 1) {
			return;
		}

		let amount = parseInt(args[0], 10);
		if (isNaN(amount) || amount == 0) {
			message.reply(this.usageText);
			return;
		}

		if (message.mentions.members && message.mentions.members?.size > 0) {
			// Up the amount massively so it can be filtered on a specific user
			amount *= 4;
		}

		await message.delete();
		let fetched = await message.channel.messages.fetch({ limit: amount });
		if (message.mentions.members && message.mentions.members?.size > 0) {
			// Bring amount back down again
			amount /= 4;

			const guildMember = message.mentions.members?.first();
			const maxTimestamp = new Date();
			maxTimestamp.setDate((new Date()).getDate() - 14);

			fetched = fetched.filter(m => m.author.id === guildMember?.id && m.createdAt > maxTimestamp);
			while (fetched.size > amount) {
				const next = fetched.lastKey();
				if (!next) {
					break;
				}

				fetched.delete(next);
			}
		}

		await message.channel.bulkDelete(fetched);

		const sent = await message.reply(`${fetched.size} message(s) has been deleted.`);
		sent.delete({
			timeout: 2500
		});
	}

}

