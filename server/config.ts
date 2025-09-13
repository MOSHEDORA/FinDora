export const config = {
  googlePlacesApiKey: process.env.GOOGLE_PLACES_API_KEY || "AIzaSyDzN5-hfyLKma8VztB-GlhECc5PEFBoZDo",
  openRouterApiKey: process.env.OPENROUTER_API_KEY || "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",
  jwtSecret: process.env.JWT_SECRET || process.env.SESSION_SECRET || "default-secret",
  dataDir: process.env.DATA_DIR || "./data"
};
