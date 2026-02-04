import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import fs from 'fs';
import type { Award, Guest, GuestWithScore, Room, AppState, AwardsDB, AwardCreate, AwardUpdate, NomineeCreate, NomineeUpdate, Nominee } from '../types/index.js';

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
  event_title: string;
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
let awardsDb: Low<AwardsDB> | null = null;

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
        winners: {},
        event_title: 'Awards Night'
      };
      await appStateDb.write();
    }
    // Migrate existing db: add event_title if missing
    if (appStateDb.data.event_title === undefined) {
      appStateDb.data.event_title = 'Awards Night';
      await appStateDb.write();
    }
  }
  return appStateDb;
}

// Awards Database with migration support
async function getAwardsDb(): Promise<Low<AwardsDB>> {
  if (!awardsDb) {
    const dbPath = path.join(DB_DIR, 'awards.json');
    const staticPath = path.join(DATA_DIR, 'awards.json');
    const adapter = new JSONFile<AwardsDB>(dbPath);
    awardsDb = new Low<AwardsDB>(adapter);
    await awardsDb.read();

    // Migration: if db doesn't exist but static file does, migrate
    if (!awardsDb.data && fs.existsSync(staticPath)) {
      const staticData = JSON.parse(fs.readFileSync(staticPath, 'utf-8'));
      const awards: Award[] = staticData.awards || [];

      // Calculate next IDs based on existing data
      let maxAwardId = 0;
      let maxNomineeId = 0;
      for (const award of awards) {
        if (award.id > maxAwardId) maxAwardId = award.id;
        for (const nominee of award.nominees) {
          if (nominee.id > maxNomineeId) maxNomineeId = nominee.id;
        }
      }

      awardsDb.data = {
        awards,
        nextAwardId: maxAwardId + 1,
        nextNomineeId: maxNomineeId + 1
      };
      await awardsDb.write();
    }

    // Default empty database
    if (!awardsDb.data) {
      awardsDb.data = {
        awards: [],
        nextAwardId: 1,
        nextNomineeId: 1
      };
      await awardsDb.write();
    }
  }
  return awardsDb;
}

// Awards CRUD
export async function getAwards(): Promise<Award[]> {
  const db = await getAwardsDb();
  await db.read();
  return db.data!.awards || [];
}

export async function getAwardById(awardId: number): Promise<Award | null> {
  const awards = await getAwards();
  return awards.find((a: Award) => a.id === awardId) || null;
}

export async function createAward(data: AwardCreate): Promise<Award> {
  const db = await getAwardsDb();
  await db.read();

  const newAward: Award = {
    id: db.data!.nextAwardId,
    name: data.name,
    nominees: []
  };

  db.data!.awards.push(newAward);
  db.data!.nextAwardId += 1;
  await db.write();
  return newAward;
}

export async function updateAward(awardId: number, data: AwardUpdate): Promise<Award | null> {
  const db = await getAwardsDb();
  await db.read();

  const index = db.data!.awards.findIndex((a: Award) => a.id === awardId);
  if (index === -1) return null;

  const award = db.data!.awards[index];
  if (data.name !== undefined) award.name = data.name;
  if (data.nominees !== undefined) award.nominees = data.nominees;

  await db.write();
  return award;
}

export async function deleteAward(awardId: number): Promise<boolean> {
  const db = await getAwardsDb();
  await db.read();

  const index = db.data!.awards.findIndex((a: Award) => a.id === awardId);
  if (index === -1) return false;

  db.data!.awards.splice(index, 1);
  await db.write();

  // Clear winner if this award had one
  await clearWinner(awardId);

  return true;
}

// Nominees CRUD
export async function createNominee(awardId: number, data: NomineeCreate): Promise<Nominee | null> {
  const db = await getAwardsDb();
  await db.read();

  const award = db.data!.awards.find((a: Award) => a.id === awardId);
  if (!award) return null;

  const newNominee: Nominee = {
    id: db.data!.nextNomineeId,
    name: data.name,
    image: data.image || ''
  };

  award.nominees.push(newNominee);
  db.data!.nextNomineeId += 1;
  await db.write();
  return newNominee;
}

export async function updateNominee(awardId: number, nomineeId: number, data: NomineeUpdate): Promise<Nominee | null> {
  const db = await getAwardsDb();
  await db.read();

  const award = db.data!.awards.find((a: Award) => a.id === awardId);
  if (!award) return null;

  const nominee = award.nominees.find((n: Nominee) => n.id === nomineeId);
  if (!nominee) return null;

  if (data.name !== undefined) nominee.name = data.name;
  if (data.image !== undefined) nominee.image = data.image;

  await db.write();
  return nominee;
}

export async function deleteNominee(awardId: number, nomineeId: number): Promise<boolean> {
  const db = await getAwardsDb();
  await db.read();

  const award = db.data!.awards.find((a: Award) => a.id === awardId);
  if (!award) return false;

  const index = award.nominees.findIndex((n: Nominee) => n.id === nomineeId);
  if (index === -1) return false;

  award.nominees.splice(index, 1);
  await db.write();

  // Clear winner if this nominee was the winner
  const appState = await getAppState();
  if (appState.winners[String(awardId)] === nomineeId) {
    await clearWinner(awardId);
  }

  return true;
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
    winners: db.data!.winners || {},
    event_title: db.data!.event_title ?? 'Awards Night'
  };
}

export async function setEventTitle(title: string): Promise<void> {
  const db = await getAppStateDb();
  await db.read();
  db.data!.event_title = title;
  await db.write();
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
