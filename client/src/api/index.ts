import axios from 'axios';
import type { Award, Guest, GuestWithScore, Room, AppState } from '../types';

const api = axios.create({
  baseURL: '/api'
});

// Awards
export const getAwards = async (): Promise<Award[]> => {
  const { data } = await api.get('/awards');
  return data;
};

// Rooms
export const getRooms = async (): Promise<Room[]> => {
  const { data } = await api.get('/rooms');
  return data;
};

export const getRoomByCode = async (code: string): Promise<Room | null> => {
  try {
    const { data } = await api.get(`/rooms/${code}`);
    return data;
  } catch {
    return null;
  }
};

export const createRoom = async (name: string, code: string): Promise<{ id: number }> => {
  const { data } = await api.post('/rooms', { name, code });
  return data;
};

export const deleteRoom = async (roomId: number): Promise<void> => {
  await api.delete(`/rooms/${roomId}`);
};

// Guests
export const getGuests = async (roomCode?: string): Promise<Guest[]> => {
  const params = roomCode ? { room: roomCode } : {};
  const { data } = await api.get('/guests', { params });
  return data;
};

export const getGuestsWithScores = async (roomCode?: string): Promise<GuestWithScore[]> => {
  const params = roomCode ? { room: roomCode } : {};
  const { data } = await api.get('/guests/with-scores', { params });
  return data;
};

export const getGuestById = async (guestId: number): Promise<Guest | null> => {
  try {
    const { data } = await api.get(`/guests/${guestId}`);
    return data;
  } catch {
    return null;
  }
};

export const createGuest = async (
  name: string,
  photo?: string,
  predictions?: Record<string, number>,
  rooms?: string[]
): Promise<{ id: number }> => {
  const { data } = await api.post('/guests', { name, photo, predictions, rooms });
  return data;
};

export const updateGuest = async (
  guestId: number,
  updates: { name?: string; photo?: string; predictions?: Record<string, number>; rooms?: string[] }
): Promise<void> => {
  await api.put(`/guests/${guestId}`, updates);
};

export const deleteGuest = async (guestId: number): Promise<void> => {
  await api.delete(`/guests/${guestId}`);
};

export const clearAllGuests = async (): Promise<void> => {
  await api.delete('/guests');
};

// App State
export const getAppState = async (): Promise<AppState> => {
  const { data } = await api.get('/app-state');
  return data;
};

export const setPredictionsLocked = async (locked: boolean): Promise<void> => {
  await api.post('/app-state/lock', { locked });
};

export const setWinner = async (awardId: number, nomineeId: number): Promise<void> => {
  await api.post('/app-state/winner', { award_id: awardId, nominee_id: nomineeId });
};

export const clearWinner = async (awardId: number): Promise<void> => {
  await api.delete(`/app-state/winner/${awardId}`);
};

export const resetAppState = async (): Promise<void> => {
  await api.post('/app-state/reset');
};

// Upload
export const uploadPhoto = async (file: File): Promise<{ filename: string; path: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/upload/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
};
