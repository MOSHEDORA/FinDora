import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, json, decimal, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const searchHistory = pgTable("search_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  query: text("query").notNull(),
  location: text("location").notNull(),
  radius: text("radius").notNull(),
  filters: json("filters"),
  timestamp: timestamp("timestamp").defaultNow()
});

export const places = pgTable("places", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  category: text("category"),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  priceLevel: integer("price_level"),
  photoUrl: text("photo_url"),
  isOpen: boolean("is_open"),
  businessStatus: text("business_status"),
  types: json("types").$type<string[]>(),
  aiCategory: text("ai_category"),
  aiTags: json("ai_tags").$type<string[]>()
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  name: true,
});

export const loginSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
});

export const insertSearchHistorySchema = createInsertSchema(searchHistory).pick({
  query: true,
  location: true,
  radius: true,
  filters: true,
});

export const insertPlaceSchema = createInsertSchema(places).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginSchema>;
export type User = typeof users.$inferSelect;
export type SearchHistory = typeof searchHistory.$inferSelect;
export type InsertSearchHistory = z.infer<typeof insertSearchHistorySchema>;
export type Place = typeof places.$inferSelect;
export type InsertPlace = z.infer<typeof insertPlaceSchema>;
