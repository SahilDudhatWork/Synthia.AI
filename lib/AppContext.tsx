import { createContext, useContext, useState, ReactNode } from "react";

interface AppContextType {
  backgroundColor: string;
  setBackgroundColor: (color: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");

  return (
    <AppContext.Provider value={{ backgroundColor, setBackgroundColor }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}

