ALTER TABLE "ExternalUser"
	DROP CONSTRAINT "ExternalUser_pkey",
	ADD  CONSTRAINT "ExternalUser_pkey" PRIMARY KEY ("userID", "type");

ALTER TABLE "Media"
	ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "MediaAffinity"  ADD CONSTRAINT "MediaAffinity_pkey"  PRIMARY KEY ("aID", "bID");
ALTER TABLE "MediaEmbedding" ADD CONSTRAINT "MediaEmbedding_pkey" PRIMARY KEY ("mediaID", "type");
ALTER TABLE "MediaTitle"     ADD CONSTRAINT "MediaTitle_pkey"     PRIMARY KEY ("mediaID", "type");
ALTER TABLE "MfFactor"       ADD CONSTRAINT "MfFactor_pkey"       PRIMARY KEY ("type", "id");
ALTER TABLE "UserAffinity"   ADD CONSTRAINT "UserAffinity_pkey"   PRIMARY KEY ("aID", "bID");
ALTER TABLE "UserMediaScore" ADD CONSTRAINT "UserMediaScore_pkey" PRIMARY KEY ("userID", "mediaID");

DROP INDEX "public"."ExternalUser_userID_type_key";
DROP INDEX "public"."MediaAffinity_aID_bID_key";
DROP INDEX "public"."MediaEmbedding_mediaID_type_key";
DROP INDEX "public"."MediaTitle_mediaID_type_key";
DROP INDEX "public"."MfFactor_type_id_key";
DROP INDEX "public"."UserAffinity_aID_bID_key";
DROP INDEX "public"."UserMediaScore_userID_mediaID_key";

ALTER TABLE "MediaAffinity" ADD CONSTRAINT "MediaAffinity_aID_bID_check" CHECK ("aID" < "bID");
