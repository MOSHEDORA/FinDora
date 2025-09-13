export const config = {
  googlePlacesApiKey: process.env.GOOGLE_PLACES_API_KEY || "",
  openRouterApiKey: process.env.OPENROUTER_API_KEY || "",
  jwtSecret: process.env.JWT_SECRET || process.env.SESSION_SECRET || "default-secret",
  dataDir: process.env.DATA_DIR || "./data"
};
