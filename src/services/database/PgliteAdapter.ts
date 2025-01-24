import { IAdapter, Models } from "./IAdapter";
import * as db from "./PgliteDatabase";
import { PgliteDatabase } from "drizzle-orm/pglite";
import { eq, inArray, sql } from "drizzle-orm";
import {
  media,
  settings,
  queue,
  playlist,
  smartPlaylist,
  peer,
  room,
  mediaLyrics,
} from "../../schema";
import logger from "../../utils/logger";

export default class Pglite implements IAdapter {
  initialize = async () => {};

  save = async (model: Models, id: string, payload: any): Promise<any> => {
    const fixedPayload = { id: id, ...payload };

    const instance = await db.get();
    const prev = await this.getDocObj(model, id);

    switch (model) {
      case "media":
        await instance
          .insert(media)
          .values({ ...prev, ...fixedPayload })
          .onConflictDoUpdate({
            target: settings.id,
            set: payload,
          });
        break;
      case "settings":
        await instance
          .insert(settings)
          .values({ id: id, settings: payload })
          .onConflictDoUpdate({
            target: settings.id,
            set: { settings: payload },
          });
        break;
      case "queue":
        await instance
          .insert(queue)
          .values({ ...prev, ...fixedPayload })
          .onConflictDoUpdate({
            target: queue.id,
            set: payload,
          });
        break;
      case "playlist":
        await instance
          .insert(playlist)
          .values({ ...prev, ...fixedPayload })
          .onConflictDoUpdate({
            target: playlist.id,
            set: payload,
          });
        break;
      case "smart_playlist":
        await instance
          .insert(smartPlaylist)
          .values({ ...prev, ...fixedPayload })
          .onConflictDoUpdate({
            target: smartPlaylist.id,
            set: payload,
          });
        break;
      case "peer":
        await instance
          .insert(peer)
          .values({ ...prev, ...fixedPayload })
          .onConflictDoUpdate({
            target: peer.id,
            set: payload,
          });
        break;
      case "room":
        await instance
          .insert(room)
          .values({ ...prev, ...fixedPayload })
          .onConflictDoUpdate({
            target: room.id,
            set: payload,
          });
        break;
      case "media_lyrics":
        await instance
          .insert(mediaLyrics)
          .values({ ...prev, ...fixedPayload })
          .onConflictDoUpdate({
            target: mediaLyrics.id,
            set: payload,
          });
        break;
      default:
        console.log(`Model ${model} is not implemented for save method`);
        new Error(`Model ${model} not supported for save method`);
    }

    return fixedPayload;
  };

  addMany = async (model: Models, payload: Array<any>): Promise<any> => {
    const inserts: Array<any> = [];
    payload.forEach((item) => {
      const insertPromise = this.save(model, item.id, item);

      inserts.push(insertPromise);
    });

    const results = await Promise.all(inserts);
    return results;
  };

  async removeMany(model: Models, payload: Array<string>): Promise<any> {
    const instance = await db.get();

    console.log("payload:", payload);

    switch (model) {
      case "media":
        await instance.delete(media).where(inArray(media.id, payload));
        break;
      case "playlist":
        await instance.delete(playlist).where(inArray(playlist.id, payload));
        break;
      case "smart_playlist":
        await instance
          .delete(smartPlaylist)
          .where(inArray(smartPlaylist.id, payload));
        break;
      case "peer":
        await instance.delete(peer).where(inArray(peer.id, payload));
        break;
      case "room":
        console.log("Removing rooms:", payload);
        await instance.delete(room).where(inArray(room.id, payload));
        break;
      default:
        console.log(`Model ${model} is not implemented for removeMany method`);
        throw new Error(`Model ${model} not supported for removeMany method`);
    }
  }

  get = async (model: Models, id: string): Promise<any> => {
    return this.getDocObj(model, id);
  };

  getDocObj = async (model: Models, id: string): Promise<any> => {
    const instance = await db.get();

    switch (model) {
      case "media":
        return instance.select().from(media).where(eq(media.id, id));
      case "settings":
        return instance.select().from(settings).where(eq(settings.id, id));
      case "queue":
        return instance.select().from(queue).where(eq(queue.id, id));
      case "playlist":
        return instance.select().from(playlist).where(eq(playlist.id, id));
      case "smart_playlist":
        return instance
          .select()
          .from(smartPlaylist)
          .where(eq(smartPlaylist.id, id));
      case "peer":
        return instance.select().from(peer).where(eq(peer.id, id));
      case "room":
        return instance.select().from(room).where(eq(room.id, id));
      case "media_lyrics":
        return instance.select().from(mediaLyrics).where(eq(mediaLyrics.id, id));
      default:
        console.log(`Model ${model} is not implemented for getDocObj method`);
        throw new Error("Model not supported");
    }
  };

  removeCollection = async (model: Models): Promise<any> => {
    throw new Error(`Remove collection for ${model} is not yet implemented`);
  };

  getAll = async (model: Models, _conditions: any = {}): Promise<any> => {
    const instance = await db.get();

    switch (model) {
      case "media":
        const result = await instance.select().from(media);

        return result || [];
      case "playlist":
        const playlists = await instance.select().from(playlist);
        return playlists || [];
      case "smart_playlist":
        const smartPlaylists = await instance.select().from(smartPlaylist);
        return smartPlaylists || [];
      case "peer":
        const peers = await instance.select().from(peer);
        return peers || [];
      case "room":
        const rooms = await instance.select().from(room);
        return rooms || [];
      default:
        console.log(`Model ${model} is not implemented for getAll method`);
        throw new Error(`Model ${model} not supported for getAll method`);
    }
  };

  exportCollection = async (model: string): Promise<any> => {
    throw new Error(`Export collection for ${model} is not yet implemented`);
  };

  importCollection = async (model: string): Promise<any> => {
    throw new Error(`Import collection for ${model} is not yet implemented`);
  };

  getDb = (): Promise<PgliteDatabase> => {
    return db.get();
  };

  async search(_model: Models, searchTerm: string): Promise<Array<any>> {
    try {
      const db = await this.getDb();
      logger.debug("Search term received:", searchTerm);

      // Create a tsquery from the search term, handling multiple words
      const terms = searchTerm
        .trim()
        .split(/\s+/)
        .map(term => term.replace(/[^\w\s]/g, '')) // Remove special characters
        .filter(Boolean);

      if (terms.length === 0) {
        return [];
      }

      // Build the tsquery string
      const tsqueryStr = terms.map(term => `${term}:*`).join(' & ');
      logger.debug("Generated tsquery:", tsqueryStr);

      // Search across title, artist name, and album name using to_tsvector
      const results = await db
        .select()
        .from(media)
        .where(
          sql`to_tsvector('english', 
            coalesce(${media.title}, '') || ' ' || 
            coalesce(${media.artist}->>'name', '') || ' ' || 
            coalesce(${media.album}->>'name', '')
          ) @@ to_tsquery('english', ${tsqueryStr})`
        )
        .orderBy(
          sql`ts_rank(
            to_tsvector('english',
              coalesce(${media.title}, '') || ' ' || 
              coalesce(${media.artist}->>'name', '') || ' ' || 
              coalesce(${media.album}->>'name', '')
            ),
            to_tsquery('english', ${tsqueryStr})
          ) DESC`
        );

      logger.debug("Search results:", results);
      return results;
    } catch (err: any) {
      logger.error("Error performing search:", err);
      logger.debug("Error details:", {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      return [];
    }
  }
}
