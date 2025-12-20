const RECORD_SIZE = 12;

const filePath = './scores.bin';
let file: Deno.FsFile | null = null;

try {
	// Open the file
	file = await Deno.open(filePath);

	// Create a buffer exactly the size of one record
	const buffer = new Uint8Array(RECORD_SIZE * 100);

	// Create a DataView to parse the numbers (User/Media IDs and Float Score)
	// We pass buffer.buffer to reference the underlying memory of the Uint8Array
	const view = new DataView(buffer.buffer);

	console.log(`Reading from ${filePath}...`);
	const userSet = new Set<number>();
	const userIDs: number[] = [];
	let count = 0;

	let lastDraw = Date.now();
	let nextDraw = 10_000;
	while (true) {
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
			const mediaID = view.getUint32(0, true);
			const userID  = view.getUint32(4, true);
			const score   = view.getFloat32(8, true);

			// const p = userIDs.length;
			InsertionSort(userID, userIDs);
			// userSet.add(userID);
			// if (userIDs.length != userSet.size) console.log(userIDs.length, userSet.size);

			const userCount = userIDs.length;
			if (userCount > nextDraw) {
				const now = Date.now();
				nextDraw += 10_000;
				console.log(userCount, now - lastDraw);
				lastDraw = now;
			}

			// Log the score
			// console.log({
			// 	index: count,
			// 	mediaID,
			// 	userID,
			// 	score: Number(score.toFixed(4)), // Formatting for cleaner output
			// });

			count++;
		}

	}

	console.log("--------------------------");
	console.log(`Finished. Processed ${count} total scores.`);
	console.log(userIDs.length);

	for (let i=1; i<userIDs.length; i++) {
		if (userIDs[i-1] >= userIDs[i]) console.log(userIDs[i-1], userIDs[i]);
	}

} catch (error) {
	if (error instanceof Deno.errors.NotFound) {
		console.error(`Error: File "${filePath}" not found.`);
	} else {
		console.error("An unexpected error occurred:", error);
	}
} finally {
	// Always close the file handle
	if (file) file.close();
}

function InsertionSort(userID: number, userIDs: number[]) {
	let s = 0, i = 0, e = userIDs.length -1;
	while (true) {
		i = Math.floor((e-s) / 2) + s;

		const hit = userIDs[i];
		if (hit === userID) return userIDs;
		if (hit < userID) s = i;
		else e = i;

		if (s + 1 >= e) {
			const _s = userIDs[s];
			if (_s === userID) return userIDs;

			const _e = userIDs[e];
			if (_e === userID) return userIDs;

			if      (userID > _e) i = e + 1;
			else if (userID < _s) i = s;
			else                  i = e;


			break;
		}
	}

	i = Math.max(0, i);

	for (; i<userIDs.length; i++) {
		const t = userIDs[i];
		userIDs[i] = userID;
		userID = t;
	}

	userIDs.push(userID);

	return userIDs;
}