import { WhiteListedGame } from './whiteListedGame';
import { WhiteListedRole } from './whiteListedRole';

export interface WhiteList {
	games: WhiteListedGame[];
	roles: WhiteListedRole[];
}
