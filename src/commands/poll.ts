import { ICommand, PermissionLevel } from './base';
import { Message, Client } from 'discord.js';
import createMessageEmbed from '../wrapper/discord/messageEmbed';

export default class PollCommand implements ICommand {

	commandName = 'poll';
	aliases = null;
	permissionLevel = PermissionLevel.User;
	guildOnly = false;

	usageText = ';poll <question>';
	helpText = 'Makes a simple poll';

	agreeEmoji = '772552297075048468';
	disagreeEmoji = '772552252782411816';

	async run(discordClient: Client, message: Message): Promise<void> {
		const pollContent = message.content.substr(2 + this.commandName.length);
		const embed = createMessageEmbed({
			color: 0x33CC33,
			title: 'QuickPoll',
			description: pollContent,
			thumbnail: 'https://i.ibb.co/Y08zHnb/Pika.png',
			footer: 'Reminder: Use *;poll <question>* to create a new poll'
		});

		const sendMessage = await message.channel.send({embed});
		await sendMessage.react(this.agreeEmoji);
		await sendMessage.react(this.disagreeEmoji);
		await message.delete();
		return;
	}

}

