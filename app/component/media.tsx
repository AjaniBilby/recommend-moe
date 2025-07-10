import { Style } from "htmx-router/css";

import { Link } from "~/component/link.tsx";

export function MediaCard(props: {
	media: { id: number, title: string, icon: string }
}) {
	const { media } = props;

	return <Link href={`/media/${media.id}`} className={`${style.name} on-hover on-hover-scale`}
		style={{ position: "relative", viewTransitionName: `media-${media.id}` }}
	>
		<div className="cover" style={{
			backgroundImage: props.media.icon
				? `url(${FixMalCover(props.media.icon)})`
				: `url(/media/${media.id}/cover)`
		}}></div>
		<div className="title on-hover-show text-center card">{media.title}</div>
	</Link>
}

const badDomain = "https://myanimelist.cdn-dena.com/";
export function FixMalCover(url: string) {
	if (!url.startsWith(badDomain)) return url;
	return "https://cdn.myanimelist.net/"+url.slice(badDomain.length);
}


const style = new Style("media", `
.this .cover {
	aspect-ratio: 2/3;
	background-position: center;
	background-size: cover;
	position: relative;
	background-color: hsl(var(--muted))
}

.this .title {
	position: absolute; left: 0; right: 0; bottom: 100%;
	border-radius: var(--radius) var(--radius) 0 0;
	border-bottom: none;
	background-color: hsl(var(--background));
	font-size: .75em;
}
`);