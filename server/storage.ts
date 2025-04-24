import { users, type User, type InsertUser, type File, type InsertFile, files } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // File operations
  getFile(id: number): Promise<File | undefined>;
  getFilesByUserId(userId: number): Promise<File[]>;
  getAllFiles(): Promise<File[]>;
  createFile(file: InsertFile): Promise<File>;
  updateFile(id: number, updates: Partial<InsertFile>): Promise<File | undefined>;
  deleteFile(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private filesMap: Map<number, File>;
  userCurrentId: number;
  fileCurrentId: number;

  constructor() {
    this.users = new Map();
    this.filesMap = new Map();
    this.userCurrentId = 1;
    this.fileCurrentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getFile(id: number): Promise<File | undefined> {
    return this.filesMap.get(id);
  }

  async getFilesByUserId(userId: number): Promise<File[]> {
    return Array.from(this.filesMap.values()).filter(
      (file) => file.userId === userId,
    );
  }

  async getAllFiles(): Promise<File[]> {
    return Array.from(this.filesMap.values());
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    const id = this.fileCurrentId++;
    const createdAt = new Date();
    const file: File = { ...insertFile, id, createdAt };
    this.filesMap.set(id, file);
    return file;
  }

  async updateFile(id: number, updates: Partial<InsertFile>): Promise<File | undefined> {
    const file = await this.getFile(id);
    if (!file) return undefined;
    
    const updatedFile: File = { ...file, ...updates };
    this.filesMap.set(id, updatedFile);
    return updatedFile;
  }

  async deleteFile(id: number): Promise<boolean> {
    return this.filesMap.delete(id);
  }
}

export const storage = new MemStorage();
