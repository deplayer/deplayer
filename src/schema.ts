import { text, json, boolean, timestamp, pgTable, integer, real } from "drizzle-orm/pg-core";

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
  genres: json("genres"),
  track: integer("track"),
  year: integer("year"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow()
})

export const settings = pgTable("settings", {
  id: text("id").primaryKey(),
  settings: json("settings").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow()
})

export const queue = pgTable("queue", {
  id: text("id").primaryKey(),
  trackIds: json("trackIds").notNull(),
  randomTrackIds: json("randomTrackIds").notNull(),
  currentPlaying: text("currentPlaying"),
  repeat: boolean("repeat"),
  shuffle: boolean("shuffle"),
  nextSongId: text("nextSongId"),
  prevSongId: text("prevSongId"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow()
})

export const smartPlaylist = pgTable("smart_playlist", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  filters: json("filters").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow()
})

export const playlist = pgTable("playlist", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  trackIds: json("trackIds").notNull(),
  randomTrackIds: json("randomTrackIds").notNull(),
  currentPlaying: text("currentPlaying"),
  repeat: boolean("repeat"),
  shuffle: boolean("shuffle"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow()
})

export const peer = pgTable("peer", {
  id: text("id").primaryKey(),
  roomCode: text("roomCode").notNull().references(() => room.id, { onDelete: 'cascade' }),
  username: text("username").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow()
})

export const room = pgTable("room", {
  id: text("id").primaryKey(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow()
})

export const mediaLyrics = pgTable("media_lyrics", {
  id: text("id").primaryKey(),
  mediaId: text("mediaId").notNull().references(() => media.id, { onDelete: 'cascade' }),
  lyrics: text("lyrics").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow()
})
