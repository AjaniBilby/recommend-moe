export const TIME_ZONE = new Date().getTimezoneOffset();
export const TIME_SCALE = {
	year: 365 * 24 * 60 * 60 * 1000,
	month: 30 * 24 * 60 * 60 * 1000,
	week:   7 * 24 * 60 * 60 * 1000,
	day:        24 * 60 * 60 * 1000,
	hour:            60 * 60 * 1000,
	minute:               60 * 1000,
	second:                    1000
};
Object.freeze(TIME_SCALE);