import React, { useState, useEffect } from "react";
import { RescueListing, CharityProfile } from "../types";
import { 
  Heart, 
  MapPin, 
  ShieldAlert, 
  Sparkles, 
  Truck, 
  CheckCircle2, 
  AlertCircle, 
  Navigation,
  ThumbsUp,
  TrendingUp,
  Clock,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface RedistributionHubProps {
  charities: CharityProfile[];
  addNewRescue: (listing: RescueListing) => void;
  quickLinkListing: Partial<RescueListing> | null;
  clearQuickLink: () => void;
  notifyMessage: string | null;
  setNotifyMessage: (msg: string | null) => void;
}

interface MatchResult {
  charityId: string;
  matchScore: number;
  suitabilityReason: string;
  transportRequirement: string;
}

export default function RedistributionHub({
  charities,
  addNewRescue,
  quickLinkListing,
  clearQuickLink,
  notifyMessage,
  setNotifyMessage
}: RedistributionHubProps) {
  // Donation Fields Form
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState(50);
  const [unit, setUnit] = useState("Lbs");
  const [category, setCategory] = useState("Produce");
  const [donorName, setDonorName] = useState("Urban Foods Market");
  const [donorAddress, setDonorAddress] = useState("890 Broadway Blvd, Downtown");
  const [urgencyHours, setUrgencyHours] = useState(6);
  const [notes, setNotes] = useState("");

  // Matching algorithm state
  const [isMatching, setIsMatching] = useState(false);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [selectedCharity, setSelectedCharity] = useState<CharityProfile | null>(null);
  const [selectedMatchScore, setSelectedMatchScore] = useState<number | null>(null);

  // If a listing comes in from the Quick Link predictor, populate it immediately
  useEffect(() => {
    if (quickLinkListing) {
      setItemName(quickLinkListing.itemName || "");
      setQuantity(quickLinkListing.quantity || 10);
      setUnit(quickLinkListing.unit || "Lbs");
      setCategory(quickLinkListing.category || "Produce");
      if (quickLinkListing.notes) {
        setNotes(quickLinkListing.notes);
      } else {
        setNotes("AI Surplus Redirect recommendation.");
      }
      // Reset matches when quick link loads
      setMatchResults([]);
      setSelectedCharity(null);
    }
  }, [quickLinkListing]);

  // Call the server matched-charity logistics API
  const handleCalculateMatch = async () => {
    if (!itemName) return;
    setIsMatching(true);

    try {
      const listingPayload = {
        itemName,
        quantity,
        unit,
        category,
        urgencyHours,
        notes
      };

      const response = await fetch("/api/match-charities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing: listingPayload })
      });

      const data = await response.json();
      if (data.success && data.matches) {
        // Sort highest matching score first
        const sorted = data.matches.sort((a: MatchResult, b: MatchResult) => b.matchScore - a.matchScore);
        setMatchResults(sorted);

        // Pre-select the top match
        const topMatch = sorted[0];
        if (topMatch) {
          const mainCharityInfo = charities.find(c => c.id === topMatch.charityId);
          if (mainCharityInfo) {
            setSelectedCharity(mainCharityInfo);
            setSelectedMatchScore(topMatch.matchScore);
          }
        }
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err: any) {
      console.error(err);
      alert("Failed connection to matching service. Please check server.");
    } finally {
      setIsMatching(false);
    }
  };

  const handleCreateRescue = () => {
    if (!itemName) return;
    if (!selectedCharity) {
      alert("Please evaluate matching and select a recipient hunger shelter.");
      return;
    }

    const newRescue: RescueListing = {
      id: "rescue_" + Date.now(),
      itemName,
      quantity,
      unit,
      category,
      donorName,
      donorAddress,
      donorCoordinates: [37.7749, -122.4194],
      matchedCharityId: selectedCharity.id,
      matchedCharityName: selectedCharity.name,
      matchedCharityAddress: selectedCharity.address,
      matchedCharityCoordinates: [selectedCharity.lat, selectedCharity.lng],
      status: "Matched",
      pickupDeadline: new Date(Date.now() + urgencyHours * 3600 * 1000).toISOString(),
      urgencyHours,
      estimatedCO2SavingsKg: quantity * (category === "Meat & Seafood" ? 1.8 : category === "Cooked Food" ? 1.2 : 0.45),
      notes: notes || "Standard dispatch."
    };

    addNewRescue(newRescue);

    // Reset Form
    setItemName("");
    setNotes("");
    setMatchResults([]);
    setSelectedCharity(null);
    clearQuickLink();

    setNotifyMessage(`Redirect match dispatch created. Transferred to tracking!`);
    setTimeout(() => setNotifyMessage(null), 4000);
  };

  const currentMatchDetails = matchResults.find(m => m.charityId === selectedCharity?.id);

  return (
    <div className="space-y-6" id="redistribution-hub-tab">
      
      {/* Local interactive status toasts */}
      <AnimatePresence>
        {notifyMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs font-semibold flex items-center shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4 text-blue-600 mr-2 shrink-0 animate-bounce" />
            {notifyMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="redistribution-hub-grid">
        
        {/* LEFT COMPILER: DONATION BUILDER PANEL (SPAN 5) */}
        <div className="lg:col-span-5 space-y-6" id="donation-builder-column">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <div className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-red-500 fill-red-500 animate-pulse" />
                <h3 className="font-bold text-slate-800 text-base">Surplus Donation Dispatch</h3>
              </div>
              <p className="text-xs text-slate-400">Compile leftovers for real-time donor-to-shelter allocation.</p>
            </div>

            {quickLinkListing && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between">
                <span>Loaded from ML Predictor Link!</span>
                <button 
                  onClick={clearQuickLink}
                  className="font-bold text-[10px] underline cursor-pointer text-emerald-600 uppercase hover:text-emerald-800"
                >
                  Clear Link
                </button>
              </div>
            )}

            <div className="space-y-3 font-medium text-xs text-slate-600 text-left">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Item Title / Batch Desc</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 50 Servings Prime Rib and Rice"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-emerald-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Unit</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-emerald-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-emerald-600"
                >
                  <option value="Produce">Produce (Fruit/Veg)</option>
                  <option value="Bakery">Bakery & Breads</option>
                  <option value="Cooked Food">Prepared / Cooked Foods</option>
                  <option value="Dairy">Dairy Products</option>
                  <option value="Pantry">Pantry / Dry Goods</option>
                  <option value="Meat & Seafood">Meat & Seafood</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Donor Name</label>
                  <input
                    type="text"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Safe-Use Clock (Hours)</label>
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={urgencyHours}
                    onChange={(e) => setUrgencyHours(Number(e.target.value))}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-emerald-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Collection Address</label>
                <input
                  type="text"
                  value={donorAddress}
                  onChange={(e) => setDonorAddress(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Handling Notes / Pack Guidelines</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Need coolers, allergy codes: contains peanuts, etc."
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-emerald-600 h-16 resize-none"
                />
              </div>
            </div>

            {/* AI MATCH INITIATOR CARD */}
            <button
              onClick={handleCalculateMatch}
              disabled={isMatching || !itemName}
              className={`w-full font-bold text-xs py-3.5 rounded-2xl transition flex items-center justify-center space-x-2 ${
                !itemName
                  ? "bg-slate-50 text-slate-400 border border-slate-100 cursor-not-allowed"
                  : isMatching
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed border"
                    : "bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
              }`}
            >
              <Sparkles className={`w-4 h-4 ${isMatching ? "animate-spin text-amber-500" : ""}`} />
              <span>{isMatching ? "Running Gemini Optimization Matching..." : "Evaluate Optimal Charity Match"}</span>
            </button>
          </div>
        </div>

        {/* RIGHT SYSTEM: RECOMMENDATIONS VIEW & MATCH SELECTOR (SPAN 7) */}
        <div className="lg:col-span-7 space-y-6" id="match-results-column">
          
          {/* Section: Match List */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[500px]">
            <div>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Charity Network Compatibility Matrix</h3>
                  <p className="text-xs text-slate-400">Match score calculates distance, capacity alignment, and category requirements.</p>
                </div>
                <span className="text-xs font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 border border-indigo-100 rounded">
                  {charities.length} Recipient Outlets
                </span>
              </div>

              {isMatching ? (
                <div className="text-center py-20 space-y-3">
                  <div className="w-10 h-10 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-400">Computing distance coordinates & hunger urgent factors via Gemini system...</p>
                </div>
              ) : matchResults.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-slate-100 rounded-2xl p-4 text-slate-400 flex flex-col items-center">
                  <Navigation className="w-10 h-10 text-slate-300 mb-2 animate-pulse" />
                  <p className="text-sm font-semibold">No Charity Matrix Compiled</p>
                  <p className="text-xs max-w-sm mx-auto text-center mt-1">Configure your surplus logistics dispatch on the left panel, then trigger matching calculation to evaluate nearby soup kitchens and distribution panels.</p>
                </div>
              ) : (
                <div className="space-y-3.5" id="charity-matches-list">
                  {matchResults.map((match) => {
                    const ch = charities.find(c => c.id === match.charityId);
                    if (!ch) return null;

                    const isChosen = selectedCharity?.id === ch.id;

                    return (
                      <motion.div
                        key={ch.id}
                        onClick={() => {
                          setSelectedCharity(ch);
                          setSelectedMatchScore(match.matchScore);
                        }}
                        whileHover={{ y: -1 }}
                        className={`border rounded-2xl p-4 cursor-pointer transition flex justify-between items-center ${
                          isChosen 
                            ? "bg-slate-50/80 border-slate-900 shadow-sm" 
                            : "bg-white border-slate-100 hover:border-slate-300"
                        }`}
                        id={`charity-item-${ch.id}`}
                      >
                        <div className="space-y-1.5 flex-1 pr-4">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-bold text-slate-800 text-sm">{ch.name}</h4>
                            <span className="text-[9px] bg-slate-100 text-slate-600 font-mono px-1.5 py-0.5 rounded uppercase">
                              {ch.type}
                            </span>
                            {ch.urgencyLevel === "High" && (
                              <span className="text-[8px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded-full uppercase">
                                High Demand
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-400 flex items-center">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 mr-1" />
                            {ch.address} • <strong className="text-slate-600 ml-1">{ch.distanceMiles} miles</strong>
                          </p>

                          <p className="text-[11px] text-slate-600 italic">
                            "{match.suitabilityReason}"
                          </p>
                        </div>

                        {/* Match Indicator Badge (0-100) */}
                        <div className="text-center shrink-0">
                          <div className={`w-14 h-14 rounded-full flex flex-col justify-center items-center font-mono ${
                            match.matchScore >= 80 
                              ? "bg-emerald-50 text-emerald-700 border-2 border-emerald-500"
                              : match.matchScore >= 50
                                ? "bg-amber-50 text-amber-700 border-2 border-amber-500"
                                : "bg-red-50 text-red-700 border-2 border-red-500"
                          }`}>
                            <span className="text-sm font-bold block">{match.matchScore}</span>
                            <span className="text-[8px] block -mt-1 uppercase">Score</span>
                          </div>
                          {isChosen && (
                            <span className="text-[10px] text-slate-900 font-bold block mt-1">SELECTED</span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom active hauler recommendation and checkout button */}
            {selectedCharity && currentMatchDetails && (
              <div className="border-t border-slate-100 pt-5 mt-6 space-y-4" id="matched-accept-block">
                <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between">
                  <div className="space-y-1 text-left text-xs text-slate-600">
                    <p className="font-bold text-slate-800 flex items-center">
                      <Truck className="w-4 h-4 text-purple-600 mr-1.5 shrink-0" />
                      Dynamic Hauler Directives (Gemini Safety Recommendation)
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      {currentMatchDetails.transportRequirement}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Donor to Charity Distance: <strong className="text-slate-500">~{selectedCharity.distanceMiles} miles</strong> • Urgency limit: <strong className="text-slate-500">{urgencyHours} hours</strong>
                    </p>
                  </div>
                  <div className="text-right pl-4">
                    <span className="text-[9px] uppercase tracking-wider block font-bold text-slate-400">Est Carbon offset</span>
                    <span className="text-emerald-600 font-bold font-mono text-base block">
                     +{(quantity * (category === "Meat & Seafood" ? 1.8 : category === "Cooked Food" ? 1.2 : 0.45)).toFixed(1)} kg CO2e
                    </span>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setSelectedCharity(null);
                      setMatchResults([]);
                    }}
                    className="bg-slate-100 text-slate-600 font-bold text-xs px-5 py-3 rounded-xl hover:bg-slate-200 transition"
                  >
                    Reset
                  </button>
                  <button
                    onClick={handleCreateRescue}
                    className="bg-emerald-600 text-white font-bold text-xs px-6 py-3 rounded-xl hover:bg-emerald-700 transition flex items-center space-x-1 shadow-sm"
                  >
                    <span>Match & Initiate Shipped Dispatch</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
