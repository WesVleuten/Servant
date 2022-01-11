export interface Mute {
	id: number;
	guildId: string;
	userId: string;
	byUserId: string;
	start: Date;
	until: Date;
	end: Date;
	reason: string;
}

