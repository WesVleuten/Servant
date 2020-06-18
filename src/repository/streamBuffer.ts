export default class StreamBuffer {

	private static _instance: StreamBuffer;
	public static getInstance() {
		if (this._instance == null) {
			this._instance = new StreamBuffer();
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