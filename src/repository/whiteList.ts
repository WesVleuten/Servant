import Database from "../lib/database";
import WhiteListedGame from "../interfaces/whiteListedGame";
import WhiteListedRole from "../interfaces/whiteListedRole";
import WhiteList from "../interfaces/whiteList";

export default class WhiteListRepository {

	static async GetByGuildId(guildId: string | undefined): Promise<WhiteList | null> {
		if (!guildId) {
			return null;
		}
		const database = Database.getInstance()

		const games = await database.query<WhiteListedGame[]>("SELECT * FROM WhiteListedGames WHERE guildId = ?", [guildId]);
		const roles = await database.query<WhiteListedRole[]>("SELECT * FROM WhiteListedRoles WHERE guildId = ?", [guildId]);
		
		return { 
			games: games,
			roles: roles,
		};
	}

	static async AddGame(guildId: string | undefined, id: string, name: string) {
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

	static async RemoveGame(guildId: string | undefined, name: string) {
		if (!guildId) {
			return;
		}
		const database = Database.getInstance();

		await database.query("DELETE FROM WhiteListedGames WHERE guildId = ? AND name = ?", [guildId, name]);
	}

	static async AddRole(guildId: string | undefined, id: string, name: string) {
		if (!guildId) {
			return;
		}
		const database = Database.getInstance();

		await database.query("INSERT INTO WhiteListedRoles SET ?", [{
			guildId: guildId,
			id: id,
			name: name,
		}]);
	}

	static async RemoveRole(guildId: string | undefined, id: string) {
		if (!guildId) {
			return;
		}
		const database = Database.getInstance();

		await database.query("DELETE FROM WhiteListedRoles WHERE guildId = ? AND id = ?", [guildId, id]);
	}

}