import { ApplyMetaDefaults, ShellOptions } from "htmx-router/shell";
import { RouteContext } from "htmx-router";
import { MakeStatus } from "htmx-router/status";
import { Style } from "htmx-router/css";
import { html } from "htmx-router/response";

import { PhpResponse } from "~/model/php.tsx";

import Client from "~/manifest.tsx";
import { DialogResponse } from "~/component/server/dialog.tsx";
import { ThemeSwitcher } from "~/component/client/theme-switcher.tsx";
import { Link, Open } from "~/component/link.tsx";
import { Scripts } from "~/component/server/scripts.tsx";
import { Head } from "~/component/server/head.tsx";

import mainsheetUrl from "~/styles/main.css?url";
import { CutString } from "~/util/format/text.ts";

const headers = <>
	<meta charSet="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<meta name="robots" content="noindex" />
	<script src="https://unpkg.com/htmx.org@2.0.4"         crossOrigin="anonymous"></script>
	<script src="https://unpkg.com/htmx-ext-preload@2.1.0" crossOrigin="anonymous"></script>
	<script src="https://unpkg.com/htmx-ext-sse@2.2.2"     crossOrigin="anonymous"></script>
	<script src="https://unpkg.com/hx-drag@2.0.0"          crossOrigin="anonymous"></script>
	<script src="https://unpkg.com/hx-keep@1.1.1"          crossOrigin="anonymous"></script>
	<script src="https://unpkg.com/hx-prep@1.0.0"          crossOrigin="anonymous"></script>
	<script src="https://unpkg.com/d-pad@1.0.7"            crossOrigin="anonymous"></script>
	<script src="https://unpkg.com/hx-stream@0.2.2"        crossOrigin="anonymous"></script>
	<script src="https://unpkg.com/ctrl-p@0.0.4"           crossOrigin="anonymous"></script>
	<link href={mainsheetUrl} rel="stylesheet"></link>

	<link rel="icon" href="/favicon.ico" sizes="48x48"></link>

	{/* <link rel="manifest" href="/site.manifest.json"></link>
	<link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180"></link>
	<link rel="icon" href="/android-chrome-512x512.png" sizes="512x512"></link>
	<link rel="icon" href="/android-chrome-192x192.png" sizes="192x192"></link>
	<link rel="icon" href="/favicon-32x32.png"          sizes="32x32"></link>
	<link rel="icon" href="/favicon-16x16.png"          sizes="16x16"></link> */}
</>;

const header = <div id="theme-switcher" hx-preserve="true">
	{/* <LazyLoad href="/user/me/navbar/masked">&nbsp;</LazyLoad> */}
	{/* <Navbar /> */}
	<Client.ThemeSwitcher>
		<ThemeSwitcher />
	</Client.ThemeSwitcher>
</div>;


export function shell(inner: JSX.Element, options: ShellOptions<{
	headless?: boolean,
	search?: { value?: string, focus?: boolean }
}>) {
	ApplyMetaDefaults(options, { title: "Recommend.moe" });

	return <html lang="en">
		<Head options={options}>
			{ headers }
			<meta name="theme-color" content="#ffffff" />
			<Scripts />
		</Head>
		<body className="dp-enable" hx-boost="true" hx-ext="preload,hx-keep,hx-prep">
			{!options.headless && <div className={headerStyle.name}>

				<div>
					{SearchBar(options.search)}
					{header}
				</div>
			</div>}
			{inner}
		</body>
	</html>
}

const headerStyle = new Style("header", `
.this {
	display: flex;
	justify-content: center;
	margin-inline: -13px;
}

.this > div {
	display: flex;
	align-items: center;
	margin-block: 5px 5px;
	padding-inline: 15px;
	padding-block: 0 5px;
	width: 100%;
	max-width: var(--max-width);

	box-shadow: 0px 6px 10px #00000012;
}

[data-theme=dark] .this > div {
	box-shadow: 0px 6px 10px #ffffff15;
}
`);


export function loader({ url, headers }: RouteContext) {
	if (!url.pathname.endsWith(".php")) return null;

	headers.set("Cache-Control", "public, max-age=604800, immutable")
	return html(PhpResponse(), MakeStatus("I'm a teapot", { headers: headers }));
}


export async function error(ctx: RouteContext, e: unknown) {
	const { title, body } = await ErrorBody(e, ctx.url.pathname);

	if (ctx.request.headers.get("Hx-Request") === "true") return DialogResponse(ctx, body);

	return <html lang="en" >
		<Head options={{ title: title + " - Recommend.moe" }}>
			{ headers }
			<meta name="theme-color" content="#ff0000" />
			<Scripts />
		</Head>
		<body>
			<div className={headerStyle.name}>
				<div>{SearchBar()}{header}</div>
			</div>

			<div className="wrapper" style={{ display: "flex", height: "100%", justifyContent: "center", alignItems: "center" }}>
				<div className="card" style={{
					whiteSpace: "pre-wrap",
					padding: "1rem 1.5rem",
					marginBlock: "3rem"
				}}>{body}</div>
			</div>
		</body>
	</html>;
}

async function ErrorBody(error: unknown, path: string) {
	if (error instanceof Response) return {
		title: error.statusText,
		body: <>
			<h1 style={{ marginTop: 0 }}>{error.status} {error.statusText}</h1>
			<p style={{ whiteSpace: "pre" }}>{await error.text()}</p>
			{(error.status === 401 || error.status === 403) && <p style={{ textAlign: "right"}}>
				<Open href="/login"><button type="button">Login</button></Open>
			</p>}
		</>
	}

	if (error instanceof Error) {
		console.error(path, error);
		return {
			title: `Error: ${CutString(error.message, "\n")[0]}`,
			body: <>
				<h1 style={{ marginTop: 0 }}>Error</h1>
				<p>{error.message}</p>
				<pre>{error.stack}</pre>
			</>
		}
	}

	return {
		title: "Unknown Error",
		body: <h1 style={{ marginTop: 0 }}>Error</h1>
	}
}



function SearchBar(search?: { value?: string, focus?: boolean }) {
	return <form
		className={searchStyle.name}
		action="/search"
		hx-include="[name=search-mode]"
	>
		<Link href="/" className="no-select">Recommend</Link>
		<label>
			<div className="search">
				<input
					name="q"
					placeholder=" "
					autoComplete="off"
					autoCapitalize="off"
					defaultValue={search?.value}
					autoFocus={search?.focus}
				></input>
				<div className="accent"></div>
			</div>
			<div className="no-select text-magenta">moe</div>
		</label>
	</form>
}

const searchStyle = new Style("search-bar", `
.this {
	display: contents;
	font-size: 2rem;
	font-weight: bold;
	user-select: none;
}

.this a {
	padding-left: 10px;
}

.this label {
	display: flex;
	flex-grow: 1;
}

.this .search {
	position: relative;
	margin-inline: 5px;
	margin-bottom: 2px;

	overflow: clip;
	transition: flex-grow .1s ease;
}
.this label:focus-within .search {
	flex-grow: 1;
}

.this .search > input {
	field-sizing: content;
	border: none;
	user-select: all;

	position: relative;
	padding-block: 0px;
	padding-inline: 0;

	outline: none !important;

	background-color: transparent;
	color: hsl(var(--muted-foreground));
	font-size: 2rem;

}

.this .search > .accent {
	position: absolute;
	bottom: 2px;
	left: 0;

	z-index: -1;

	background-color: hsl(var(--muted-foreground));
	border-radius: var(--radius);
	height: 8px;
	width: 8px;

	transition-property: width, height, background-color;
	transition-duration: .2s, .2s, .1s;
	transition-delay: 0s, .1s, .1s;
}

.this label:focus-within .search, .this .search:not(:has(input:placeholder-shown)) {
	margin-inline: 10px;

	& > .accent {
		background-color: hsl(var(--muted));
		border-radius: var(--radius);
		bottom: 0;

		height: 100%;
		width: 100%;

		transition-delay: 0s, 0s, 0s;
	}

	& > input {
		padding-inline: 8px;
		min-width: 100%;
	}
}
`);