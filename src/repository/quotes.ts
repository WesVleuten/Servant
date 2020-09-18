import { QuoteState } from "../interfaces/quoteStateUnum";
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

}