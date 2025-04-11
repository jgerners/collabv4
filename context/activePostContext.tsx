// context/activePostContext.tsx

import React, { createContext, useState, useContext } from "react";

interface ActivePostContextProps {
  activePostId: string | null;
  setActivePostId: (id: string | null) => void;
}

// Maak een interface voor de props die de provider verwacht.
interface ActivePostProviderProps {
  children: React.ReactNode;
}

const ActivePostContext = createContext<ActivePostContextProps | undefined>(undefined);

export const ActivePostProvider: React.FC<ActivePostProviderProps> = ({ children }) => {
  const [activePostId, setActivePostId] = useState<string | null>(null);
  return (
    <ActivePostContext.Provider value={{ activePostId, setActivePostId }}>
      {children}
    </ActivePostContext.Provider>
  );
};

export const useActivePost = (): ActivePostContextProps => {
  const context = useContext(ActivePostContext);
  if (!context) {
    throw new Error("useActivePost must be used within an ActivePostProvider");
  }
  return context;
};
