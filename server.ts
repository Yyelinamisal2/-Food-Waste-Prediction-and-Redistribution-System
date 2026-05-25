import express from "express";
import path from "path";
import dns from "dns";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Fixes node DNS resolution for localhost.
dns.setDefaultResultOrder("ipv4first");

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// SIMULATED CHARITY NETWORK
const SIMULATED_CHARITIES = [
  {
    id: "charity_1",
    name: "Hope Harbor Shelter",
    type: "Shelter",
    acceptedCategories: ["Cooked Food", "Bakery", "Produce", "Dairy"],
    urgencyLevel: "High",
    address: "450 Hope Way, Plaza District",
    lat: 37.7812,
    lng: -122.4110,
    maxCapacityLbs: 500,
    distanceMiles: 1.2
  },
  {
    id: "charity_2",
    name: "Metro Harvest Food Food Bank",
    type: "Food Bank",
    acceptedCategories: ["Produce", "Pantry", "Dairy", "Meat & Seafood"],
    urgencyLevel: "Medium",
    address: "1200 Industrial Ave, Depot Area",
    lat: 37.7554,
    lng: -122.3920,
    maxCapacityLbs: 5000,
    distanceMiles: 3.4
  },
  {
    id: "charity_3",
    name: "Nourish Soup Kitchen",
    type: "Soup Kitchen",
    acceptedCategories: ["Produce", "Cooked Food", "Meat & Seafood", "Dairy"],
    urgencyLevel: "High",
    address: "78 East 4th St, Civic Center",
    lat: 37.7790,
    lng: -122.4180,
    maxCapacityLbs: 800,
    distanceMiles: 2.1
  },
  {
    id: "charity_4",
    name: "Oak Street Community Fridge",
    type: "Community Fridge",
    acceptedCategories: ["Bakery", "Produce", "Dairy", "Pantry"],
    urgencyLevel: "Low",
    address: "15 Oak St, Residential Heights",
    lat: 37.7680,
    lng: -122.4010,
    maxCapacityLbs: 150,
    distanceMiles: 0.8
  }
];

// Helper to handle client-side missing keys safely
const checkApiKey = (res: any) => {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
    res.status(500).json({
      error: "Gemini API key is not configured. Please add GEMINI_API_KEY in the Secrets panel in Settings.",
    });
    return false;
  }
  return true;
};

// API ENDPOINT: PREDICT FOOD WASTE RISK
app.post("/api/predict", async (req, res) => {
  if (!checkApiKey(res)) return;

  try {
    const { items, eventContext, weatherContext } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "No inventory items provided for prediction." });
    }

    const itemsSummary = items
      .map(
        (item) =>
          `ID: ${item.id}, Name: ${item.name}, Qty: ${item.quantity} ${item.unit}, Category: ${item.category}, Acquired: ${item.acquiredDate}, Exp: ${item.expirationDate}, Storage: ${item.storageCondition}, Avg Demand Sales: ${item.quantityForecastSales} ${item.unit}`
      )
      .join("\n");

    const prompt = `
      You are an expert food logistics ML predictor model.
      We have an inventory list and surrounding dynamic environmental conditions. Your task is to calculate the probability of surplus waste for each item, remaining shelf life, dollar value of waste, and primary driving risk factor.

      [CONTEXT]
      - Events/Schedules Context: ${eventContext || "Standard daily operation, no specific events."}
      - Local Weather Context: ${weatherContext || "Mild and temperate."}

      [INVENTORY ITEMS]
      ${itemsSummary}

      Estimate surplus probability (0-100%) based on:
      1. Expiration dates vs typical shelf-lives.
      2. Mismatch between current quantity and forecasted demand/sales.
      3. Weather effects (e.g. extreme heat increases spoilage rate of fresh produce/bakery, or shifts consumer demand toward cold goods).
      4. Event effects (e.g. low foot traffic on specific holidays, or catering surplus).
      5. Storage environments (e.g. Refrigeration extends shelf-life, pantry is higher risk for short shelf-life items).

      Render a JSON array reflecting the prediction output.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              itemId: { type: Type.STRING },
              itemName: { type: Type.STRING },
              surplusProbability: { type: Type.INTEGER, description: "Waste probability percentage 0-100" },
              estimatedWasteLbs: { type: Type.NUMBER, description: "Estimated leftover waste in pounds equivalent" },
              shelfLifeRemainingDays: { type: Type.INTEGER, description: "Estimated remaining safe shelf-life in days under current conditions" },
              wasteCostEstimate: { type: Type.NUMBER, description: "Financial cost of this surplus waste in USD ($)" },
              primaryDriver: { type: Type.STRING, description: "Detailed root cause driver of predicted waste" },
              actionRecommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "2-3 actionable guidelines to mitigate this waste"
              },
              confidenceScore: { type: Type.INTEGER, description: "Model's confidence estimate 0-100%" }
            },
            required: [
              "itemId",
              "itemName",
              "surplusProbability",
              "estimatedWasteLbs",
              "shelfLifeRemainingDays",
              "wasteCostEstimate",
              "primaryDriver",
              "actionRecommendations",
              "confidenceScore"
            ],
          },
        },
      },
    });

    const results = JSON.parse(response.text || "[]");
    res.json({ success: true, predictions: results });
  } catch (error: any) {
    console.error("Prediction API Error:", error);
    res.status(500).json({ error: error.message || "An error occurred during surplus prediction." });
  }
});

// API ENDPOINT: OPTIMAL DONATION AND CHARITY MATCH
app.post("/api/match-charities", async (req, res) => {
  if (!checkApiKey(res)) return;

  try {
    const { listing } = req.body;

    if (!listing) {
      return res.status(400).json({ error: "No donation listing provided for matching." });
    }

    const listingDescription = `
      Item: ${listing.itemName}
      Quantity: ${listing.quantity} ${listing.unit}
      Category: ${listing.category}
      Urgency Level (Expected Preservation Hours): ${listing.urgencyHours} hours
      Notes/Condition: ${listing.notes || "None"}
    `;

    const charitiesDescription = SIMULATED_CHARITIES
      .map(
        (c) =>
          `ID: ${c.id}, Name: ${c.name}, Type: ${c.type}, Accepted Categories: [${c.acceptedCategories.join(
            ", "
          )}], Urgency Level: ${c.urgencyLevel}, Address: ${c.address}, Max Capacity: ${c.maxCapacityLbs} Lbs, Distance: ${c.distanceMiles} miles`
      )
      .join("\n");

    const prompt = `
      You are a logistics coordinator matching surplus food donations with charities.
      We have one surplus listing and a set of local recipient charities. Match this donation optimally.

      [DONATION DETAIL]
      ${listingDescription}

      [CHARITY DIRECTORY]
      ${charitiesDescription}

      Provide compatibility matching results for ALL charities in the directory.
      For each charity, compute:
      1. A compatibility score (0-100) based on:
         - Category support (if the charity doesn't accept this type of food, compatibility should be very low unless it's a general shelter in high urgency status).
         - Distance (closer is better).
         - capacity alignment vs. donation volume.
         - Urgency level alignment.
      2. suitablityReason: A clear, contextual reasoning sentence explaining the score.
      3. transportRequirement: Recommended transport vehicles (eg 'Sedan', 'Insulated cold cooler box recommended', etc).

      Provide the response strictly as a JSON array.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              charityId: { type: Type.STRING },
              matchScore: { type: Type.INTEGER, description: "Compatibility matching score 0-100" },
              suitabilityReason: { type: Type.STRING, description: "Detailed rationale of compatibility score" },
              transportRequirement: { type: Type.STRING, description: "Vehicular/coolant requirement for hauling" }
            },
            required: ["charityId", "matchScore", "suitabilityReason", "transportRequirement"]
          }
        }
      }
    });

    const results = JSON.parse(response.text || "[]");
    res.json({ success: true, matches: results, charities: SIMULATED_CHARITIES });
  } catch (error: any) {
    console.error("Match Charities API Error:", error);
    res.status(500).json({ error: error.message || "An error occurred during charity matching." });
  }
});

// API ENDPOINT: AI ADVISOR & PRESERVATION CHAT
app.post("/api/advisor", async (req, res) => {
  if (!checkApiKey(res)) return;

  try {
    const { messages, contextInventory } = req.body;

    const systemInstruction = `
      You are "EcoChef & LogiWaste", an intelligent Food Waste reduction assistant and preservation expert.
      Your goal is to offer:
      1. Highly specific storage optimization tips to prevent spoilage.
      2. Inspiring, delicious leftover recipe suggestions that repurpose items on verge of expiration (e.g. turning brown bananas into banana bread, stale bread into panzanella or croutons, wilting spinach into pesto, leftover rice into fried rice).
      3. Practical local safety codes on food donations. Only cooked foods kept at safe temperature, no leaking packaging, etc.

      Be encouraging, culinary-focused, logical, and compact in your responses. Use markdown bolding and bullet list points for readability.
      If available, refer directly to items listed in the current user surplus inventory.
    `;

    let contentPrompt = "";
    if (contextInventory && Array.isArray(contextInventory) && contextInventory.length > 0) {
      contentPrompt += `[CURRENT USER ITEMS THAT ARE AT EXPIRE/WASTE RISK]:\n`;
      contextInventory.forEach((item) => {
        contentPrompt += `- ${item.name} (${item.quantity} ${item.unit}), exp: ${item.expirationDate}, category: ${item.category}\n`;
      });
      contentPrompt += `\n`;
    }

    // Capture the latest chat structure
    const chatHistory = messages || [];
    const chatSession = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction,
      },
    });

    // Populate seed messages to recreate the state if active
    let lastQuery = "Recommend food waste prevention tips.";
    for (let i = 0; i < chatHistory.length; i++) {
      const msg = chatHistory[i];
      if (i === chatHistory.length - 1 && msg.role === "user") {
        lastQuery = msg.content;
      } else {
        // Can optionally seed, but standard chat sendMessage sequence works nicely.
      }
    }

    const promptMessage = contentPrompt ? `${contentPrompt}\nUser Query: ${lastQuery}` : lastQuery;
    const response = await chatSession.sendMessage({ message: promptMessage });

    res.json({ success: true, text: response.text });
  } catch (error: any) {
    console.error("AI Advisor API Error:", error);
    res.status(500).json({ error: error.message || "An error occurred in AI Advisor chatbot." });
  }
});

// GET SIMULATED CHARITY NETWORK LIST
app.get("/api/charities", (req, res) => {
  res.json({ success: true, charities: SIMULATED_CHARITIES });
});

// VITE MIDDLEWARE SETUP FOR DEV VS STATIC SHIELD FOR PRODUCTION
const setupServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite Development Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Configuring Static Resource Pipelines for Production...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Food Waste Logistics Core Server booted and running on http://localhost:${PORT}`);
  });
};

setupServer();
