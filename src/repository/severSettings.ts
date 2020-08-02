import ServerSettings from "../interfaces/serverSettings";
import Database from "../lib/database";

export default class ServerSettingsRepository {
	
	static async Create(guildId: string): Promise<boolean> {
		return await this.Save({
			id: 0,
			guildId: guildId,
			deleted: null,
			prefix: ';',
			logChannel: null,
			modLogChannel: null,
			systemNotice: true,
			streamLiveRole: null,
			streamShout: null,
			streamTimeout: 6,
			adminRole: null, 
      moderatorRole: null,
      muteRole: null,
      muteChannel: null,
		});
	}

	static async GetByGuildId(guildId: string|undefined): Promise<ServerSettings|null> {
		if (!guildId) {
			return null;
		}
		const database = Database.getInstance()

		const result = await database.query<ServerSettings[]>("SELECT * FROM ServerSettings WHERE guildId = ?", [ guildId ]);
		if (result.length == 1) {
			return result[0];
		}
		return null;
	}

	static async Save(serverSettings: ServerSettings): Promise<boolean> {
		const database = Database.getInstance()

		try {
			if (serverSettings.id == 0) {
				await database.query("INSERT INTO ServerSettings SET ?", [ serverSettings ]);
			} else {
				await database.query("UPDATE ServerSettings SET ? WHERE id = ?", [ serverSettings, serverSettings.id ]);
			}
			return true;
		} catch(e) {
			console.log(e);
			return false;
		}
	}

}