/**
 * Type declarations for the AI-Based Food Waste Prediction and Redistribution System.
 */

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: 'Produce' | 'Bakery' | 'Cooked Food' | 'Dairy' | 'Pantry' | 'Meat & Seafood';
  acquiredDate: string;
  expirationDate: string;
  storageCondition: 'Refrigerated' | 'Frozen' | 'Pantry';
  quantityForecastSales: number; // Historical average demand amount
}

export interface PredictionResult {
  itemId: string;
  itemName: string;
  surplusProbability: number; // 0 to 100
  estimatedWasteLbs: number;
  shelfLifeRemainingDays: number;
  wasteCostEstimate: number;
  primaryDriver: string;
  actionRecommendations: string[];
  confidenceScore: number; // 0 to 100
}

export interface DonorProfile {
  id: string;
  name: string;
  type: 'Restaurant' | 'Supermarket' | 'Bakery' | 'Hotel' | 'Catering' | 'Household';
  address: string;
  lat: number;
  lng: number;
  contact: string;
}

export interface CharityProfile {
  id: string;
  name: string;
  type: 'Shelter' | 'Food Bank' | 'Soup Kitchen' | 'Community Fridge';
  acceptedCategories: string[];
  urgencyLevel: 'High' | 'Medium' | 'Low';
  address: string;
  lat: number;
  lng: number;
  maxCapacityLbs: number;
  distanceMiles: number;
}

export interface RescueListing {
  id: string;
  itemName: string;
  quantity: number;
  unit: string;
  category: string;
  donorName: string;
  donorAddress: string;
  donorCoordinates: [number, number]; // [lat, lng]
  matchedCharityId?: string;
  matchedCharityName?: string;
  matchedCharityAddress?: string;
  matchedCharityCoordinates?: [number, number]; // [lat, lng]
  status: 'Available' | 'Matched' | 'In Transit' | 'Completed';
  pickupDeadline: string;
  urgencyHours: number;
  estimatedCO2SavingsKg: number;
  notes?: string;
}

export interface ImpactStats {
  totalRescuedLbs: number;
  mealsProvided: number;
  co2SavedKgs: number;
  activeRescues: number;
  wasteConversionRate: number; // percentage of surplus diverted
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}
