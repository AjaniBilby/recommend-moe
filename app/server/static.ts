import { serveFile } from "jsr:@std/http/file-server";
import { join } from "https://deno.land/std/path/mod.ts";

const index = new Map<string, string>();


export async function ServeStatic(folder: string, offset = "/") {
	if (!folder.endsWith("/")) folder = folder + "/";

	for await (let file of RecursiveReaddir(folder)) {
		file = file.replaceAll("\\", "/");
		const path = offset + file.slice(folder.length);
		index.set(path, file);
	}
}


async function* RecursiveReaddir(path: string): AsyncGenerator<string, void> {
	for await (const dirEntry of Deno.readDir(path)) {
		if (dirEntry.isDirectory) {
			yield* RecursiveReaddir(join(path, dirEntry.name));
		} else if (dirEntry.isFile) {
			yield join(path, dirEntry.name);
		}
	}
}


export function StaticResponse(req: Request) {
	const url = new URL(req.url);
	const path = index.get(url.pathname);

	if (!path) return null;

	return serveFile(req, path);
}