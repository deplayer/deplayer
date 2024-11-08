import { text, json, boolean, pgTable, integer, real } from "drizzle-orm/pg-core";

export const media = pgTable("media", {
  id: text("id").primaryKey(),
  title: text("title"),
  // FIXME: Use another table for it
  artist: json("artist").notNull(),
  type: text("type").notNull(),
  album: json("album").notNull(),
  cover: json("cover"),
  stream: json("stream").notNull(),
  duration: real("duration").notNull(),
  playCount: integer("playCount").notNull(),
  genre: text("genre"),
  track: integer("track"),
  year: integer("year"),
})

export const settings = pgTable("settings", {
  id: text("id").primaryKey(),
  settings: json("settings").notNull()
})

export const queue = pgTable("queue", {
  id: text("id").primaryKey(),
  trackIds: json("trackIds").notNull(),
  randomTrackIds: json("randomTrackIds").notNull(),
  currentPlaying: text("currentPlaying"),
  repeat: boolean("repeat"),
  shuffle: boolean("shuffle"),
  nextSongId: text("nextSongId"),
  prevSongId: text("prevSongId")
})
