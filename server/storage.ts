import { randomUUID } from "crypto";

export interface IStorage {
  // Storage methods will be added when implementing backend
}

export class MemStorage implements IStorage {
  constructor() {
    // Initialize storage
  }
}

export const storage = new MemStorage();
