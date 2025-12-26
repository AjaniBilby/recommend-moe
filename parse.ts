const RECORD_SIZE = 12;

import { Insert_Score, Set_EmbeddingSize, IndexMedia, IndexUser, memory, GetMediaID } from './wasm/mf-factor.wasm';

const filePath = './scores.bin';
let file: Deno.FsFile | null = null;

Set_EmbeddingSize(128*3);

const collection = await InsertScores();
console.log(collection);

console.time('Index Media');
await IndexMedia();
console.timeEnd('Index Media');

// for (let i=0; i<collection.length; i++) {
// 	const a = collection[i];
// 	const b = GetMediaID(i);

// 	if (a === b) continue;
// 	console.log(a, b);
// }

// console.log(memory.buffer)
await Dump(memory);

console.time('Index User');
await IndexUser();
console.timeEnd('Index User');
await Dump(memory);


async function Dump(memory: WebAssembly.Memory) {
	const view = new Uint8Array(memory.buffer);
	let i = view.length -1;
	for (; i>=0; i--) {
		if (view[i] !== 0) {
			i++;
			break;
		}
	}

	await Deno.writeFile('dump.bin', view.slice(0, i+24));
}

async function InsertScores() {
	// Open the file
	file = await Deno.open(filePath);

	// Create a buffer exactly the size of one record
	const buffer = new Uint8Array(RECORD_SIZE * 100);

	// Create a DataView to parse the numbers (User/Media IDs and Float Score)
	// We pass buffer.buffer to reference the underlying memory of the Uint8Array
	const view = new DataView(buffer.buffer);

	console.log(`Reading from ${filePath}...`);
	const collection: number[] = [1];
	let count = 0;

	let lastDraw = Date.now();
	let nextDraw = 0;
	outer: while (true) {
		// Read 12 bytes from the file into our buffer
		// .read() returns the number of bytes read or null if EOF
		const bytesRead = await file.read(buffer);
		if (bytesRead === null) break; // End of file check

		// Safety check: ensure we didn't read a partial record (corrupt file)
		if (bytesRead < RECORD_SIZE) {
			console.warn(`Warning: Incomplete record found at end of file (only ${bytesRead} bytes).`);
			break;
		}

		for (let i=0; i<bytesRead; i += RECORD_SIZE) {
			// Parse the data using Little Endian (true) to match the server
			const mediaID = view.getUint32( i + 0, true);
			const userID  = view.getUint32( i + 4, true);
			const score   = view.getFloat32(i + 8, true);

			if (collection.length >= 1 && !collection.includes(userID)) continue;

			// const p = userIDs.length;
			Insert_Score(mediaID, userID, score);

			InsertionSort(userID, collection);
			// if (collection.length > 2) break outer;
			count++;

			// userSet.add(userID);
			// if (userIDs.length != userSet.size) console.log(userIDs.length, userSet.size);

			if (collection.length > nextDraw) {
				const now = Date.now();
				nextDraw += 500;
				console.log(collection.length, now - lastDraw);
				lastDraw = now;
			}

			// Log the score
			// console.log({
			// 	index: count,
			// 	mediaID,
			// 	userID,
			// 	score: Number(score.toFixed(4)), // Formatting for cleaner output
			// });


		}
	}

	console.log("--------------------------");
	console.log(`Finished. Processed ${count} total scores.`);

	return collection;
}

function InsertionSort(id: number, userIDs: number[]) {
	let si = 0, mi = 0, ei = userIDs.length == 0 ? 0 : userIDs.length -1;
	while (true) {
		mi = Math.floor((ei-si) / 2) + si;

		const curr = userIDs[mi];
		if (curr === id) return userIDs;
		if (curr < id) si = mi;
		else ei = mi;

		if (si + 1 >= ei) {
			const s_val = userIDs[si];
			if (s_val === id) return userIDs;

			const e_val = userIDs[ei];
			if (e_val === id) return userIDs;

			if      (id > e_val) mi = ei + 1;
			else if (id < s_val) mi = si;
			else             mi = ei;


			break;
		}
	}

	for (; mi<userIDs.length; mi++) {
		const t = userIDs[mi];
		userIDs[mi] = id;
		id = t;
	}

	userIDs.push(id);

	return userIDs;
}