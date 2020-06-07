export default interface ServerSettings {
	id: number;
	guildId: string;
	deleted: Date|null;
	
	prefix: string;
	
	logChannel: string|null;
	modLogChannel: string|null;
	
	systemNotice: boolean;

	streamLiveRole: string|null;
	streamShout: string|null;

	adminRole: string|null;
	moderatorRole: string | null;
}