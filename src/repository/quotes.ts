import { QuoteState } from "../interfaces/quoteStateUnum";
import Database from "../lib/database";

export default class QuotesRepository {

	static async Add(guildId: number, messageId: number, state: QuoteState) {
		const database = Database.getInstance();

		await database.query("INSERT INTO Quotes SET ?", [{
			guildId: guildId,
			messageId: messageId,
			state: state,
		}]);
	}

}