-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- AlterTable
ALTER TABLE "Media" ADD COLUMN "description" CITEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "MediaTitle" (
	"type" CITEXT NOT NULL,
	"mediaID" INTEGER NOT NULL,
	"title" CITEXT NOT NULL,
	"embedding" vector(384) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "MediaTitle_mediaID_key" ON "MediaTitle"("mediaID");
CREATE UNIQUE INDEX "MediaTitle_mediaID_type_key" ON "MediaTitle"("mediaID", "type");
CREATE INDEX "MediaTitle_title_trgm_idx" ON "MediaTitle" USING GIN ("title" gin_trgm_ops);
CREATE INDEX ON "MediaTitle" USING hnsw ("embedding" vector_cosine_ops);

-- AddForeignKey
ALTER TABLE "MediaTitle" ADD CONSTRAINT "MediaTitle_mediaID_fkey" FOREIGN KEY ("mediaID") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;
