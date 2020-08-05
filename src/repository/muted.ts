import Database from "../lib/database";
import Mute from "../interfaces/mute";

export default class MutedRepository {

	static async Add(guildId: string|undefined, userId: string, byUserId: string, date: Date, until: Date, reason: string) {
		if (!guildId) {
			return;
		}
		const database = Database.getInstance();
		
		const mute = {
			guildId: guildId,
			userId: userId,
			byUserId: byUserId,
			date: date,
			until: until,
			reason: reason,
		};

		await database.query("INSERT INTO Muted SET ?", [mute]);
		return mute
	}
	
	static async IsMuted(guildId: string|undefined, userId: string) { 
		if (!guildId) {
			return null;
		}
		const database = Database.getInstance();
		
		const mute = await database.query<Mute[]>("SELECT * FROM Muted WHERE guildId = ? AND userId = ?", [guildId, userId]);
		return mute.length !== 0;
	}

	static async GetAll(guildId: string|undefined): Promise<Mute[]|null> {
		if (!guildId) {
			return null;
		}
		const database = Database.getInstance();
		
		return await database.query<Mute[]>("SELECT * FROM Muted WHERE guildId = ?", [guildId]);
	}
	
	static async Remove(guildId: string|undefined, userId: string|undefined) {
		if (!guildId) {
			return;
		}
		const database = Database.getInstance();

		await database.query("DELETE FROM Muted WHERE guildId = ? AND userId = ?", [guildId, userId]);
	}

}