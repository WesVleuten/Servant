import { QuoteState } from "../interfaces/quoteStateUnum";
import Quote from "../interfaces/quote";
import Database from "../lib/database";

export default class QuotesRepository {

	static async Add(guildId: string, botMessageId: string, quotedMessageId: string|null, state: QuoteState) {
		const database = Database.getInstance();

		await database.query("INSERT INTO Quotes SET ?", [{
			guildId: guildId,
			botMessageId: botMessageId,
			quotedMessageId: quotedMessageId,
			state: state,
		}]);
	}
	
	static async Delete(guildId: string, botMessageId: string) {
		const database = Database.getInstance()

		await database.query("DELETE FROM Quotes SET WHERE guildId = ? AND botMessageId = ?", [guildId, botMessageId]);
	}

	static async Get(guildId: string, messageId: string): Promise<Quote|null> {
		const database = Database.getInstance();

		const quote = await database.query<Quote[]>("SELECT * FROM Quotes WHERE guildId = ? AND botMessageId = ?", [guildId, messageId]);
		return quote.length !== 0 ? quote[0] : null;
	}
	
}