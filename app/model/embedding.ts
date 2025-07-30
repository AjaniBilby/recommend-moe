import { pipeline } from '@huggingface/transformers';

import { Singleton } from "~/util/singleton.ts";

const extractor = await Singleton("vector-embedding", () => pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2'));

const WIDTH = 384;
export async function Vectorize<T extends string[]>(strings: T): Promise<Map<T[number], Float32Array>> {
	const index = new Map<string, number>();
	const input = [];
	for (const s of strings) {
		if (index.has(s)) continue;
		index.set(s, input.length);
		input.push(s);
	}

	const batch = await extractor([...index.keys()], { pooling: 'mean', normalize: true });
	if (!(batch.data instanceof Float32Array)) throw new Error("Invalid encoding given from embedding");
	if (batch.dims[1] !== WIDTH) throw new Error("Embedding gave incorrectly dimensioned vector");

	const map = new Map<string, Float32Array>();
	for (const [ key, i ] of index.entries()) {
		const embedding = batch.data.slice(i*WIDTH, (i+1)*WIDTH);
		map.set(key, embedding);
	}

	return map as Map<T[number], Float32Array>;
}

export async function MakeEmbeddings(targets: { key: string, value: string }[]): Promise<{ key: string, embedding: Float32Array }[]> {
	const batch = await extractor(targets.map(x => x.value), { pooling: 'mean', normalize: true });
	if (!(batch.data instanceof Float32Array)) throw new Error("Invalid encoding given from embedding");
	if (batch.dims[1] !== WIDTH) throw new Error("Embedding gave incorrectly dimensioned vector");

	return targets.map((t, i) => ({
		key: t.key,
		embedding: batch.data.slice(i*WIDTH, (i+1)*WIDTH) as Float32Array
	}));
}

export async function Vector(string: string): Promise<Float32Array> {
	const batch = await extractor([string], { pooling: 'mean', normalize: true });
	if (!(batch.data instanceof Float32Array)) throw new Error("Invalid encoding given from embedding");
	if (batch.dims[1] !== WIDTH) throw new Error("Embedding gave incorrectly dimensioned vector");

	return batch.data;
}