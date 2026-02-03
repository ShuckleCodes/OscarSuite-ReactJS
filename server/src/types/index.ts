// TypeScript interfaces for Awards Show Suite

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
}

export interface AppState {
  predictions_locked: boolean;
  current_award_id: number | null;
  winners: Record<string, number>;
}

export interface GuestCreate {
  name: string;
  photo?: string;
  predictions?: Record<string, number>;
  rooms?: string[];
}

export interface GuestUpdate {
  name?: string;
  photo?: string;
  predictions?: Record<string, number>;
  rooms?: string[];
}

export interface RoomCreate {
  name: string;
  code: string;
}

export interface SetWinner {
  award_id: number;
  nominee_id: number;
}

export interface LockPredictions {
  locked: boolean;
}
