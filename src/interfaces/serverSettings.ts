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
	streamTimeout: number;

	adminRole: string|null;
	moderatorRole: string|null;
	
	quoteThreshold: number;
	quoteEmoji: string|null;
  quoteChannel: string | null;
  
	muteRole: string|null;
	muteChannel: string|null;
}