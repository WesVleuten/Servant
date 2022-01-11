export default class StreamTimeoutRepository {

	private static _instance: StreamTimeoutRepository;
	public static getInstance(): StreamTimeoutRepository {
		if (this._instance == null) {
			this._instance = new StreamTimeoutRepository();
		}
		return this._instance;
	}

	private streams: Map<string, Date>;
	constructor() {
		this.streams = new Map<string, Date>();
	}

	set(userId: string, timestamp: Date): void {
		this.streams[userId] = timestamp;
	}

	get(userId: string): Date | null {
		return this.streams[userId];
	}

}

