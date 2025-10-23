INSERT INTO "MfFactor" ("type", "id", "embedding", "error")
SELECT 'MEDIA', "id", ARRAY[
  random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1,
  random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1,
  random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1,
  random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1,
  random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1
]::vector(50), 1.0
FROM "Media";
