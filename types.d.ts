// types.d.ts

// Basic CSS imports
declare module "*.css" {
	const content: string;
	export default content;
}

// CSS with query parameters
declare module "*.css?url" {
	const url: string;
	export default url;
}

declare module "*.css?inline" {
	const content: string;
	export default content;
}

declare module "*.css?raw" {
	const content: string;
	export default content;
}