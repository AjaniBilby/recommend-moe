import { RouteContext } from "htmx-router";

import { pipeline } from '@huggingface/transformers';

export async function loader({ url, params }: RouteContext) {
	const query = url.searchParams.get("q");
	if (!query) return "";

	const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
	const outputs = await extractor([query], { pooling: 'mean', normalize: true });

	if (outputs.dims[1] !== 384) throw new Error("Outputs are not in the correct vector format");

	const vector: number[] = Array.from(outputs.data);
	console.log(JSON.stringify(vector));
}