-- DropIndex
DROP INDEX "MediaTitle_embedding_idx";

ALTER TABLE "MediaTitle" DROP COLUMN "embedding";

-- CreateTable
CREATE TABLE "MediaEmbedding" (
	"type" CITEXT NOT NULL,
	"mediaID" INTEGER NOT NULL,
	"embedding" vector(384) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "MediaEmbedding_mediaID_type_key" ON "MediaEmbedding"("mediaID", "type");
CREATE INDEX "MediaEmbedding_embedding_idx" ON "MediaEmbedding" USING hnsw ("embedding" vector_cosine_ops);

-- AddForeignKey
ALTER TABLE "MediaEmbedding" ADD CONSTRAINT "MediaEmbedding_mediaID_fkey" FOREIGN KEY ("mediaID") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;
