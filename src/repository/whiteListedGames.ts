import Database from "../lib/database";
import whiteListedGame from "../interfaces/whiteListedGame";

export default class WhiteListedGamesRepository {

	static async GetByGuildId(guildId: string | undefined): Promise<whiteListedGame[]|null> {
		if (!guildId) {
			return null;
		}
		const database = Database.getInstance()

		return await database.query<whiteListedGame[]>("SELECT * FROM WhiteListedGames WHERE guildId = ?", [guildId]);
  }
  
	static async Add(guildId: string | undefined, id: string, name: string) {
		if (!guildId) {
			return;
		}
		const database = Database.getInstance();

		await database.query("INSERT INTO WhiteListedGames SET ?", [{
			guildId: guildId,
			id: id,
			name: name,
		}]);
	}

	static async Remove(guildId: string | undefined, name: string) {
		if (!guildId) {
			return;
		}
		const database = Database.getInstance();

		await database.query("DELETE FROM WhiteListedGames WHERE guildId = ? AND name = ?", [guildId, name]);
	}
	
}