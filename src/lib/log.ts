
/* eslint-disable @typescript-eslint/no-explicit-any */
function Stringify(input: any) {
	if (typeof input == 'string') {
		return input;
	}
	if (typeof input == 'object') {
		try {
			return JSON.stringify(input);
		} catch(e) {
			return `Unstringifyable object (${e.message})`;
		}
	}
	if (typeof input == 'number') {
		return input.toString();
	}
	if (typeof input == 'undefined') {
		return 'undefined';
	}
	return input.toString();
}

export default class Logger {

	static info(...args: any[]): void {
		console.log('[INFO]', args.map(x => Stringify(x)).join(', '));
	}

	static warn(...args: any[]): void {
		console.log('[WARN]', args.map(x => Stringify(x)).join(', '));
	}

	static error(...args: any[]): void {
		console.log('[ERRR]', args.map(x => Stringify(x)).join(', '));
	}

}
