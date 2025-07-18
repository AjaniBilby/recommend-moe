import { BundleSplitter, ClientIsland } from "htmx-router/vite";
import { defineConfig, UserConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import deno from "@deno/vite-plugin";

type T = NonNullable<UserConfig["plugins"]>[number];

export default defineConfig({
	ssr: {
		noExternal: ['vite'],
	},
	build: {
		target: "esnext",
		rollupOptions: {
			input: 'app/entry.client.ts'
		},
		outDir: 'dist/client',
		assetsDir: 'dist/asset',
		ssrEmitAssets: true,
		manifest: true
	},
	plugins: [
		ClientIsland("react") as T,
		BundleSplitter() as T,
		tsconfigPaths(),
		deno()
	],
	server: {
		headers: {
			"Service-Worker-Allowed": "/",
		},
	},
	preview: {
		headers: {
			"Service-Worker-Allowed": "/",
		},
	},
});
