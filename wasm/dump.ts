export async function DumpMemory(memory: WebAssembly.Memory, file: string) {
	const view = new Uint8Array(memory.buffer);
	let i = view.length -1;
	for (; i>=0; i--) {
		if (view[i] !== 0) {
			i++;
			break;
		}
	}

	await Deno.writeFile(file, view.slice(0, i+24));
}