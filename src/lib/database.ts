import * as MySQL from 'mysql';
import config from './config';

export default class Database {

	private static _instance: Database;
	public static getInstance(): Database {
		if (this._instance == null) {
			this._instance = new Database();
		}
		return this._instance;
	}

	private connection: MySQL.Connection;

	constructor() {
		this.connection = MySQL.createConnection({
			host: config.database.host,
			user: config.database.user,
			password: config.database.password,
			database: config.database.database,
		});
	}

	async end(): Promise<void> {
		return new Promise((resolve, reject) => {
			this.connection.end(err => {
				if (err) {
					reject(err);
					return;
				}
				resolve();
			});
		});
	}

	/* eslint-disable @typescript-eslint/no-explicit-any */
	async query<T>(query: string, parameters?: any[]): Promise<T> {
		return new Promise((resolve, reject) => {
			this.connection.query(query, parameters, (err: MySQL.MysqlError|null, result: T) => {
				if (err) {
					reject(new Error(`${err.fatal ? 'FATAL' : 'NONFATAL'} ${err.name}, ${err.message}\n${err.sql}`));
					return;
				}
				resolve(result);
			});
		});
	}

}
