INSERT INTO "MfFactor" ("type", "id", "embedding", "error")
SELECT 'USER', "id", l2_normalize(ARRAY[
	random(), random(), random(), random(), random(), random(), random(), random(), random(), random(),
	random(), random(), random(), random(), random(), random(), random(), random(), random(), random(),
	random(), random(), random(), random(), random(), random(), random(), random(), random(), random(),
	random(), random(), random(), random(), random(), random(), random(), random(), random(), random(),
	random(), random(), random(), random(), random(), random(), random(), random(), random(), random(),
	random(), random(), random(), random(), random(), random(), random(), random(), random(), random(),
	random(), random(), random(), random(), random(), random(), random(), random(), random(), random(),
	random(), random(), random(), random(), random(), random(), random(), random(), random(), random(),
	random(), random(), random(), random(), random(), random(), random(), random(), random(), random(),
	random(), random(), random(), random(), random(), random(), random(), random(), random(), random(),
	random(), random(), random(), random(), random(), random(), random(), random(), random(), random(),
	random(), random(), random(), random(), random(), random(), random(), random(), random(), random(),
	random(), random(), random(), random(), random(), random(), random(), random(), random(), random(),
	random(), random(), random(), random(), random(), random(), random(), random(), random(), random(),
	random(), random(), random(), random(), random(), random(), random(), random(), random(), random(),
	random(), random(), random(), random(), random(), random(), random(), random(), random(), random()
]::halfvec(160)), 0.0
FROM "User";
