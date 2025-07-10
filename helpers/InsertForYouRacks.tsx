import { PostData } from "../components/postcomponent"
import { ForYouPostData } from "../components/ForYouRack"

export type FeedItem =
  | { type: "post"; post: PostData }
  | { type: "rack"; rackId: string; rackPosts: ForYouPostData[]; title: string; subtitle?: string }

/**
 * Injecteert racks op random plekken met echte artist-tags
 * title: altijd "For you"
 * subtitle: bijv. "Dua Lipa style"
 */
export function insertForYouRacks(
  posts: PostData[],
  artistTags: { id: string; name: string }[],
  racksPerFeed: number = 1
): FeedItem[] {
  const result: FeedItem[] = []
  let rackCount = 0
  for (let i = 0; i < posts.length; i++) {
    result.push({ type: "post", post: posts[i] })

    // Na 3, daarna elke 6, voeg een rack toe
    if (i === 2 || (i > 2 && (i - 2) % 6 === 0)) {
      if (artistTags.length === 0) continue

      // Random artistTag kiezen
      const randomArtist = artistTags[Math.floor(Math.random() * artistTags.length)]
      const postsForArtist = posts.filter(post => post.artistTags?.includes(randomArtist.id))

      if (postsForArtist.length === 0) continue // skip als geen posts

      // Map naar rackPosts (max 4)
      const rackPosts = postsForArtist.slice(0, 4).map(p => ({
        id: p.id,
        username: p.username,
        media: typeof p.mediaUrl === "string" ? p.mediaUrl : "",
        mediaType: p.mediaType === "video" ? "video" : "image" as "image" | "video",
        artistId: randomArtist.id,
        genreId: Array.isArray(p.genreTags) && p.genreTags.length > 0 ? p.genreTags[0] : undefined,
      }))

      result.push({
        type: "rack",
        rackId: `rack-${rackCount}`,
        rackPosts,
        title: "For you", // hoofdtekst (dik)
        subtitle: `${randomArtist.name} style`, // subtitel (minder dik)
      })
      rackCount++
    }
  }
  return result
}
