// routes.tsx
export type RootStackParamList = {
    Main: undefined; // Dit zegt: "Als je naar het 'UserProfile' scherm gaat, geef dan een object mee met een userId (een tekst)."
    UserProfile: { userId: string };
    Chat: { chatId: string }; // Voeg deze regel toe
    // Andere schermen kunnen we hier later toevoegen.
    
  };

