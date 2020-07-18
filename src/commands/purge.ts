import { ICommand, PermissionLevel } from "./base";
import { Message, Client } from "discord.js";

export default class PurgeCommand implements ICommand {

	commandName = 'purge';
	aliases = null;
	permissionLevel = PermissionLevel.Moderator;
	guildOnly = false;

	usageText = ";purge [amount]";
	helpText = "Deletes amount of messages";

	async run(discordClient: Client, message: Message, args: string[]) {
		if (args.length < 1) {
			return;
		}

		let amount = parseInt(args[0], 10);

		if (isNaN(amount) || amount == 0) {
			message.reply(this.usageText)
			return;
		};

		amount += 1; //delete command execution

		const fetched = await message.channel.messages.fetch({limit: amount});
		await message.channel.bulkDelete(fetched);

		const sent = await message.reply(`${amount-1} message(s) has been deleted.`)
		sent.delete({
			timeout: 2500
		});
	}

}

