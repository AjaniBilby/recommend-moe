export async function* BatchGeneratorResults<T>(gen: AsyncGenerator<T>, size: number): AsyncGenerator<T[]> {
	let buffer = [];

	for await (const line of gen) {
		buffer.push(line);

		if (buffer.length >= size) {
			yield buffer;
			buffer = [];
		}
	}

	if (buffer.length > 0) yield buffer;
}