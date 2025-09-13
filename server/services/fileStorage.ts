import fs from 'fs/promises';
import path from 'path';
import { config } from '../config';

export class FileStorage {
  private dataDir: string;

  constructor() {
    this.dataDir = config.dataDir;
    this.ensureDataDir();
  }

  private async ensureDataDir() {
    try {
      await fs.access(this.dataDir);
    } catch {
      await fs.mkdir(this.dataDir, { recursive: true });
    }
  }

  async readFile<T>(filename: string): Promise<T | null> {
    try {
      const filePath = path.join(this.dataDir, filename);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  async writeFile<T>(filename: string, data: T): Promise<void> {
    const filePath = path.join(this.dataDir, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  async appendToFile<T>(filename: string, data: T): Promise<void> {
    const existing = await this.readFile<T[]>(filename) || [];
    if (Array.isArray(existing)) {
      existing.push(data);
      await this.writeFile(filename, existing);
    }
  }
}

export const fileStorage = new FileStorage();
