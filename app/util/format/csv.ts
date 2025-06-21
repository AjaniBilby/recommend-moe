import { FormStreamEmptyField, FormStream } from "~/util/form.ts";
import { ShapeArray } from "~/util/format/object.ts";
import { LazyValue } from "~/util/schedule.ts";

/**
 * Parses a ReadableStream of strings into CSV rows.
 *
 * This async generator function correctly handles CSVs with quoted fields
 * that may contain newlines and escaped quotes (`""`). It processes the
 * stream chunk by chunk, maintaining state across chunks to ensure that
 * rows are parsed correctly regardless of where chunks begin or end.
 *
 * @param stream A ReadableStream<string> containing the CSV data.
 * @returns An AsyncGenerator that yields each parsed CSV row as an array of strings.
 *
 * @example
 * ```ts
 * const csvData = 'header1,header2,header3\n' +
 *   'a,b,c\n' +
 *   'd,"e\nwith newline",f\n' +
 *   'g,h,"i with ""escaped"" quotes"';
 *
 * const stream = ReadableStream.from((async function* () {
 *   // Simulate a stream by yielding chunks
 *   yield csvData.substring(0, 25);
 *   yield csvData.substring(25);
 * })());
 *
 * (async () => {
 *   for await (const row of parseCsvStream(stream)) {
 *     console.log(row);
 *   }
 * })();
 *
 * // Expected Output:
 * // [ 'header1', 'header2', 'header3' ]
 * // [ 'a', 'b', 'c' ]
 * // [ 'd', 'e\nwith newline', 'f' ]
 * // [ 'g', 'h', 'i with "escaped" quotes' ]
 * ```
 */
export async function* CsvStream(stream: ReadableStream<string>): AsyncGenerator<string[]> {
	const reader = stream.getReader();

	let inQuote = false;
	let row: string[] = [];
	let buffer = "";

	while (true) {
		const { done, value } = await reader.read();
		const chunk = value || "";

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

export async function* CsvStreamWithHeaders(stream: ReadableStream<string>): AsyncGenerator<Record<string, string>> {
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
			if (done) {
				await FormStreamEmptyField(field.stream.getReader());
				continue;
			}

			if (!field.disposition.filename) await FormStreamEmptyField(field.stream.getReader());
			if (field.headers.get("content-type") !== "text/csv") await FormStreamEmptyField(field.stream.getReader());

			const textStream = field.stream.pipeThrough(new TextDecoderStream());
			const csv = CsvStream(textStream);

			const header = await csv.next();
			if (header.done || !header.value) continue;

			const missing = format.filter(expect => !header.value.includes(expect));
			if (missing.length > 0) {
				rej(new Response("CSV missing columns "+missing.join(", ")));
				done = true;
				continue;
			}

			res(ShapeCsvStream(csv, format));
			done = true;
			break;
		}

		if (!done) rej(new Response("no csv present"));
	})
}