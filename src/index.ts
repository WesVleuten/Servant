if (parseInt(process.version.slice(1).split('.')[0], 10) < 12) {
	throw new Error('Node.js 12 or higher is required. Update Node on your system.');
}

import { Client as DiscordClient } from 'discord.js';
import { DiscordInteractions } from 'slash-commands';
import Config from './lib/config';
import { BindRoutes, registerSlashCommand } from './routes';

const discord = new DiscordClient();
BindRoutes(discord);
discord.login(Config.discord.botToken);

const interaction = new DiscordInteractions({
	applicationId: Config.discord.clientId,
	authToken: Config.discord.botToken,
	publicKey: Config.discord.publicKey,
});
registerSlashCommand(interaction);

