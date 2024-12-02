ALTER TABLE "peer" DROP CONSTRAINT "peer_roomCode_room_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "peer" ADD CONSTRAINT "peer_roomCode_room_id_fk" FOREIGN KEY ("roomCode") REFERENCES "public"."room"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
