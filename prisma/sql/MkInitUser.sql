INSERT INTO "MfFactor" ("type", "id", "embedding", "error")
SELECT 'USER', "id", ARRAY[
	random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1,
	random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1,
	random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1,
	random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1,
	random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1,
	random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1,
	random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1,
	random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1,
	random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1,
	random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1,
	random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1,
	random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1,
	random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1,
	random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1,
	random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1
]::halfvec(144), 0.0
FROM "User";
