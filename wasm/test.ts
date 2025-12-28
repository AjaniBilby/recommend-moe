import { DumpMemory } from "./dump.ts";
import { memory, malloc, free, stripe } from './malloc.wasm';

const chunk = {
	a: malloc(1),
	b: malloc(1),
	c: malloc(1),
	d: malloc(1),
	e: malloc(1),
}

for (const [ key, value ] of Object.entries(chunk)) console.log(key, value.toString(16));
for (const ptr of Object.values(chunk)) stripe(ptr, 0x1);

free(chunk.c);
free(chunk.b);
// free(chunk.d);
// free(chunk.e);

// malloc(24);
await DumpMemory(memory, 'malloc.bin');