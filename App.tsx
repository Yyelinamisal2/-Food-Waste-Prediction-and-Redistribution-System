import React, { useState, useEffect } from "react";
import Dashboard from "./components/Dashboard";
import SurplusPredictor from "./components/SurplusPredictor";
import RedistributionHub from "./components/RedistributionHub";
import AIAdvisorChat from "./components/AIAdvisorChat";
import { DEFAULT_INVENTORY_ITEMS, INITIAL_RESCUES } from "./mockData";
import { InventoryItem, PredictionResult, RescueListing, CharityProfile, ChatMessage, ImpactStats } from "./types";
import { 
  Layers, 
  Sparkles, 
  Truck, 
  Bot, 
  HelpCircle, 
  CheckCircle,
  AlertTriangle,
  ArrowRight
} from "lucide-react";
import { motion } from "motion/react";

export default function App() {
  // Navigation tab switcher state
  const [activeTab, setActiveTab] = useState<"dashboard" | "predictions" | "redistribution" | "advisor">("dashboard");

  // Main system states
  const [inventory, setInventory] = useState<InventoryItem[]>(DEFAULT_INVENTORY_ITEMS);
  const [predictions, setPredictions] = useState<Record<string, PredictionResult>>({});
  const [rescues, setRescues] = useState<RescueListing[]>(INITIAL_RESCUES);
  const [charities, setCharities] = useState<CharityProfile[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  
  // Secondary utility states
  const [isPredicting, setIsPredicting] = useState(false);
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [quickLinkListing, setQuickLinkListing] = useState<Partial<RescueListing> | null>(null);
  
  // Status toast alerts
  const [predictorToast, setPredictorToast] = useState<string | null>(null);
  const [redistributeToast, setRedistributeToast] = useState<string | null>(null);

  // Fetch or initialize simulated charities
  useEffect(() => {
    const fetchCharities = async () => {
      try {
        const response = await fetch("/api/charities");
        const data = await response.json();
        if (data.success && data.charities) {
          setCharities(data.charities);
        }
      } catch (err) {
        console.warn("Retrying charity registry, falling back in-memory.");
        // local Fallback backup config
        setCharities([
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
        ]);
      }
    };
    fetchCharities();
  }, []);

  // Compute stats on-the-fly dynamically based on completed and matched rescues
  const getDynamicImpactStats = (): ImpactStats => {
    const completedListings = rescues.filter(r => r.status === "Completed");
    const totalRescuedLbs = completedListings.reduce((sum, current) => sum + current.quantity, 0) + 120; // adding baseline
    
    // Meals calculated at 1.2 lbs / meal ratio
    const mealsProvided = Math.round(totalRescuedLbs * 1.15);
    
    // Calculate total CO2 Saved. Each kg offset saved represents ~0.45kg per lb of Produce, ~1.8 per Meat
    const co2SavedKgs = rescues.reduce((sum, item) => {
      if (item.status === "Completed" || item.status === "In Transit") {
        return sum + item.estimatedCO2SavingsKg;
      }
      return sum;
    }, 45.5); // base score offset

    const activeRescues = rescues.filter(r => r.status === "Matched" || r.status === "In Transit").length;

    // Waste conversion percentage
    const predictedSum = Object.values(predictions).length || inventory.length;
    const wasteConversionRate = predictedSum > 0 ? (rescues.length / predictedSum) * 88.5 : 92.4;

    return {
      totalRescuedLbs,
      mealsProvided,
      co2SavedKgs,
      activeRescues,
      wasteConversionRate: Math.min(Math.max(wasteConversionRate, 40), 98)
    };
  };

  // Service Dispatch action: Run AI Risk Forecasting
  const handleRunAiPredictions = async (weather: string, event: string) => {
    setIsPredicting(true);
    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: inventory,
          weatherContext: weather,
          eventContext: event
        })
      });

      const data = await response.json();
      if (data.success && data.predictions) {
        // Convert to record dictionary mapped by itemId
        const record: Record<string, PredictionResult> = {};
        data.predictions.forEach((pred: PredictionResult) => {
          record[pred.itemId] = pred;
        });
        setPredictions(record);
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err: any) {
      console.error(err);
      alert("Met problem communicating with AI server: " + err.message);
    } finally {
      setIsPredicting(false);
    }
  };

  // Service Dispatch action: Quick link prediction card straight into redistribution form
  const handleQuickLinkToRescue = (item: InventoryItem, prediction?: PredictionResult) => {
    const recommendedHrs = prediction ? prediction.shelfLifeRemainingDays * 24 : 12;
    setQuickLinkListing({
      itemName: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      urgencyHours: Math.max(recommendedHrs, 4),
      notes: prediction 
        ? `ML RISK REDIRECTION: Forecasted surplus probability of ${prediction.surplusProbability}%. Primary driver: ${prediction.primaryDriver}`
        : "Expiring stock."
    });

    // Go directly to tab
    setActiveTab("redistribution");
  };

  // Service Dispatch action: Send chat query
  const handleSendChatToAdvisor = async (text: string) => {
    const userMsg: ChatMessage = {
      id: "msg_" + Date.now(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, userMsg]);
    setIsSendingChat(true);

    try {
      const response = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...chatMessages, userMsg],
          contextInventory: inventory
        })
      });

      const data = await response.json();
      if (data.success && data.text) {
        setChatMessages(prev => [
          ...prev, 
          {
            id: "msg_ai_" + Date.now(),
            role: "model",
            content: data.text,
            timestamp: new Date().toISOString()
          }
        ]);
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err: any) {
      console.error(err);
      setChatMessages(prev => [
        ...prev,
        {
          id: "msg_ai_err_" + Date.now(),
          role: "model",
          content: "Sorry, I can't look up that recipe right now as there was a network link failure. Please check if your GEMINI_API_KEY is configured under Settings > Secrets.",
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

  // Update real-time dispatches states
  const handleUpdateRescueStatus = (id: string, nextStatus: RescueListing['status']) => {
    setRescues(prev => 
      prev.map(item => {
        if (item.id === id) {
          return { ...item, status: nextStatus };
        }
        return item;
      })
    );
  };

  const handleAddNewRescue = (newRescue: RescueListing) => {
    setRescues(prev => [newRescue, ...prev]);
  };

  const currentTabName = () => {
    switch (activeTab) {
      case "dashboard": return "System Control Terminal";
      case "predictions": return "AI Spoilage Forecasting";
      case "redistribution": return "Charity Match Router";
      case "advisor": return "Culinary Advisor Chat";
    }
  };

  const currentStats = getDynamicImpactStats();

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden" id="applet-viewport">
      
      {/* 1. LEFT SIDEBAR NAVIGATION: "Geometric Balance Theme" */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0" id="sidebar-nav">
        
        {/* Branding section */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/10">
            <div className="w-4.5 h-4.5 bg-white rounded-sm rotate-45"></div>
          </div>
          <div>
            <span className="font-extrabold text-slate-800 text-lg tracking-tight block">ZeroWaste AI</span>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Food waste prediction</span>
          </div>
        </div>

        {/* Tab Links Menu */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full p-3.5 rounded-xl flex items-center gap-3 font-semibold text-xs transition cursor-pointer text-left ${
              activeTab === "dashboard"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-100/30"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            }`}
            id="nav-dashboard"
          >
            <Layers className={`w-4.5 h-4.5 ${activeTab === "dashboard" ? "text-emerald-700" : "text-slate-400"}`} />
            <span>Dashboard Control</span>
          </button>

          <button
            onClick={() => setActiveTab("predictions")}
            className={`w-full p-3.5 rounded-xl flex items-center gap-3 font-semibold text-xs transition cursor-pointer text-left ${
              activeTab === "predictions"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-100/30"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            }`}
            id="nav-predictions"
          >
            <Sparkles className={`w-4.5 h-4.5 ${activeTab === "predictions" ? "text-emerald-700" : "text-slate-400"}`} />
            <span>Waste Predictor</span>
          </button>

          <button
            onClick={() => setActiveTab("redistribution")}
            className={`w-full p-3.5 rounded-xl flex items-center gap-3 font-semibold text-xs transition cursor-pointer text-left ${
              activeTab === "redistribution"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-100/30"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            }`}
            id="nav-redistribution"
          >
            <Truck className={`w-4.5 h-4.5 ${activeTab === "redistribution" ? "text-emerald-700" : "text-slate-400"}`} />
            <span>Redistribution Hub</span>
          </button>

          <button
            onClick={() => setActiveTab("advisor")}
            className={`w-full p-3.5 rounded-xl flex items-center gap-3 font-semibold text-xs transition cursor-pointer text-left ${
              activeTab === "advisor"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-100/30"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            }`}
            id="nav-advisor"
          >
            <Bot className={`w-4.5 h-4.5 ${activeTab === "advisor" ? "text-emerald-700" : "text-slate-400"}`} />
            <span>AI Preservation Advisor</span>
          </button>
        </nav>

        {/* Sidebar Footer scorecard summary */}
        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-900 rounded-3xl p-5 text-white/95 relative overflow-hidden" id="sustainability-badge-card">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-gradient-to-br from-emerald-500 to-transparent rounded-full opacity-10 pointer-events-none" />
            <p className="text-[10px] text-slate-400 mb-1 font-bold tracking-wider uppercase">SHELTER DIVERSION INDEX</p>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl font-extrabold text-white">A+</span>
              <span className="text-xs text-emerald-400 font-bold">{(currentStats.wasteConversionRate).toFixed(1)}% Performance</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div 
                className="h-full bg-emerald-400 rounded-full" 
                style={{ width: `${currentStats.wasteConversionRate}%` }} 
              />
            </div>
          </div>
        </div>

      </aside>

      {/* 2. MAIN HUB WORKSPACE LAYOUT */}
      <main className="flex-1 flex flex-col min-w-0" id="main-content-area">
        
        {/* Dynamic header row matching height 20 px/80px */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0" id="top-header-panel">
          <div className="text-left">
            <h1 className="text-lg font-extrabold text-slate-800">{currentTabName()}</h1>
            <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase flex items-center">
              <span>Automated Monitoring</span>
              <span className="mx-1.5">•</span>
              <span className="font-mono text-slate-500">Live UTC Clock: 2026-05-23</span>
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Status Radar Indicator */}
            <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-205">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">AI Server Connection Active</span>
            </div>

            {/* Profile Avatar identifier */}
            <div className="w-10 h-10 bg-slate-900 shadow-sm border border-slate-800 rounded-full flex items-center justify-center font-extrabold text-xs text-white uppercase font-mono">
              SU
            </div>
          </div>
        </header>

        {/* Outer viewport pad */}
        <div className="p-8 flex-1 overflow-y-auto" id="terminal-screen-pad">
          
          {/* TAB CHASSIS VIEW ROUTING */}
          {activeTab === "dashboard" && (
            <Dashboard 
              rescues={rescues}
              stats={currentStats}
              updateRescueStatus={handleUpdateRescueStatus}
            />
          )}

          {activeTab === "predictions" && (
            <SurplusPredictor 
              inventory={inventory}
              predictions={predictions}
              setInventory={setInventory}
              runPredictions={handleRunAiPredictions}
              isPredicting={isPredicting}
              onQuickLinkToRescue={handleQuickLinkToRescue}
            />
          )}

          {activeTab === "redistribution" && (
            <RedistributionHub 
              charities={charities}
              addNewRescue={handleAddNewRescue}
              quickLinkListing={quickLinkListing}
              clearQuickLink={() => setQuickLinkListing(null)}
              notifyMessage={redistributeToast}
              setNotifyMessage={setRedistributeToast}
            />
          )}

          {activeTab === "advisor" && (
            <AIAdvisorChat 
              inventory={inventory}
              messages={chatMessages}
              sendMessage={handleSendChatToAdvisor}
              isSending={isSendingChat}
              clearChat={() => setChatMessages([])}
            />
          )}

        </div>

      </main>

    </div>
  );
}
