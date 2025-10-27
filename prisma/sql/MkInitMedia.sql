INSERT INTO "MfFactor" ("type", "id", "embedding", "error")
SELECT 'MEDIA', "id", ARRAY[
	random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1,
	random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1,
	random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1,
	random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1,
	random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1,
	random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1,
	random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1,
	random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1,
	random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1,
	random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1
]::halfvec(96), 0.0
FROM "Media"
WHERE "popularity" > 10;
