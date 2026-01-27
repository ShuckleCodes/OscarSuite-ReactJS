// TypeScript interfaces for Oscar Suite

export interface Nominee {
  id: number;
  name: string;
  image: string;
}

export interface Award {
  id: number;
  name: string;
  nominees: Nominee[];
}

export interface Room {
  id: number;
  name: string;
  code: string;
}

export interface Guest {
  id: number;
  name: string;
  photo: string;
  predictions: Record<string, number>;
  rooms: string[];
}

export interface GuestWithScore extends Guest {
  score: number;
  displayScore?: number;
  oldScore?: number;
}

export interface AppState {
  predictions_locked: boolean;
  current_award_id: number | null;
  winners: Record<string, number>;
}

export type ScreenMode = 'logo' | 'award' | 'scoreboard';
