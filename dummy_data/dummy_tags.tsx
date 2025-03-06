// dummy_tags.tsx
import { ImageSourcePropType } from "react-native";

// Definieer interfaces voor de tags (optioneel, maar handig voor type-checking)
export interface ArtistTag {
    id: string;
    name: string;
    image: string;
  }
  
  export interface GenreTag {
    id: string;
    name: string;
  }
  
  // Dummy data voor artiest-tags
  export const dummyArtistTags: ArtistTag[] = [
    {
      id: "Bruno Mars",
      name: "Bruno Mars",
      image: "https://tjdqekniodsylvelqsyv.supabase.co/storage/v1/object/public/DummyImages//bruno_tag.jpg"
    },
    {
      id: "SZA",
      name: "SZA",
      image: "https://tjdqekniodsylvelqsyv.supabase.co/storage/v1/object/public/DummyImages//sza_tag.png"
    },
    {
      id: "Doja Cat",
      name: "Doja Cat",
      image: "https://tjdqekniodsylvelqsyv.supabase.co/storage/v1/object/public/DummyImages//doja_tag.png"
    },
  ];
  
  // Dummy data voor genre-/stijl-tags
  export const dummyGenreTags: GenreTag[] = [
    { id: "genre-1", name: "Pop" },
    { id: "genre-2", name: "Hip-Hop" },
    { id: "genre-3", name: "RnB" },
    { id: "genre-4", name: "Guitar" },
  ];
  