import { CutString } from "~/util/format/text.ts";
import { Mutex } from "~/util/schedule.ts";

export { FormStream };

type Reader = ReadableStreamDefaultReader<Uint8Array<ArrayBufferLike>>;

export type FormStreamField = {
	disposition: Record<string, string> & { name: string };
	headers:     Headers;
	stream:      AsyncGenerator<Uint8Array<ArrayBufferLike>, void, unknown>;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const endBoundary = encoder.encode(`--`);
const crlfBytes   = encoder.encode("\r\n");
const headerEnd   = encoder.encode("\r\n\r\n");

function FormStream(request: Request): AsyncGenerator<FormStreamField, void, unknown>
function FormStream(stream: Reader, boundary: string): AsyncGenerator<FormStreamField, void, unknown>
async function* FormStream(a: Request | Reader, b?: string): AsyncGenerator<FormStreamField, void, unknown> {

	let ctx: FormStreamContext;
	if (a instanceof Request) {
		const x = ExtractRequest(a);
		ctx = new FormStreamContext(x.boundary, x.reader);
	} else if (a instanceof ReadableStream) {
		if (!b) throw new Error("Expected a boundary to be given");
		if (typeof b !== "string") throw new Error("Form boundary must be given as a string");
		ctx = new FormStreamContext(b, a);
	} else throw new Error("Expected a stream or a request");




	{ // Skip preamble and first boundary
		await ctx.readChunk();
		const boundaryIndex = FindSequence(ctx.buffer, ctx.boundary);
		if (boundaryIndex === -1) throw new Error("No initial boundary found");
		ctx.drain(boundaryIndex + ctx.boundary.byteLength + crlfBytes.byteLength)
	}

	while (!ctx.done) {
		// fill buffer until the header is complete
		let header = 0;
		while (true) {
			const i = FindSequence(ctx.buffer, headerEnd, header);
			if (i !== -1) {
				header = i;
				break;
			}

			// ran out of bytes
			if (ctx.done) return;

			// skip searching already covered region
			header = ctx.buffer.byteLength-headerEnd.byteLength+1;
			await ctx.readChunk();
		}


		// field start
		const headers = ParseHeaders(decoder.decode(ctx.buffer.slice(0, header)));

		const d = headers.get("Content-Disposition");
		if (!d) throw new Error("")
		const disposition = ParseDisposition(d);

		ctx.buffer = ctx.buffer.slice(header + headerEnd.byteLength);
		ctx.draining = true;

		ctx.mutex.block();
		const stream = Drain(ctx);

		yield { disposition, headers, stream };

		while (true) { // drain any remaining values
			const res = await stream.next();
			if (res.done) break;
			console.log('drain');
		}


		if (ctx.buffer.byteLength < crlfBytes.byteLength) await ctx.readChunk();
		if (BufferMatchAt(ctx.buffer, endBoundary, 0)) break; // finished

		if (!BufferMatchAt(ctx.buffer, crlfBytes)) {
			console.error("Missing boundary newline")
			break;
		}
		ctx.drain(crlfBytes.byteLength);
	}
}


export async function FormStreamTextField(reader: ReadableStreamDefaultReader<Uint8Array<ArrayBufferLike>>) {
	const chunks: Uint8Array[] = [];

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			chunks.push(value);
		}
	} finally {
		reader.releaseLock();
	}

	return ConcatBuffers(chunks);
}

export async function FormStreamEmptyField(reader: ReadableStreamDefaultReader<Uint8Array<ArrayBufferLike>>) {
	try {
		while (true) {
			const { done } = await reader.read();
			if (done) break;
		}
	} finally {
		reader.releaseLock();
	}

}

async function* Drain(ctx: FormStreamContext) {
	while (true) {
		const i = FindSequence(ctx.buffer, ctx.border);
		if (i !== -1) {
			yield ctx.buffer.slice(0, i);
			ctx.drain(i+ctx.border.byteLength);
			break;
		}

		if (ctx.done) {
			yield ctx.buffer;
			break;
		}

		const tail = ctx.border.byteLength-1;
		const till = ctx.buffer.byteLength - tail;
		yield ctx.buffer.slice(0, till);
		ctx.drain(tail);

		await ctx.readChunk();
	}
}


class FormStreamContext {
	readonly mutex: Mutex;
	readonly reader: Reader;
	readonly boundary: Uint8Array;
	readonly border: Uint8Array;
	buffer: Uint8Array;
	done:   boolean;

	draining: boolean;

	constructor (boundary: string, reader: Reader) {
		this.mutex = new Mutex();
		this.boundary = encoder.encode(`--${boundary}`);
		this.border = encoder.encode(`\r\n--${boundary}`);
		this.reader = reader;
		this.buffer = new Uint8Array();

		this.draining = false;
		this.done = false;
	}

	async readChunk() {
		if (this.done) return;

		try {
			const { value, done: final } = await this.reader.read();
			this.done = final;

			if (!value) return;

			this.buffer = ConcatBuffers([this.buffer, value]);
		} catch (e) {
			console.error(e);
			this.done = true;
		}
	}

	drain (bytes: number) { this.buffer = this.buffer.slice(bytes) }
}



function ParseHeaders (raw: string) {
	const headers = new Headers();
	for (const line of raw.split("\r\n")) {
		const [ name, value ] = CutString(line, ":").map(x => x.trim());
		headers.set(decodeURIComponent(name), decodeURIComponent(value));
	}
	return headers;
}

function ParseDisposition(raw: string): Record<string, string> & { name: string } {
	if (!raw.startsWith("form-data; ")) throw new Error("Content-Disposition must be form-data");
	raw = raw.slice("form-data; ".length);

	const disposition: Record<string, string> & { name: string } = { name: "" };
	for (const fragment of raw.split("; ")) {
		const [ n, v ] = CutString(fragment, "=");
		const name = decodeURIComponent(n);
		if (!v) {
			disposition[name] = "";
			continue;
		}

		const value = decodeURIComponent(v.slice(1, -1)); // strip ""
		disposition[name] = value;
	}

	if (!disposition["name"]) throw new Error(`Content-Disposition missing name`);

	return disposition;
}


function ExtractRequest(request: Request) {
	const contentType = request.headers.get("content-type");
	if (!contentType?.includes("multipart/form-data")) throw new Error("Request is not multipart/form-data");

	const boundary = GetBoundary(contentType);
	if (!boundary) throw new Error("No boundary found in Content-Type header");

	const reader = request.body?.getReader();
	if (!reader) throw new Error("Request body is not readable");

	return { boundary, reader };
}

function GetBoundary(contentType: string): string | null {
	const match = contentType.match(/boundary=([^;]+)/);
	return match ? match[1].replace(/"/g, "") : null;
}


export function ConcatBuffers(buffers: Uint8Array[]) {
	const result = new Uint8Array(buffers.reduce((s, x) => s + x.byteLength, 0));

	let offset = 0;
	for (const b of buffers) {
		result.set(b, offset);
		offset += b.byteLength;
	}

	return result;
}

function FindSequence(buffer: Uint8Array, sequence: Uint8Array, offset = 0): number {
	for (let i=offset; i <= buffer.length-sequence.length; i++) {
		if (BufferMatchAt(buffer, sequence, i)) return i;
	}
	return -1;
}

function BufferMatchAt(buffer: Uint8Array, sequence: Uint8Array, offset = 0): boolean {
	for (let i=0; i<sequence.byteLength; i++) {
		if (buffer[i+offset] != sequence[i]) return false;
	}

	return true;
}