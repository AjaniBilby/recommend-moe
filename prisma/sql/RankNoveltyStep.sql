UPDATE "MediaRanking" m
SET "weight" = "next",
	"iteration" = "iteration" + 1,
	"next" = null
WHERE "next" is not null;