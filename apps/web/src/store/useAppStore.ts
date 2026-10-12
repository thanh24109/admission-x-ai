import { create } from "zustand";
import { MediaItem } from "@/data/media";

interface AppState {
  // Global search modal state
  isSearchOpen: boolean;
  searchQuery: string;
  openSearch: () => void;
  closeSearch: () => void;
  setSearchQuery: (query: string) => void;

  // Lecturer search query state
  lecturerFilter: string;
  setLecturerFilter: (filter: string) => void;

  // Active media video modal state
  activeVideo: MediaItem | null;
  setActiveVideo: (video: MediaItem | null) => void;

  // Mobile menu drawer state
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  isSearchOpen: false,
  searchQuery: "",
  openSearch: () => set({ isSearchOpen: true }),
  closeSearch: () => set({ isSearchOpen: false, searchQuery: "" }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  lecturerFilter: "",
  setLecturerFilter: (filter) => set({ lecturerFilter: filter }),

  activeVideo: null,
  setActiveVideo: (video) => set({ activeVideo: video }),

  isMobileMenuOpen: false,
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
}));
