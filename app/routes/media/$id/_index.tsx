import { RouteContext } from "htmx-router";

import { LazyLoad } from "~/component/link.tsx";

import { prisma } from "~/db.server.ts";
import { shell } from "~/routes/$.tsx";
import { SimilaritySkeleton } from "./similar.tsx";

export const parameters = { id: Number };
export async function loader({ params }: RouteContext<typeof parameters>) {
	const media = await prisma.media.findUnique({
		where: { id: params.id }
	});
	if (!media) return null;


	return shell(<div>
		<h1>{media.title}</h1>
		<div style={{
			aspectRatio: "2/3",
			backgroundImage: `url(/media/${params.id}/cover)`,
			backgroundPosition: "center",
			backgroundSize: "cover",
			height: "200px",
			viewTransitionName: `media-${media.id}`
		}}></div>

		<h3>Similar</h3>
		<LazyLoad href={`/media/${params.id}/similar`}>
			{SimilaritySkeleton}
		</LazyLoad>
	</div>, { title: media.title, og: {
		image: [{ url: `/media/${params.id}/cover`}]
	} });
}