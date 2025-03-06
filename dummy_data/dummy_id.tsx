// dummy_id.ts

export interface Tag {
  id: string;
  name: string;
  image?: string | number; // Alleen nodig voor artistTags
}

export interface Post {
  id: string;
  userId: string;
  mediaType: "photo" | "video";
  mediaUrl: string | number;
  audioUrl?: string | number; // Audio-url voor foto-posts
  title: string;
  description: string;
  timestamp: number;
  // We slaan alleen de tag-ID's op als string[]:
  artistTags: string[];
  genreTags: string[];
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage: string;
  timestamp: number;
}

export interface User {
  userId: string;
  userName: string;
  userProfile: string | number;
  bio: string;
  posts: Post[];
  chats: Chat[];
}

const users: User[] = [
  {
    userId: "1",
    userName: "Bruno Mars",
    userProfile: require("../assets/dummy/profile/bruno_profile.jpeg"),
    bio: "Singer, songwriter & performer. Let’s vibe together.",
    posts: [
      {
        id: "post1",
        userId: "1",
        mediaType: "photo",
        mediaUrl: require("../assets/dummy/posts/bruno_post.png"),
        audioUrl: require("../assets/dummy/posts/bruno_audio.mp3"),
        title: "I'm looking for a full pop production for this vocal",
        description: "I recorded this vocal and would like a full production in the style of SZA. I want it guitar based, and really organic so not too electronic",
        timestamp: Date.now() - 60000,
        // Hier alleen de ID's van de tags:
        artistTags: ["SZA"],
        genreTags: ["genre-1", "genre-2"],
      },
    ],
    chats: [
      {
        id: "chat1",
        participants: ["1", "2"],
        lastMessage: "Hey Dua, let's collab!",
        timestamp: Date.now() - 30000,
      },
    ],
  },
  {
    userId: "2",
    userName: "Dua Lipa",
    userProfile: require("../assets/dummy/profile/dua_profile.png"),
    bio: "Just a girl making music.",
    posts: [
      {
        id: "post2",
        userId: "2",
        mediaType: "photo",
        mediaUrl: require("../assets/dummy/posts/dua_post.png"),
        audioUrl: require("../assets/dummy/posts/dua_audio.mp3"),
        title: "i want a synthsolo on this track",
        description: "I want a synth solo on this track after the 2nd hook. I want it really 80's like those Michael Jackson synthsolo's on BAD",
        timestamp: Date.now() - 120000,
        artistTags: ["Bruno Mars"],
        genreTags: ["genre-1"],
      },
      {
        id: "post3",
        userId: "2",
        mediaType: "photo",
        mediaUrl: require("../assets/dummy/posts/dua_post.png"),
        audioUrl: require("../assets/dummy/posts/dua_audio.mp3"),
        title: "i want a synthsolo on this track",
        description: "Live performance!",
        timestamp: Date.now() - 120000,
        artistTags: [],
        genreTags: [],
      },
    ],
    chats: [
      {
        id: "chat1",
        participants: ["1", "2"],
        lastMessage: "Hey Bruno, let’s make magic!",
        timestamp: Date.now() - 30000,
      },
    ],
  },
];

export default users;
