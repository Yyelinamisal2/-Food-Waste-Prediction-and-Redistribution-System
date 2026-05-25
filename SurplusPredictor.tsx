import React, { useState } from "react";
import { InventoryItem, PredictionResult } from "../types";
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  AlertTriangle, 
  Calendar, 
  CloudSun, 
  Coins, 
  Hourglass,
  ArrowRight,
  PlusCircle,
  CheckCircle,
  HelpCircle,
  Refrigerator
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SurplusPredictorProps {
  inventory: InventoryItem[];
  predictions: Record<string, PredictionResult>;
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  runPredictions: (weather: string, event: string) => Promise<void>;
  isPredicting: boolean;
  onQuickLinkToRescue: (item: InventoryItem, prediction?: PredictionResult) => void;
}

export default function SurplusPredictor({
  inventory,
  predictions,
  setInventory,
  runPredictions,
  isPredicting,
  onQuickLinkToRescue
}: SurplusPredictorProps) {
  // New Item State Form
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<InventoryItem['category']>("Produce");
  const [newItemQty, setNewItemQty] = useState(10);
  const [newItemUnit, setNewItemUnit] = useState("Lbs");
  const [newItemStorage, setNewItemStorage] = useState<InventoryItem['storageCondition']>("Refrigerated");
  const [newItemAcquired, setNewItemAcquired] = useState("2026-05-22");
  const [newItemExp, setNewItemExp] = useState("2026-05-25");
  const [newItemForecast, setNewItemForecast] = useState(5);

  // Environmental context states
  const [weatherContext, setWeatherContext] = useState("Unseasonable Heatwave (92°F) - Accelerated degradation");
  const [eventContext, setEventContext] = useState("Holiday Weekend (Memorial Prep) - Low corporate catering demand");

  // Local feedback notification state
  const [notifyMessage, setNotifyMessage] = useState<string | null>(null);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const added: InventoryItem = {
      id: "inv_" + Date.now(),
      name: newItemName.trim(),
      category: newItemCategory,
      quantity: Number(newItemQty),
      unit: newItemUnit,
      storageCondition: newItemStorage,
      acquiredDate: newItemAcquired,
      expirationDate: newItemExp,
      quantityForecastSales: Number(newItemForecast)
    };

    setInventory(prev => [...prev, added]);
    setNewItemName("");
    setNewItemQty(10);
    setNewItemForecast(5);

    // Briefly notify
    setNotifyMessage(`Added "${added.name}" to inventory.`);
    setTimeout(() => setNotifyMessage(null), 3000);
  };

  const handleDeleteItem = (id: string) => {
    setInventory(prev => prev.filter(item => item.id !== id));
  };

  // Helper utility for risk styling
  const getRiskColor = (prob: number) => {
    if (prob >= 75) return "text-red-600 bg-red-50 border-red-200";
    if (prob >= 40) return "text-amber-700 bg-amber-50 border-amber-200";
    return "text-emerald-700 bg-emerald-50 border-emerald-200";
  };

  const getRiskStatusText = (prob: number) => {
    if (prob >= 75) return "CRITICAL RISK";
    if (prob >= 40) return "MODERATE RISK";
    return "SAFE / LOW RISK";
  };

  return (
    <div className="space-y-6" id="surplus-predictor-tab">
      
      {/* Dynamic feedback notice */}
      <AnimatePresence>
        {notifyMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center shadow-sm"
          >
            <CheckCircle className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
            {notifyMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="surplus-predictor-workspace">
        
        {/* LEFT COLUMN: ACTIVE INVENTORY & MANUAL ITEM ENTRY PANEL (SPAN 7) */}
        <div className="lg:col-span-7 space-y-6" id="inventory-editor-panel">
          
          {/* Section: Inventory Controller */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Active Food Stock & Preservation Registry</h3>
                <p className="text-xs text-slate-400">Current holdings tracked for surplus forecasting.</p>
              </div>
              <span className="text-[11px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded font-mono">
                {inventory.length} Stock-keeping units
              </span>
            </div>

            {/* Inventory table list */}
            <div className="overflow-x-auto" id="inventory-list-table">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                    <th className="py-2.5 px-3">Food Item</th>
                    <th className="py-2.5 px-3">Qty On Hand</th>
                    <th className="py-2.5 px-3">Category / Storage</th>
                    <th className="py-2.5 px-3">Exp. Date</th>
                    <th className="py-2.5 px-3 text-right">Forecast Demand</th>
                    <th className="py-2.5 px-3 text-center">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/60 text-xs">
                  {inventory.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400">
                        No food stock in register. Use the builder below to add fresh ingredients.
                      </td>
                    </tr>
                  ) : (
                    inventory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          {item.name}
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-600">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-3 px-3">
                          <span className="block text-slate-500 font-medium">{item.category}</span>
                          <span className="block text-[10px] text-slate-400 font-mono italic">{item.storageCondition}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-500 font-mono">
                          {item.expirationDate}
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-slate-600 font-mono">
                          {item.quantityForecastSales} {item.unit}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Quick builder inline form */}
            <form onSubmit={handleAddItem} className="border-t border-slate-100/80 pt-5 mt-4 space-y-4" id="item-builder-form">
              <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider flex items-center">
                <PlusCircle className="w-4 h-4 text-emerald-600 mr-2" />
                Register New Batch
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Ingredient / Food Item Name</label>
                  <input
                    type="text"
                    required
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="e.g. Fresh Bartlett Bananas, Rotisserie Chicken"
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Category</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value as any)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-emerald-600"
                  >
                    <option value="Produce">Produce (Fruit/Veg)</option>
                    <option value="Bakery">Bakery & Breads</option>
                    <option value="Cooked Food">Prepared / Cooked Foods</option>
                    <option value="Dairy">Dairy Products</option>
                    <option value="Pantry">Pantry / Dry Goods</option>
                    <option value="Meat & Seafood">Meat & Seafood</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Stock Qty</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(Number(e.target.value))}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-emerald-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Unit</label>
                  <input
                    type="text"
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Avg Demand Forecast</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newItemForecast}
                    onChange={(e) => setNewItemForecast(Number(e.target.value))}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-emerald-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Storage Setup</label>
                  <select
                    value={newItemStorage}
                    onChange={(e) => setNewItemStorage(e.target.value as any)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-emerald-600"
                  >
                    <option value="Refrigerated">Refrigerated</option>
                    <option value="Frozen">Frozen / Deep-Freeze</option>
                    <option value="Pantry">Dry Pantry</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Acquisition Date</label>
                  <input
                    type="date"
                    required
                    value={newItemAcquired}
                    onChange={(e) => setNewItemAcquired(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-emerald-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Expiration / Safe-Use Limit</label>
                  <input
                    type="date"
                    required
                    value={newItemExp}
                    onChange={(e) => setNewItemExp(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-emerald-600 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Append Registry</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: ENVIRONMENTAL SENSORS & DYNAMIC PREDICTION REPORT (SPAN 5) */}
        <div className="lg:col-span-12 xl:col-span-5 space-y-6" id="context-prediction-panel">
          
          {/* Dynamic Sensors Configurations */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Dynamic Predictor Context Sensors</h3>
              <p className="text-xs text-slate-400">Configure exterior conditions to enhance AI forecast granularity.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center mb-1">
                  <CloudSun className="w-3.5 h-3.5 text-amber-500 mr-1.5" />
                  Local Meteorological Forecast
                </label>
                <input
                  type="text"
                  value={weatherContext}
                  onChange={(e) => setWeatherContext(e.target.value)}
                  placeholder="e.g. Mild winter frost, extreme summer humidity"
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center mb-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-500 mr-1.5" />
                  Schedules, Events & Calendar Impact
                </label>
                <input
                  type="text"
                  value={eventContext}
                  onChange={(e) => setEventContext(e.target.value)}
                  placeholder="e.g. Downtown construction roadblock, major sports parade nearby"
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-emerald-600"
                />
              </div>
            </div>

            {/* BIG TRIGGER CTA */}
            <button
              onClick={() => runPredictions(weatherContext, eventContext)}
              disabled={isPredicting || inventory.length === 0}
              className={`w-full font-bold text-xs py-3.5 rounded-2xl transition flex items-center justify-center space-x-2 ${
                isPredicting 
                  ? "bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed" 
                  : inventory.length === 0
                    ? "bg-slate-50 border border-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              }`}
            >
              <Sparkles className={`w-4 h-4 ${isPredicting ? "animate-spin" : ""}`} />
              <span>{isPredicting ? "Calculating AI Risk Probabilities..." : "🔮 Run ML Food Waste Forecaster"}</span>
            </button>
          </div>

          {/* AI Predictor Report Output */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm mb-4">Gemini ML Spoilage & Risk Report</h3>

            {isPredicting ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-emerald-600 rounded-full animate-spin mx-auto" />
                <div className="space-y-1">
                  <p className="font-bold text-sm text-slate-700">Analysing degradation mechanics...</p>
                  <p className="text-xs text-slate-400">Comparing expirations against demand calendars using Gemini 3.5 Flash.</p>
                </div>
              </div>
            ) : Object.keys(predictions).length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 px-4">
                <AlertTriangle className="w-10 h-10 text-slate-300 mb-2 animate-bounce" />
                <p className="text-sm font-semibold">No Waste Forecast Run Yet</p>
                <p className="text-[11px] text-center">Click the button above to estimate critical shelf-life coordinates and dollar risks.</p>
              </div>
            ) : (
              <div className="space-y-6 max-h-[500px] overflow-y-auto pr-1" id="prediction-cards-container">
                {inventory.map((item) => {
                  const pred = predictions[item.id];
                  if (!pred) return null;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="border border-slate-100/90 rounded-2xl p-4 bg-slate-50/40 space-y-3"
                    >
                      {/* Title Header with Probability */}
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{pred.itemName}</h4>
                          <span className="text-[10px] text-slate-400 font-mono">SKU ID: {pred.itemId}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getRiskColor(pred.surplusProbability)}`}>
                          {getRiskStatusText(pred.surplusProbability)} ({pred.surplusProbability}%)
                        </span>
                      </div>

                      {/* Bar indicator */}
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            pred.surplusProbability >= 75 
                              ? "bg-red-500" 
                              : pred.surplusProbability >= 40 
                                ? "bg-amber-500" 
                                : "bg-emerald-500"
                          }`}
                          style={{ width: `${pred.surplusProbability}%` }}
                        />
                      </div>

                      {/* Primary Metrics */}
                      <div className="grid grid-cols-3 gap-2 text-center bg-white/70 rounded-xl p-2.5 border border-slate-100 font-mono text-[11px]">
                        <div className="space-y-0.5">
                          <span className="text-slate-400 text-[9px] block">EST WASTE</span>
                          <span className="text-slate-700 font-bold block">{pred.estimatedWasteLbs.toFixed(1)} Lbs</span>
                        </div>
                        <div className="space-y-0.5 border-l border-r border-slate-100">
                          <span className="text-slate-400 text-[9px] block">VALUE RISK</span>
                          <span className="text-red-600 font-bold block">${pred.wasteCostEstimate.toFixed(2)}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-slate-400 text-[9px] block">SHELF LIFE</span>
                          <span className="text-emerald-600 font-bold block flex items-center justify-center">
                            <Hourglass className="w-3 h-3 mr-0.5 shrink-0" />
                            {pred.shelfLifeRemainingDays} Days
                          </span>
                        </div>
                      </div>

                      {/* Primary Driver */}
                      <div className="text-[11px] text-slate-600 leading-relaxed bg-amber-50/40 p-2.5 border border-amber-100/50 rounded-xl">
                        <strong className="text-amber-800">Risk Driver:</strong> {pred.primaryDriver}
                      </div>

                      {/* Action items & redirection button */}
                      <div className="space-y-2">
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">AI Mitigation Steps</p>
                        <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside">
                          {pred.actionRecommendations.map((rec, i) => (
                            <li key={i}>{rec}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Mitigate action triggers redirection list */}
                      {pred.surplusProbability >= 30 && (
                        <button
                          type="button"
                          onClick={() => onQuickLinkToRescue(item, pred)}
                          className="w-full text-[11px] font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 py-1.5 rounded-xl transition flex items-center justify-center space-x-1"
                        >
                          <span>List on Redistribution Desk</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
