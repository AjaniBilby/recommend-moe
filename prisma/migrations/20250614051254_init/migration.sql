-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "citext";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('Anime');

-- CreateEnum
CREATE TYPE "ExternalKind" AS ENUM ('MyAnimeList', 'AniList');

-- CreateTable
CREATE TABLE "Media" (
    "id" SERIAL NOT NULL,
    "title" CITEXT NOT NULL,
    "kind" "MediaKind" NOT NULL,
    "icon" TEXT NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalMedia" (
    "type" "ExternalKind" NOT NULL,
    "id" TEXT NOT NULL,
    "mediaID" INTEGER NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "ExternalMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalUser" (
    "type" "ExternalKind" NOT NULL,
    "id" TEXT NOT NULL,
    "userID" INTEGER NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "ExternalUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMediaScore" (
    "userID" INTEGER NOT NULL,
    "mediaID" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "UserAffinity" (
    "aID" INTEGER NOT NULL,
    "bID" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stale" BOOLEAN NOT NULL DEFAULT true
);

-- CreateIndex
CREATE INDEX "Media_title_idx" ON "Media"("title");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalMedia_mediaID_type_key" ON "ExternalMedia"("mediaID", "type");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalUser_userID_type_key" ON "ExternalUser"("userID", "type");

-- CreateIndex
CREATE INDEX "UserMediaScore_mediaID_idx" ON "UserMediaScore"("mediaID");

-- CreateIndex
CREATE UNIQUE INDEX "UserMediaScore_userID_mediaID_key" ON "UserMediaScore"("userID", "mediaID");

-- CreateIndex
CREATE INDEX "UserAffinity_bID_idx" ON "UserAffinity"("bID");

-- CreateIndex
CREATE INDEX "UserAffinity_stale_idx" ON "UserAffinity"("stale");

-- CreateIndex
CREATE UNIQUE INDEX "UserAffinity_aID_bID_key" ON "UserAffinity"("aID", "bID");

-- AddForeignKey
ALTER TABLE "ExternalMedia" ADD CONSTRAINT "ExternalMedia_mediaID_fkey" FOREIGN KEY ("mediaID") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalUser" ADD CONSTRAINT "ExternalUser_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMediaScore" ADD CONSTRAINT "UserMediaScore_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMediaScore" ADD CONSTRAINT "UserMediaScore_mediaID_fkey" FOREIGN KEY ("mediaID") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAffinity" ADD CONSTRAINT "UserAffinity_aID_fkey" FOREIGN KEY ("aID") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAffinity" ADD CONSTRAINT "UserAffinity_bID_fkey" FOREIGN KEY ("bID") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
