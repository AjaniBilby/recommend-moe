export async function GetMedia(access_token: string, externalID: number) {
	const query = "fields=id,title,main_picture,alternative_titles,start_date,synopsis,nsfw,created_at,updated_at,media_type,status,genres,source,rating";

	const req = await fetch(`https://api.myanimelist.net/v2/anime/${externalID}?${query}`, {
		headers: { Authorization: `Bearer ${access_token}` }
	});
	if (!req.ok) throw new Error(`Unable to media information from MAL\n${await req.text()}`);

	const data = await req.json() as {
		id: number,
		title: string,
		main_picture: {
			medium: string,
			large: string
		},
		synopsis: string,
		alternative_titles: {
			synonyms: string[],
			en: string,
			jp: string
		}
	};

	const titles = [{ type: "Default", title: data.title}];
	{
		const synonym = data.alternative_titles.synonyms?.find(x => x !== data.title); // find the first unique synonym
		if (synonym) titles.push({ type: "Synonym", title: synonym });
	}
	if (data.alternative_titles.en) titles.push({ type: "English",  title: data.alternative_titles.en});
	if (data.alternative_titles.jp) titles.push({ type: "Japanese", title: data.alternative_titles.jp});

	return {
		title: data.title,
		description: data.synopsis,
		icon: data.main_picture.large || "",
		titles,
	};
}