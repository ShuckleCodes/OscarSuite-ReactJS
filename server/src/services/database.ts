import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import fs from 'fs';
import type { Award, Guest, GuestWithScore, Room, AppState } from '../types/index.js';

// Database types
interface GuestRecord {
  name: string;
  photo: string;
  predictions: Record<string, number>;
  rooms: string[];
}

interface GuestsDB {
  guests: GuestRecord[];
}

interface RoomRecord {
  name: string;
  code: string;
}

interface RoomsDB {
  rooms: RoomRecord[];
}

interface AppStateDB {
  predictions_locked: boolean;
  current_award_id: number | null;
  winners: Record<string, number>;
}

// Data directory paths
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_DIR = path.join(DATA_DIR, 'db');

// Ensure directories exist
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Cached database instances
let guestsDb: Low<GuestsDB> | null = null;
let roomsDb: Low<RoomsDB> | null = null;
let appStateDb: Low<AppStateDB> | null = null;

// Initialize databases with defaults
async function getGuestsDb(): Promise<Low<GuestsDB>> {
  if (!guestsDb) {
    const adapter = new JSONFile<GuestsDB>(path.join(DB_DIR, 'guests.json'));
    guestsDb = new Low<GuestsDB>(adapter);
    await guestsDb.read();
    if (!guestsDb.data) {
      guestsDb.data = { guests: [] };
      await guestsDb.write();
    }
  }
  return guestsDb;
}

async function getRoomsDb(): Promise<Low<RoomsDB>> {
  if (!roomsDb) {
    const adapter = new JSONFile<RoomsDB>(path.join(DB_DIR, 'rooms.json'));
    roomsDb = new Low<RoomsDB>(adapter);
    await roomsDb.read();
    if (!roomsDb.data) {
      roomsDb.data = { rooms: [] };
      await roomsDb.write();
    }
  }
  return roomsDb;
}

async function getAppStateDb(): Promise<Low<AppStateDB>> {
  if (!appStateDb) {
    const adapter = new JSONFile<AppStateDB>(path.join(DB_DIR, 'app_state.json'));
    appStateDb = new Low<AppStateDB>(adapter);
    await appStateDb.read();
    if (!appStateDb.data) {
      appStateDb.data = {
        predictions_locked: false,
        current_award_id: null,
        winners: {}
      };
      await appStateDb.write();
    }
  }
  return appStateDb;
}

// Load awards from JSON file
export function loadAwards(): Award[] {
  const awardsPath = path.join(DATA_DIR, 'awards.json');
  if (fs.existsSync(awardsPath)) {
    const data = JSON.parse(fs.readFileSync(awardsPath, 'utf-8'));
    return data.awards || [];
  }
  return [];
}

// Awards
export async function getAwards(): Promise<Award[]> {
  return loadAwards();
}

// Rooms
export async function getRooms(): Promise<Room[]> {
  const db = await getRoomsDb();
  await db.read();
  const rooms = db.data!.rooms || [];
  return rooms.map((room: RoomRecord, index: number) => ({
    id: index + 1,
    name: room.name,
    code: room.code
  }));
}

export async function getRoomByCode(code: string): Promise<Room | null> {
  const rooms = await getRooms();
  return rooms.find((r: Room) => r.code.toLowerCase() === code.toLowerCase()) || null;
}

export async function createRoom(name: string, code: string): Promise<number | null> {
  const db = await getRoomsDb();
  await db.read();

  const rooms = db.data!.rooms || [];
  const existing = rooms.find((r: RoomRecord) => r.code.toLowerCase() === code.toLowerCase());
  if (existing) {
    return null;
  }

  rooms.push({ name, code: code.toLowerCase() });
  db.data!.rooms = rooms;
  await db.write();
  return rooms.length;
}

export async function deleteRoom(roomId: number): Promise<void> {
  const db = await getRoomsDb();
  await db.read();
  const rooms = db.data!.rooms || [];
  rooms.splice(roomId - 1, 1);
  db.data!.rooms = rooms;
  await db.write();
}

// Guests
export async function getGuests(roomCode?: string): Promise<Guest[]> {
  const db = await getGuestsDb();
  await db.read();

  const guestsList = db.data!.guests || [];
  let result: Guest[] = guestsList.map((guest: GuestRecord, index: number) => ({
    id: index + 1,
    name: guest.name,
    photo: guest.photo || '',
    predictions: guest.predictions || {},
    rooms: guest.rooms || []
  }));

  if (roomCode) {
    result = result.filter((g: Guest) =>
      g.rooms.some((r: string) => r.toLowerCase() === roomCode.toLowerCase())
    );
  }

  return result;
}

export async function getGuestById(guestId: number): Promise<Guest | null> {
  const guests = await getGuests();
  return guests.find((g: Guest) => g.id === guestId) || null;
}

export async function createGuest(
  name: string,
  photo: string = '',
  predictions: Record<string, number> = {},
  rooms: string[] = []
): Promise<number> {
  const db = await getGuestsDb();
  await db.read();

  const guests = db.data!.guests || [];
  guests.push({ name, photo, predictions, rooms });
  db.data!.guests = guests;
  await db.write();
  return guests.length;
}

export async function updateGuest(
  guestId: number,
  updates: { name?: string; photo?: string; predictions?: Record<string, number>; rooms?: string[] }
): Promise<void> {
  const db = await getGuestsDb();
  await db.read();

  const guests = db.data!.guests || [];
  const index = guestId - 1;
  if (index >= 0 && index < guests.length) {
    const guest = guests[index];
    if (updates.name !== undefined) guest.name = updates.name;
    if (updates.photo !== undefined) guest.photo = updates.photo;
    if (updates.predictions !== undefined) guest.predictions = updates.predictions;
    if (updates.rooms !== undefined) guest.rooms = updates.rooms;
    await db.write();
  }
}

export async function deleteGuest(guestId: number): Promise<void> {
  const db = await getGuestsDb();
  await db.read();
  const guests = db.data!.guests || [];
  guests.splice(guestId - 1, 1);
  db.data!.guests = guests;
  await db.write();
}

export async function clearGuests(): Promise<void> {
  const db = await getGuestsDb();
  await db.read();
  db.data!.guests = [];
  await db.write();
}

// Guests with scores
export async function getGuestsWithScores(roomCode?: string): Promise<GuestWithScore[]> {
  const guests = await getGuests(roomCode);
  const state = await getAppState();
  const winners = state.winners;

  return guests.map((guest: Guest) => {
    let score = 0;

    for (const [awardId, nomineeId] of Object.entries(guest.predictions)) {
      if (winners[awardId] !== undefined && winners[awardId] === nomineeId) {
        score += 1;
      }
    }

    return { ...guest, score };
  });
}

// App State
export async function getAppState(): Promise<AppState> {
  const db = await getAppStateDb();
  await db.read();
  return {
    predictions_locked: db.data!.predictions_locked ?? false,
    current_award_id: db.data!.current_award_id ?? null,
    winners: db.data!.winners || {}
  };
}

export async function setPredictionsLocked(locked: boolean): Promise<void> {
  const db = await getAppStateDb();
  await db.read();
  db.data!.predictions_locked = locked;
  await db.write();
}

export async function setCurrentAward(awardId: number | null): Promise<void> {
  const db = await getAppStateDb();
  await db.read();
  db.data!.current_award_id = awardId;
  await db.write();
}

export async function setWinner(awardId: number, nomineeId: number): Promise<void> {
  const db = await getAppStateDb();
  await db.read();
  if (!db.data!.winners) {
    db.data!.winners = {};
  }
  db.data!.winners[String(awardId)] = nomineeId;
  await db.write();
}

export async function clearWinner(awardId: number): Promise<void> {
  const db = await getAppStateDb();
  await db.read();
  if (db.data!.winners) {
    delete db.data!.winners[String(awardId)];
  }
  await db.write();
}

export async function resetAppState(): Promise<void> {
  const db = await getAppStateDb();
  await db.read();
  db.data!.predictions_locked = false;
  db.data!.current_award_id = null;
  db.data!.winners = {};
  await db.write();
}
