import { create } from 'zustand';
import type { TrackMetadata } from '@/types/track';
import { loadAllTracks } from '@/lib/metadata/loader';

interface LibraryStore {
  tracks: TrackMetadata[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  sortBy: 'title' | 'artist' | 'duration';
  sortOrder: 'asc' | 'desc';

  // Actions
  loadTracks: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSortBy: (sortBy: 'title' | 'artist' | 'duration') => void;
  setSortOrder: (sortOrder: 'asc' | 'desc') => void;
  getFilteredTracks: () => TrackMetadata[];
}

export const useLibraryStore = create<LibraryStore>((set, get) => ({
  // Initial state
  tracks: [],
  loading: false,
  error: null,
  searchQuery: '',
  sortBy: 'title',
  sortOrder: 'asc',

  // Actions
  loadTracks: async () => {
    set({ loading: true, error: null });
    try {
      const tracks = await loadAllTracks();
      set({ tracks, loading: false });
    } catch (error) {
      console.error('Failed to load tracks:', error);
      set({
        error: 'Failed to load tracks',
        loading: false,
      });
    }
  },

  setSearchQuery: (searchQuery: string) => {
    set({ searchQuery });
  },

  setSortBy: (sortBy: 'title' | 'artist' | 'duration') => {
    set({ sortBy });
  },

  setSortOrder: (sortOrder: 'asc' | 'desc') => {
    set({ sortOrder });
  },

  getFilteredTracks: () => {
    const { tracks, searchQuery, sortBy, sortOrder } = get();

    // Filter by search query
    let filtered = tracks;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = tracks.filter(
        (track) =>
          track.title.toLowerCase().includes(query) ||
          track.artist.toLowerCase().includes(query) ||
          track.album?.toLowerCase().includes(query)
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'artist':
          comparison = a.artist.localeCompare(b.artist);
          break;
        case 'duration':
          comparison = a.duration - b.duration;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  },
}));
