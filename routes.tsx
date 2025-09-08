// routes.tsx
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
    Settings: undefined;

    uploadProfileMedia: undefined;

    DemoDetail: { demoId: string }; // Voeg dit toe

   
    
  };


