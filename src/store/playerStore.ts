import { create } from 'zustand';
import type { CassetteStyle } from '../lib/colorUtils';

export type PlayerStatus = 'disconnected' | 'no_premium' | 'initializing' | 'ready';

export interface Track {
  id: string;
  title: string;
  artist: string;
  year: string;
  duration: number;
  albumId: string;
  uri: string;
  itemType?: 'track' | 'album' | 'playlist' | 'demo';
  source?: 'spotify-library' | 'search' | 'playlist' | 'demo';
  trackUri?: string;
  trackId?: string;
  albumUri?: string;
  albumName?: string;
  coverImage?: string;
  contextUri?: string;
  contextOffsetPosition?: number | null;
  trackUris?: string[];
  moodTag?: string;
  memoryNote?: string;
  cassetteTheme?: string;
  yearLabel?: string;
  shelfName?: string;
  unavailable?: boolean;
  unavailableNote?: string;
  pinned?: boolean;
  archived?: boolean;
  labelColor: string;
  cassetteStyle: CassetteStyle;
}

interface PlayerStore {
  tracks: Track[];
  currentIndex: number;
  isPlaying: boolean;
  progress: number;
  currentTime: number;
  isConnected: boolean;
  isLoading: boolean;
  isDemoMode: boolean;
  playerStatus: PlayerStatus;
  setTracks: (tracks: Track[]) => void;
  setCurrentIndex: (index: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setProgress: (progress: number) => void;
  setCurrentTime: (time: number | ((prev: number) => number)) => void;
  setIsConnected: (connected: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setIsDemoMode: (demoMode: boolean) => void;
  setPlayerStatus: (status: PlayerStatus) => void;
  skipTrack: (dir: number) => void;
}

const defaultTracks: Track[] = [
  { id: '1', title: 'AUTOMATIC FOR THE PEOPLE', artist: 'R.E.M.', year: '1992', duration: 242, albumId: '1', uri: '', itemType: 'track', trackUri: '', trackId: '', albumUri: '', albumName: 'AUTOMATIC FOR THE PEOPLE', coverImage: '', moodTag: 'Midnight Drive', memoryNote: 'That long bus ride home after finals.', cassetteTheme: 'roadline', yearLabel: '1992', labelColor: '#f0c010', cassetteStyle: 'yellow-black' },
  { id: '2', title: 'STRANGEWAYS, HERE WE COME', artist: 'THE SMITHS', year: '1987', duration: 228, albumId: '2', uri: '', itemType: 'track', trackUri: '', trackId: '', albumUri: '', albumName: 'STRANGEWAYS, HERE WE COME', coverImage: '', moodTag: 'Hostel Nostalgia', memoryNote: 'Shared speakers, dim corridor, midnight tea.', cassetteTheme: 'hostel-hum', yearLabel: '1987', labelColor: '#ede0c0', cassetteStyle: 'cream-black' },
  { id: '3', title: "UPSTAIRS AT ERIC'S", artist: 'YAZ', year: '1982', duration: 198, albumId: '3', uri: '', itemType: 'track', trackUri: '', trackId: '', albumUri: '', albumName: "UPSTAIRS AT ERIC'S", coverImage: '', moodTag: 'Rainy Window', memoryNote: 'Rain tapping against a foggy bus window.', cassetteTheme: 'monsoon-glow', yearLabel: '1982', labelColor: '#cc2010', cassetteStyle: 'grey-red' },
  { id: '4', title: 'BEWITCHED', artist: 'LAUFEY', year: '2023', duration: 215, albumId: '4', uri: '', itemType: 'track', trackUri: '', trackId: '', albumUri: '', albumName: 'BEWITCHED', coverImage: '', moodTag: 'Healing', memoryNote: 'Quiet mornings after a difficult week.', cassetteTheme: 'warm-heal', yearLabel: '2023', labelColor: '#c8a858', cassetteStyle: 'amber-brown' },
  { id: '5', title: 'DEBUT', artist: 'BJÖRK', year: '1993', duration: 252, albumId: '5', uri: '', itemType: 'track', trackUri: '', trackId: '', albumUri: '', albumName: 'DEBUT', coverImage: '', moodTag: 'Sunday Slowdown', memoryNote: 'Laundry day, balcony breeze, no rush.', cassetteTheme: 'slow-sunday', yearLabel: '1993', labelColor: '#1848b8', cassetteStyle: 'navy-blue' },
  { id: '6', title: 'OK COMPUTER', artist: 'RADIOHEAD', year: '1997', duration: 262, albumId: '6', uri: '', itemType: 'track', trackUri: '', trackId: '', albumUri: '', albumName: 'OK COMPUTER', coverImage: '', moodTag: 'Midnight Drive', memoryNote: 'City lights sliding across the windshield.', cassetteTheme: 'neon-road', yearLabel: '1997', labelColor: '#2aaa30', cassetteStyle: 'green-black' },
];

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  tracks: defaultTracks,
  currentIndex: 0,
  isPlaying: false,
  progress: 0,
  currentTime: 0,
  isConnected: false,
  isLoading: false,
  isDemoMode: true,
  playerStatus: 'disconnected',

  setTracks: (tracks) => set({ tracks }),
  setCurrentIndex: (index) => set({ currentIndex: index }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setProgress: (progress) => set({ progress }),
  setCurrentTime: (time) =>
    set((state) => ({
      currentTime: typeof time === 'function' ? time(state.currentTime) : time,
    })),
  setIsConnected: (connected) => set({ isConnected: connected }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsDemoMode: (demoMode) => set({ isDemoMode: demoMode }),
  setPlayerStatus: (status) => set({ playerStatus: status }),
  skipTrack: (dir) => {
    const { tracks, currentIndex } = get();
    const next = (currentIndex + dir + tracks.length) % tracks.length;
    set({ currentIndex: next, currentTime: 0, progress: 0 });
  },
}));
