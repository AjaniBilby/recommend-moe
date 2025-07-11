import { FormStream } from "~/util/form.ts";
import { ShapeArray } from "~/util/format/object.ts";

const decoder = new TextDecoder();
export async function* CsvStream(stream: AsyncGenerator<Uint8Array>): AsyncGenerator<string[]> {
	let inQuote = false;
	let row: string[] = [];
	let buffer = "";

	while (true) {
		const { done, value } = await stream.next();
		if (!value) break;

		const chunk = decoder.decode(value);

		for (let i=0; i<chunk.length; i++) {
			const char = chunk[i];

			if (inQuote) {
				if (char !== '"') {
					buffer += char;
					continue;
				}

				// '""' escape detection, remove the previous '"'
				if (buffer.length > 0 && buffer[buffer.length-1] === '"') {
					buffer = buffer.slice(0, buffer.length-1);
				} else inQuote = false;

				continue;
			}

			switch (char) {
				case '"': { inQuote = true; break; }
				case ",": { row.push(buffer); buffer = ""; break; }
				case "\n": {
					// trim of the carriage return
					const field = buffer.length > 0 && buffer[buffer.length-1] === "\r"
						? buffer.slice(0, buffer.length-1)
						: buffer;

					row.push(field);
					yield row;

					buffer = "";
					row = [];
					break;
				}
				default: buffer += char;
			}
		}

		if (done) break;
	}

	// cleanup
	if (buffer.length > 0) row.push(buffer);
	if (row.length > 0) yield row;
}

export async function* CsvStreamWithHeaders(stream: AsyncGenerator<Uint8Array>): AsyncGenerator<Record<string, string>> {
	let header: string[] | undefined;
	for await (const line of CsvStream(stream)) {
		if (!header) {
			header = line;
			continue;
		}

		yield ShapeArray(header, line);
	}
}

async function* ShapeCsvStream<T extends string[]>(stream: AsyncGenerator<string[]>, shape: T) {
	for await (const line of stream) yield ShapeArray(shape, line);
}


export function CsvFormStream<T extends string[]>(request: Request, format: T) {
	// deno-lint-ignore no-async-promise-executor
	return new Promise<AsyncGenerator<Record<T[number], string>, void, unknown>>(async (res, rej) => {
		let done = false;

		for await (const field of FormStream(request)) {
			if (done) continue;

			if (!field.disposition.filename) continue;
			if (field.headers.get("content-type") !== "text/csv") continue;

			const csv = CsvStream(field.stream);

			const header = await csv.next();
			if (header.done || !header.value) continue;

			const missing = format.filter(expect => !header.value.includes(expect));
			if (missing.length > 0) {
				rej(new Response("CSV missing columns "+missing.join(", ")));
				done = true;
				continue;
			}

			res(ShapeCsvStream(csv, header.value as T));
			done = true;
			break;
		}

		if (!done) rej(new Response("no csv present"));
	})
}