import Database from '../lib/database';
import { BlackListedChannel } from '../interfaces/blackListedChannel';

export default class BlackListRepository {

	static async GetByGuildId(guildId: string | undefined): Promise<BlackListedChannel[] | null> {
		if (!guildId) {
			return null;
		}
		const database = Database.getInstance();

		return await database.query<BlackListedChannel[]>('SELECT * FROM BlackListedChannels WHERE guildId = ?', [guildId]);
	}

	static async AddChannel(guildId: string | undefined, channelId: string): Promise<void> {
		if (!guildId) {
			return;
		}
		const database = Database.getInstance();

		await database.query('INSERT INTO BlackListedChannels SET ?', [{
			guildId: guildId,
			channelId: channelId
		}]);
	}

	static async RemoveChannel(guildId: string | undefined, channelId: string): Promise<void> {
		if (!guildId) {
			return;
		}
		const database = Database.getInstance();

		await database.query('DELETE FROM BlackListedChannels WHERE guildId = ? AND channelId = ?', [guildId, channelId]);
	}

}

