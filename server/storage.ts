import { User, InsertUser, SearchHistory, InsertSearchHistory, Place } from "@shared/schema";
import { fileStorage } from "./services/fileStorage";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Search history methods
  getUserSearchHistory(userId: string): Promise<SearchHistory[]>;
  addSearchHistory(userId: string, history: InsertSearchHistory): Promise<SearchHistory>;
  removeSearchHistory(userId: string, historyId: string): Promise<void>;
  
  // Places methods (for caching)
  getCachedPlaces(key: string): Promise<Place[] | undefined>;
  setCachedPlaces(key: string, places: Place[]): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private searchHistory: Map<string, SearchHistory[]>;
  private placesCache: Map<string, Place[]>;
  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.users = new Map();
    this.searchHistory = new Map();
    this.placesCache = new Map();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;
    
    this.initPromise = this.loadFromFiles();
    await this.initPromise;
    this.isInitialized = true;
  }

  private async loadFromFiles() {
    // Load users
    const users = await fileStorage.readFile<User[]>('users.json') || [];
    users.forEach(user => this.users.set(user.id, user));

    // Load search history
    const history = await fileStorage.readFile<SearchHistory[]>('search_history.json') || [];
    history.forEach(h => {
      const userHistory = this.searchHistory.get(h.userId) || [];
      userHistory.push(h);
      this.searchHistory.set(h.userId, userHistory);
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date()
    };
    this.users.set(id, user);
    
    // Save to file
    await fileStorage.writeFile('users.json', Array.from(this.users.values()));
    
    return user;
  }

  async getUserSearchHistory(userId: string): Promise<SearchHistory[]> {
    return this.searchHistory.get(userId) || [];
  }

  async addSearchHistory(userId: string, history: InsertSearchHistory): Promise<SearchHistory> {
    const id = randomUUID();
    const searchRecord: SearchHistory = {
      ...history,
      id,
      userId,
      timestamp: new Date(),
      filters: history.filters || null
    };

    const userHistory = this.searchHistory.get(userId) || [];
    userHistory.unshift(searchRecord); // Add to beginning
    
    // Keep only last 50 searches
    if (userHistory.length > 50) {
      userHistory.splice(50);
    }
    
    this.searchHistory.set(userId, userHistory);
    
    // Save to file
    const allHistory = Array.from(this.searchHistory.values()).flat();
    await fileStorage.writeFile('search_history.json', allHistory);
    
    return searchRecord;
  }

  async removeSearchHistory(userId: string, historyId: string): Promise<void> {
    const userHistory = this.searchHistory.get(userId) || [];
    const updatedHistory = userHistory.filter(h => h.id !== historyId);
    this.searchHistory.set(userId, updatedHistory);
    
    // Save to file
    const allHistory = Array.from(this.searchHistory.values()).flat();
    await fileStorage.writeFile('search_history.json', allHistory);
  }

  async getCachedPlaces(key: string): Promise<Place[] | undefined> {
    return this.placesCache.get(key);
  }

  async setCachedPlaces(key: string, places: Place[]): Promise<void> {
    this.placesCache.set(key, places);
    // Optional: persist cache to file for longer term storage
  }
}

const memStorage = new MemStorage();
export const storage = memStorage;
export const initializeStorage = () => memStorage.initialize();
