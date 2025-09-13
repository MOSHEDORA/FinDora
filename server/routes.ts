import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, initializeStorage } from "./storage";
import { authService } from "./services/auth";
import { placesService } from "./services/places";
import { aiService } from "./services/ai";
import { insertUserSchema, loginSchema, insertSearchHistorySchema } from "@shared/schema";
import jwt from 'jsonwebtoken';
import { config } from './config';

// Middleware to verify JWT token
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const user = await authService.verifyToken(token);
    if (!user) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize storage before handling any requests
  await initializeStorage();

  // Auth routes
  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await authService.register(userData);
      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      next(error);
    }
  });

  app.post("/api/auth/login", async (req, res, next) => {
    try {
      const loginData = loginSchema.parse(req.body);
      const { user, token } = await authService.login(loginData);
      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch (error: any) {
      next(error);
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    const { password, ...userWithoutPassword } = req.user;
    res.json({ user: userWithoutPassword });
  });

  // Places routes
  app.get("/api/places/nearby", authenticateToken, async (req: any, res, next) => {
    try {
      const { lat, lng, radius = 2000, type } = req.query;
      
      if (!lat || !lng) {
        return res.status(400).json({ message: 'Latitude and longitude are required' });
      }

      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);
      const searchRadius = parseInt(radius as string);

      // Check cache first
      const cacheKey = `nearby_${latitude}_${longitude}_${searchRadius}_${type || 'all'}`;
      let places = await storage.getCachedPlaces(cacheKey);

      if (!places) {
        // Fetch from Google Places API
        places = await placesService.searchNearby(latitude, longitude, searchRadius, type as string);
        
        // Categorize with AI
        places = await aiService.categorizePlaces(places);
        
        // Cache results
        await storage.setCachedPlaces(cacheKey, places);
      }

      res.json({ places });
    } catch (error: any) {
      next(error);
    }
  });

  app.get("/api/places/search", authenticateToken, async (req: any, res, next) => {
    try {
      const { query, lat, lng } = req.query;
      
      if (!query) {
        return res.status(400).json({ message: 'Search query is required' });
      }

      const latitude = lat ? parseFloat(lat as string) : undefined;
      const longitude = lng ? parseFloat(lng as string) : undefined;

      // Check cache first
      const cacheKey = `search_${query}_${latitude || 'global'}_${longitude || 'global'}`;
      let places = await storage.getCachedPlaces(cacheKey);

      if (!places) {
        // Search using Google Places API
        places = await placesService.searchByText(query as string, latitude, longitude);
        
        // Categorize with AI
        places = await aiService.categorizePlaces(places);
        
        // Cache results
        await storage.setCachedPlaces(cacheKey, places);
      }

      res.json({ places });
    } catch (error: any) {
      next(error);
    }
  });

  // Search history routes
  app.get("/api/search-history", authenticateToken, async (req: any, res, next) => {
    try {
      const history = await storage.getUserSearchHistory(req.user.id);
      res.json({ history });
    } catch (error: any) {
      next(error);
    }
  });

  app.post("/api/search-history", authenticateToken, async (req: any, res, next) => {
    try {
      const historyData = insertSearchHistorySchema.parse(req.body);
      const history = await storage.addSearchHistory(req.user.id, historyData);
      res.json({ history });
    } catch (error: any) {
      next(error);
    }
  });

  app.delete("/api/search-history/:id", authenticateToken, async (req: any, res, next) => {
    try {
      await storage.removeSearchHistory(req.user.id, req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
