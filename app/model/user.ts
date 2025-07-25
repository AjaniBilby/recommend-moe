import { Cookies } from "htmx-router/cookies";

export function GetUserID(request: Request, cookies: Cookies) {
	const user = cookies.get("userID");
	if (!user) return null;

	return Number(user) || null;
}