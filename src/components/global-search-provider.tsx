"use client";

import { useState, createContext, useContext } from "react";
import { SearchCommand } from "./search/search-command";

type SearchContextType = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch must be used within GlobalSearchProvider");
  }
  return context;
}

export function GlobalSearchProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <SearchContext.Provider value={{ open, setOpen }}>
      {children}
      <SearchCommand open={open} onOpenChange={setOpen} />
    </SearchContext.Provider>
  );
}
