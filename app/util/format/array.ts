/**
 * Splits an array into chunks of a specified size. The last chunk may be smaller
 * if the array length is not evenly divisible by the chunk size.
 *
 * @template T The type of elements in the array
 * @param array The array to chunk
 * @param size The size of each chunk (must be positive)
 * @returns An array of arrays, where each sub-array has at most `size` elements
 *
 * @example
 * // Chunk into groups of 2: [[1, 2], [3, 4], [5]]
 * const chunks = ChunkArray([1, 2, 3, 4, 5], 2);
 *
 * @example
 * // Chunk strings: [["a", "b", "c"], ["d", "e"]]
 * const chunks = ChunkArray(["a", "b", "c", "d", "e"], 3);
 */
export function ChunkArray<T>(array: T[], size: number): T[][] {
	const chunked: T[][] = [];
	for (let i = 0; i < array.length; i += size) {
		chunked.push(array.slice(i, i + size));
	}
	return chunked;
}
