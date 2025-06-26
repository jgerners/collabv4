// routes.tsx

import type { PostData, ArtistTagData, GenreTagData } from "./components/postcomponent";

export type RootStackParamList = {
    Main: { screen?: string } | undefined;
    UserProfile: { userId: string };
    Chat: { chatId: string }; // Voeg deze regel toe
    // Andere schermen kunnen we hier later toevoegen.

    EditProfile: undefined;
   
    SelectMediaModal: undefined
    UploadFormModal : { mediaUri: string; mediaType: 'video' | 'photo' }
   
    Upload: {
      selectedArtistTags?: string[];
      selectedGenreTags?: string[];
    };
    
    ArtistTagSelect: undefined;  // <-- Toegevoegd
    GenreTagSelect: undefined;   // <-- Toegevoegd
    Login: undefined; 
    Register: undefined; 

    uploadProfileMedia: undefined;

    DemoDetail: { demoId: string }; // Voeg dit toe
      PostDetail: {
  postId: string,
  post: PostData,
  artistTags: ArtistTagData[],
  genreTags: GenreTagData[]
}
   
    
  };


