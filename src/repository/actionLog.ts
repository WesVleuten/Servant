import Database from '../lib/database';
import { ActionType } from '../interfaces/actionTypeEnum';

export default class ActionLogRepository {

	// data here contains context related to the actionType, therefore we don't
	// exactly know what it will contain, so we disable any linter here
	/* eslint-disable @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any */
	static async Add(serverId: number, userId: string|null, actionType: ActionType, channelId: string|null, data: any) {
		/* eslint-enable */
		const database = Database.getInstance();

		await database.query('INSERT INTO ActionLog SET ?', [{
			serverId: serverId,
			userId: userId,
			action: actionType,
			channelId: channelId,
			data: data ? Buffer.from(JSON.stringify(data)).toString('base64') : '',
		}]);
	}

}
