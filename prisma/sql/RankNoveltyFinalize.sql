UPDATE "MediaRanking" m
SET "weight" = "next",
	"next" = null
WHERE "next" is not null;