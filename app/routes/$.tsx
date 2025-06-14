import { ApplyMetaDefaults, ShellOptions } from "htmx-router/shell";
import { RouteContext } from "htmx-router";

import { LazyLoad, Link } from "~/component/link.tsx";
import { DialogResponse } from "~/component/server/dialog.tsx";
import { Scripts } from "~/component/server/scripts.tsx";
// import { Navbar } from "~/component/server/navbar";
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
	<script src="https://unpkg.com/hx-stream@0.0.9"        crossOrigin="anonymous"></script>
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

const header = <div id="header" hx-preserve="true">
	{/* <LazyLoad href="/user/me/navbar/masked">&nbsp;</LazyLoad> */}
	{/* <Navbar /> */}
</div>;


export function loader (){
	return new Response("No Route Found", { status: 404, statusText: "Not Found" });
}


export async function shell(inner: JSX.Element, options: ShellOptions<{ headless?: boolean }>) {
	ApplyMetaDefaults(options, { title: "Recommend.moe" });

	return <html lang="en">
		<Head options={options}>
			{ headers }
			<meta name="theme-color" content="#ffffff" />
			<Scripts />
		</Head>
		<body className="dp-enable" hx-boost="true" hx-ext="preload,hx-keep,hx-prep">
			{!options.headless && header}
			{inner}
		</body>
	</html>
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
			{header}

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
				<Link href="/login"><button type="button">Login</button></Link>
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