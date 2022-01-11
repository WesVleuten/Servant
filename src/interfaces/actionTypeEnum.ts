export enum ActionType {
	Unkown			= 0,

	UserBan			= 1,
	UserKick		= 2,
	UserMute		= 3,
	UserWarn		= 4,

	UserRoleAdd		= 10,
	UserRoleDelete	= 11,

	MessageEdit		= 100,
	MessageDelete	= 101,
	MessagePurge	= 102,

	VoiceChatJoin	= 110,
	VoiceChatLeave	= 111,
	VoiceChatMove	= 112,
}