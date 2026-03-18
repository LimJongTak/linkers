CREATE TABLE IF NOT EXISTS "chat_typing" (
  "room_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "typed_at" TIMESTAMP WITH TIME ZONE NOT NULL,
  PRIMARY KEY ("room_id", "user_id")
);
