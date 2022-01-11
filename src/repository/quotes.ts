import { Quote } from "../interfaces/quote";
import Database from "../lib/database";

export default class QuotesRepository {

	static async Add(guildId: string, botMessageId: string, quotedMessageId: string | null) {
		const database = Database.getInstance();

		await database.query("INSERT INTO Quotes SET ?", [{
			guildId: guildId,
			botMessageId: botMessageId,
			quotedMessageId: quotedMessageId
		}]);
	}

	static async Delete(guildId: string, messageId: string): Promise<void> {
		const database = Database.getInstance();

		await database.query<Quote[]>("DELETE FROM Quotes WHERE guildId = ? AND (quotedMessageId = ? OR botMessageId = ?)", [guildId, messageId, messageId]);
	}

	static async Get(guildId: string, messageId: string): Promise<Quote | null> {
		const database = Database.getInstance();

		const quote = await database.query<Quote[]>("SELECT * FROM Quotes WHERE guildId = ? AND (quotedMessageId = ? OR botMessageId = ?)", [guildId, messageId, messageId]);
		return quote.length !== 0 ? quote[0] : null;
	}

}