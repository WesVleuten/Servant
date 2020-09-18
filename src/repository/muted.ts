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
			start: date,
			until: until,
			reason: reason,
		};

		await database.query("INSERT INTO Muted SET ?", [mute]);
		return await this.GetRunning(guildId, userId);
	}
	
	static async GetRunning(guildId: string|undefined, userId: string) { 
		if (!guildId) {
			return null;
		}
		const database = Database.getInstance();
		
		const mute = await database.query<Mute[]>("SELECT * FROM Muted WHERE guildId = ? AND userId = ? AND end IS NULL", [guildId, userId]);
		return mute.length !== 0 ? mute[0] : null;
	}

	static async GetAllRunning(guildId: string|undefined): Promise<Mute[]|null> {
		if (!guildId) {
			return null;
		}
		const database = Database.getInstance();
		
		return await database.query<Mute[]>("SELECT * FROM Muted WHERE guildId = ? AND end IS NULL", [guildId]);
	}
	
	static async SetUnmuted(id: number, end: Date) {
		const database = Database.getInstance();
		await database.query("UPDATE Muted SET end = ? WHERE id = ? ", [end, id]);
	}

}