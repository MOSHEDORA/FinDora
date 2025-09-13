import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { fileStorage } from './fileStorage';
import { User, InsertUser, LoginUser } from '@shared/schema';
import { randomUUID } from 'crypto';

export class AuthService {
  async register(userData: InsertUser): Promise<User> {
    const users = await fileStorage.readFile<User[]>('users.json') || [];
    
    // Check if user already exists
    const existingUser = users.find(u => u.email === userData.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const newUser: User = {
      id: randomUUID(),
      email: userData.email,
      password: hashedPassword,
      name: userData.name,
      createdAt: new Date()
    };

    users.push(newUser);
    await fileStorage.writeFile('users.json', users);

    return newUser;
  }

  async login(loginData: LoginUser): Promise<{ user: User; token: string }> {
    const users = await fileStorage.readFile<User[]>('users.json') || [];
    
    const user = users.find(u => u.email === loginData.email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(loginData.password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: '7d' });
    
    return { user, token };
  }

  async verifyToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
      const users = await fileStorage.readFile<User[]>('users.json') || [];
      return users.find(u => u.id === decoded.userId) || null;
    } catch {
      return null;
    }
  }
}

export const authService = new AuthService();
