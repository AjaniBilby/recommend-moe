import { Vectorize } from "../model/embedding.ts";

export const COLOURS = ["zinc", "slate", "stone", "gray", "neutral", "red", "rose", "orange", "green", "blue", "yellow", "violet", "magenta"] as const;
export const COLOUR_EMBEDDINGS = await Vectorize(COLOURS);