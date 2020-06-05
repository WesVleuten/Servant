import { default as fetch, RequestInfo, RequestInit, Response } from 'node-fetch';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

interface RequestInitExtended extends RequestInit {
	retryOn: (attempt: number, error: Error | null, response: Response | null) => Promise<boolean>;
	retries: number;
	retryDelay: number;
}

export default async function fetchRetry(input: RequestInfo, init: RequestInitExtended): Promise<Response> {
	const {
		retryOn,
		retries,
		retryDelay,
	} = init;
	
	const retry = async attempt => {
		if (attempt < retries) {
			await sleep(retryDelay);
			return tryFetch(attempt + 1);
		} else {
			throw new Error('Retry attempts exeeded maximum retries')
		}
	};

	const tryFetch = async attempt => {
		try {
			const response = await fetch(input, init)
		
			if (await retryOn(attempt, null, response)) {
				return retry(attempt);
			} else {
				return response;
			}
		} catch(error) {
			if (await retryOn(attempt, error, null)) {
				return retry(attempt);
			} else {
				throw error;
			}
		}
	};

	return tryFetch(0);
}
