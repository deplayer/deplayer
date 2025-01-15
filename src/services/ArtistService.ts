import { eq } from 'drizzle-orm'
import { artist } from '../schema'
import { getAdapter } from './database'
import slugify from '@sindresorhus/slugify'

export default class ArtistService {
  async get(artistName: string) {
    const db = await getAdapter().getDb()
    const id = slugify(artistName)
    const results = await db.select().from(artist).where(eq(artist.id, id))
    return results[0]
  }

  async save(artistName: string, metadata: any) {
    const db = await getAdapter().getDb()
    const id = slugify(artistName)
    
    const artistData = {
      id,
      name: artistName,
      bio: metadata.bio,
      country: metadata.country,
      lifeSpan: metadata.lifeSpan,
      relations: metadata.relations,
    }

    await db.insert(artist).values(artistData).onConflictDoUpdate({
      target: artist.id,
      set: artistData,
    })

    return artistData
  }
} 