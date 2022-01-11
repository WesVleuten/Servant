import { MessageEmbed } from 'discord.js';

interface Field {
	key: string;
	value: string;
	inline?: boolean;
}

interface Embed {
	title?: string;
	color?: number|'random';
	author?: string;
	authorIcon?: string;
	footer?: string;
	footerIcon?: string;
	image?: string;
	description?: string;
	thumbnail?: string;

	hideTimestamp?: boolean;

	fields?: Field[];
}

function randomColor() {
	return '#000000'.replace(/0/g, () => (~~(Math.random() * 16)).toString(16));
}

function safeFieldValue(input: string): string {
	if (input == null || input == '') {
		return '**Empty**';
	}
	return input;
}

export default function createMessageEmbed(input: Embed): MessageEmbed {

	const embed = new MessageEmbed();

	if (input.title != undefined) {
		embed.setTitle(input.title);
	}

	if (input.color != undefined) {
		if (input.color == 'random') {
			embed.setColor(randomColor());
		} else {
			embed.setColor(input.color);
		}
	}

	if (input.author != undefined) {
		embed.setAuthor(input.author, input.authorIcon);
	}

	if (input.footer != undefined) {
		embed.setFooter(input.footer, input.footerIcon);
	}

	if (input.image != undefined) {
		embed.setImage(input.image);
	}

	if (input.thumbnail != undefined) {
		embed.setThumbnail(input.thumbnail);
	}

	if (input.description != undefined) {
		embed.setDescription(input.description);
	}

	if (input.fields != undefined) {
		for (const field of input.fields) {
			embed.addField(field.key, safeFieldValue(field.value), field.inline ?? false);
		}
	}

	if (input.hideTimestamp !== false) {
		embed.setTimestamp();
	}
	return embed;
}
