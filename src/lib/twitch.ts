import config from './config';
import fetchRetry from "../lib/fetchRetry";
import fetch from "node-fetch";

export default class TwitchClient {

	private accessToken: string;
	private expires: number;

	private static _instance: TwitchClient;
	public static getInstance() {
		if (this._instance == null) {
			this._instance = new TwitchClient();
		}
		return this._instance;
	}

	async getAccessToken(): Promise<string | null> {
		if (this.expires > Date.now()) {
			return this.accessToken;
		}

		const authUrl = `https://id.twitch.tv/oauth2/token?client_id=${config.twitch.clientId}&client_secret=${config.twitch.clientSecret}&grant_type=client_credentials`;
		const authResponse = await fetch(authUrl, {
			method: 'post',
		});

		const authJson = await authResponse.json();
		if (authResponse.status !== 200) {
			return null;
		}

		this.accessToken = authJson.access_token; 
		this.expires = Date.now() + authJson.expires_in;

		return this.accessToken;
	}

	async getGameData(name: string): Promise<any | null> {
		const twitchUri = `https://api.twitch.tv/helix/games?name=${name}`;
		const userAgent = "Servant"

		const gameResponse = await fetch(twitchUri, {
			method: 'get',
			headers: {
				'Client-ID': config.twitch.clientId,
				'User-Agent': userAgent,
				'Authorization': 'Bearer ' + await this.getAccessToken()
			}
		})

		const gameJson = await gameResponse.json();
		if (gameJson.data.length == 0) {
			return null;
		}

		return gameJson.data[0];
	}

	async getStreamer(name: string): Promise<any | null> {
		const twitchUri = `https://api.twitch.tv/helix/streams?user_login=${name}`;
		const userAgent = "Servant"

    try {
      const statusResponse = await fetchRetry(twitchUri, {
        retries: 10,
        retryDelay: 30000,
        retryOn: async function (attempt, error, response) {
          const clone = response?.clone()
          if (!clone) {
            return true;
          }

          const responseData = await clone.json()
          if (responseData.data.length == 0) {
            return true;
          }

          return false;
        },
        method: 'get',
        headers: {
          'Client-ID': config.twitch.clientId,
          'User-Agent': userAgent,
          'Authorization': 'Bearer ' + await this.getAccessToken()
        }
      })

      const statusJson = await statusResponse.json();
      if (statusJson.data.length == 0) {
        return null;
      }
  
      return statusJson.data[0];
    } catch(e) {
			return null;
		}
	}

}