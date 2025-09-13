import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { storage } from '../storage';
import { User, InsertUser, LoginUser } from '@shared/schema';
import { randomUUID } from 'crypto';

export class AuthService {
  async register(userData: InsertUser): Promise<User> {
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const userWithHashedPassword: InsertUser = {
      ...userData,
      password: hashedPassword
    };

    const newUser = await storage.createUser(userWithHashedPassword);
    return newUser;
  }

  async login(loginData: LoginUser): Promise<{ user: User; token: string }> {
    const user = await storage.getUserByEmail(loginData.email);
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
      return await storage.getUser(decoded.userId) || null;
    } catch {
      return null;
    }
  }
}

export const authService = new AuthService();
