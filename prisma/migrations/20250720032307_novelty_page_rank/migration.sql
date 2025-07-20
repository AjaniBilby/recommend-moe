-- CreateTable
CREATE TABLE "MediaRanking" (
	"id"          INTEGER NOT NULL,
	"width"       DOUBLE PRECISION NOT NULL,
	"weight"      DOUBLE PRECISION NOT NULL DEFAULT 1.0,
	"next"        DOUBLE PRECISION,
	"outstanding" BOOLEAN GENERATED ALWAYS AS ("next" IS NULL) STORED NOT NULL,
	"iteration"   INTEGER NOT NULL DEFAULT 0,

	CONSTRAINT "MediaRanking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MediaRanking_id_weight_width_idx"       ON "MediaRanking"("id", "weight", "width");
CREATE INDEX "MediaRanking_outstanding_id_idx"        ON "MediaRanking"("outstanding", "id");
CREATE INDEX "MediaRanking_iteration_outstanding_idx" ON "MediaRanking"("iteration", "outstanding");

-- AddForeignKey
ALTER TABLE "MediaRanking" ADD CONSTRAINT "MediaRanking_id_fkey" FOREIGN KEY ("id") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;
