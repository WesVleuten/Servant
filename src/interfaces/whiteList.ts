import WhiteListedGame from "./whiteListedGame";
import WhiteListedRole from "./whiteListedRole";

export default interface WhiteList {
	games: WhiteListedGame[];
	roles: WhiteListedRole[];
}