import React from "react";
import { RescueListing, ImpactStats } from "../types";
import { 
  ShieldAlert, 
  Leaf, 
  Soup, 
  Truck, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight,
  TrendingUp,
  Package,
  Calendar,
  Layers
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DashboardProps {
  rescues: RescueListing[];
  stats: ImpactStats;
  updateRescueStatus: (id: string, nextStatus: RescueListing['status']) => void;
}

export default function Dashboard({ rescues, stats, updateRescueStatus }: DashboardProps) {
  // Color mapping based on status
  const getStatusStyle = (status: RescueListing['status']) => {
    switch (status) {
      case "Available":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Matched":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "In Transit":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Completed":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: RescueListing['status']) => {
    switch (status) {
      case "Available":
        return <AlertTriangle className="w-4 h-4 text-amber-600 mr-1 animate-pulse" />;
      case "Matched":
        return <Clock className="w-4 h-4 text-blue-600 mr-1" />;
      case "In Transit":
        return <Truck className="w-4 h-4 text-purple-600 mr-1 animate-bounce" />;
      case "Completed":
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-1" />;
    }
  };

  return (
    <div className="space-y-6" id="dashboard-tab">
      {/* 1. KEY IMPACT TELETETRY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="telemetry-grid">
        {/* Total rescued */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center justify-between"
          id="stat-rescued-lbs"
        >
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-medium tracking-wide uppercase">Surplus Rescued</span>
            <div className="flex items-baseline space-x-1">
              <span className="text-3xl font-bold font-mono text-slate-800">
                {stats.totalRescuedLbs.toLocaleString()}
              </span>
              <span className="text-slate-500 font-medium text-sm">lbs</span>
            </div>
            <div className="flex items-center text-emerald-600 text-[11px] font-semibold mt-1">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
              <span>+{(stats.wasteConversionRate).toFixed(1)}% diversion rate</span>
            </div>
          </div>
          <div className="p-3.5 bg-emerald-50 rounded-xl text-emerald-600">
            <Package className="w-6 h-6" />
          </div>
        </motion.div>

        {/* Carbon Offset */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center justify-between"
          id="stat-co2"
        >
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-medium tracking-wide uppercase">CO₂ Offset equivalent</span>
            <div className="flex items-baseline space-x-1">
              <span className="text-3xl font-bold font-mono text-emerald-700">
                {stats.co2SavedKgs.toLocaleString()}
              </span>
              <span className="text-emerald-600 font-medium text-sm">kg</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Prevents methane from landfills</p>
          </div>
          <div className="p-3.5 bg-emerald-100 rounded-xl text-emerald-700">
            <Leaf className="w-6 h-6" />
          </div>
        </motion.div>

        {/* Meals provided */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center justify-between"
          id="stat-meals"
        >
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-medium tracking-wide uppercase">Hunger-relief meals</span>
            <div className="flex items-baseline space-x-1">
              <span className="text-3xl font-bold font-mono text-blue-800">
                {stats.mealsProvided.toLocaleString()}
              </span>
              <span className="text-blue-500 font-medium text-sm">meals</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Based on 1.2 lbs per meal ratio</p>
          </div>
          <div className="p-3.5 bg-blue-50 rounded-xl text-blue-700">
            <Soup className="w-6 h-6" />
          </div>
        </motion.div>

        {/* Active Logistics Rescues */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center justify-between"
          id="stat-active"
        >
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-medium tracking-wide uppercase">Active Transfers</span>
            <div className="flex items-baseline space-x-1">
              <span className="text-3xl font-bold font-mono text-purple-800">
                {stats.activeRescues}
              </span>
              <span className="text-purple-500 font-medium text-sm">dispatches</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Awaiting or in logistics legs</p>
          </div>
          <div className="p-3.5 bg-purple-50 rounded-xl text-purple-700">
            <Truck className="w-6 h-6 animate-pulse" />
          </div>
        </motion.div>
      </div>

      {/* 2. DUAL LAYOUT: SIMULATED MAP FLOW + DETAILED ACTIVE DISPATCHES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dispatch-details-block">
        
        {/* LEFT COLUMN: ACTIVE DISPATCH LISTING WORKSPACE */}
        <div className="lg:col-span-7 space-y-4" id="active-dispatches-column">
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-0.5">
                <h3 className="font-bold text-slate-800 text-lg flex items-center">
                  <Layers className="w-5 h-5 text-emerald-600 mr-2" />
                  Redistribution Logistics Desk
                </h3>
                <p className="text-xs text-slate-400">Manage real-time transport logs and food donations rescue dispatches.</p>
              </div>
              <span className="text-xs font-mono bg-slate-50 text-slate-500 border border-slate-100 px-2 py-1 rounded">
                Live Feeds
              </span>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1" id="custom-rescue-scroll">
              <AnimatePresence initial={false}>
                {rescues.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <CheckCircle2 className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-medium">No active rescues posted yet.</p>
                    <p className="text-xs">Go to "Surplus Predictor" or "Redistribution Hub" to list leftovers.</p>
                  </div>
                ) : (
                  rescues.map((rescue) => (
                    <motion.div
                      key={rescue.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50 transition"
                      id={`rescue-card-${rescue.id}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-bold text-slate-800 text-sm">{rescue.itemName}</h4>
                            <span className="text-xs bg-emerald-50 text-emerald-700 font-mono px-1.5 py-0.5 rounded font-medium">
                              {rescue.quantity} {rescue.unit}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">Categorized: <span className="font-medium text-slate-600">{rescue.category}</span></p>
                        </div>
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border flex items-center ${getStatusStyle(rescue.status)}`}>
                          {getStatusIcon(rescue.status)}
                          {rescue.status}
                        </span>
                      </div>

                      {/* Donor & Recipient Addresses */}
                      <div className="my-3 space-y-2 border-t border-b border-slate-100/80 py-2.5 text-xs text-slate-600">
                        <div className="flex items-center">
                          <MapPin className="w-3.5 h-3.5 text-emerald-500 mr-2 shrink-0" />
                          <span className="truncate">Donor: <strong className="text-slate-700">{rescue.donorName}</strong> ({rescue.donorAddress})</span>
                        </div>
                        {rescue.matchedCharityName ? (
                          <div className="flex items-center">
                            <ArrowRight className="w-3 h-3 text-slate-400 ml-0.5 mr-2 shrink-0" />
                            <MapPin className="w-3.5 h-3.5 text-blue-500 mr-2 shrink-0" />
                            <span className="truncate">Recipient: <strong className="text-slate-700">{rescue.matchedCharityName}</strong> ({rescue.matchedCharityAddress})</span>
                          </div>
                        ) : (
                          <div className="flex items-center pl-0.5">
                            <ArrowRight className="w-3 h-3 text-slate-400 mr-2 shrink-0" />
                            <span className="text-[11px] bg-amber-50 text-amber-700 border border-amber-100 rounded px-1.5 py-0.5 flex items-center">
                              <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                              Unmatched surplus — pending local charity assignment.
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Metadata row with dynamic buttons */}
                      <div className="flex items-center justify-between mt-2 pt-1 text-xs">
                        <div className="flex items-center text-slate-400 font-medium">
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          <span className="font-mono">Deadline: {new Date(rescue.pickupDeadline).toLocaleTimeString()}</span>
                        </div>

                        {/* Interactive state transitions */}
                        <div className="flex space-x-1.5" id={`actions-${rescue.id}`}>
                          {rescue.status === "Available" && (
                            <span className="text-xs text-slate-400 font-medium italic">
                              Awaiting matching
                            </span>
                          )}
                          {rescue.status === "Matched" && (
                            <button
                              onClick={() => updateRescueStatus(rescue.id, "In Transit")}
                              className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-3 py-1 rounded-lg text-xs transition flex items-center"
                            >
                              <Truck className="w-3.5 h-3.5 mr-1" />
                              Ship Order
                            </button>
                          )}
                          {rescue.status === "In Transit" && (
                            <button
                              onClick={() => updateRescueStatus(rescue.id, "Completed")}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-3 py-1 rounded-lg text-xs transition flex items-center animate-pulse"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              Confirm Delivery
                            </button>
                          )}
                          {rescue.status === "Completed" && (
                            <span className="text-emerald-600 font-semibold text-xs flex items-center">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1 bg-emerald-50 rounded" />
                              Lbs Safeguarded
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CONCEPTUAL DIRECT HYBRID VEHICLE MATRIX FIELD */}
        <div className="lg:col-span-5 space-y-4" id="simulated-flows-column">
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs h-full flex flex-col">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide mb-3 flex items-center">
              <Truck className="w-4.5 h-4.5 text-purple-600 mr-2" />
              Dynamic Routing Dispatch Map
            </h3>
            
            <p className="text-xs text-slate-400 mb-4">
              Real-time visualization of matched surplus items traveling from local donors to food shelters.
            </p>

            <div className="flex-1 min-h-[300px] border border-slate-100 bg-slate-900 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden font-mono text-[10px]">
              {/* Overlay lines and grid backing */}
              <div className="absolute inset-0 bg-transparent pointer-events-none opacity-5 leading-none">
                {Array.from({ length: 15 }).map((_, i) => (
                  <div key={i} className="border-b border-white w-full h-[20px]" />
                ))}
              </div>

              {/* Status Header */}
              <div className="flex justify-between items-center text-slate-400 uppercase tracking-widest text-[9px] relative z-10 border-b border-slate-800 pb-2">
                <span>SIMULATION_RADAR_ACTIVE</span>
                <span className="text-emerald-400 flex items-center animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5" />
                  GRID_OK
                </span>
              </div>

              {/* Real-time flowing paths */}
              <div className="space-y-4 my-auto relative z-10 py-4 max-h-[320px] overflow-y-auto" id="custom-grid-radar">
                {rescues.filter(r => r.status === "Matched" || r.status === "In Transit").length === 0 ? (
                  <div className="text-center py-12 text-slate-500 space-y-1">
                    <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                      🛰️
                    </div>
                    <p className="font-semibold text-slate-400">No active dispatches on map.</p>
                    <p className="text-[9px] text-slate-600">Assign a charity match in "Redistribution Hub" to initiate dispatch.</p>
                  </div>
                ) : (
                  rescues.filter(r => r.status === "Matched" || r.status === "In Transit").map((dispatch, idx) => (
                    <div key={dispatch.id} className="border border-slate-800/80 bg-slate-950 p-3 rounded-lg space-y-2">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-white font-bold">{dispatch.itemName}</span>
                        <span className={dispatch.status === "In Transit" ? "text-purple-400 animate-pulse" : "text-blue-400"}>
                          {dispatch.status.toUpperCase()}
                        </span>
                      </div>

                      {/* Route flow line using CSS flex and indicators */}
                      <div className="flex items-center justify-between py-1 px-1">
                        <div className="flex flex-col items-start space-y-0.5">
                          <span className="text-slate-400 text-[8px]">DONOR</span>
                          <span className="text-[9px] text-slate-300 truncate w-[100px] text-left block">{dispatch.donorName}</span>
                        </div>

                        {/* Animated flow track */}
                        <div className="flex-1 mx-2 relative flex items-center justify-center">
                          <div className="w-full h-[2px] bg-slate-800 relative">
                            <motion.div 
                              initial={{ left: "0%" }}
                              animate={dispatch.status === "In Transit" ? { left: ["0%", "100%"] } : { left: "40%" }}
                              transition={dispatch.status === "In Transit" ? { repeat: Infinity, duration: 4, ease: "linear" } : { duration: 0.5 }}
                              className={`absolute -top-1 w-2.5 h-2.5 rounded-full flex items-center justify-center ${dispatch.status === "In Transit" ? "bg-purple-400 shadow-sm shadow-purple-500/80" : "bg-blue-400"}`}
                            >
                              <Truck className="w-1.5 h-1.5 text-slate-950" />
                            </motion.div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end space-y-0.5">
                          <span className="text-slate-400 text-[8px] text-right">RECIPIENT</span>
                          <span className="text-[9px] text-slate-300 truncate w-[100px] text-right block">{dispatch.matchedCharityName}</span>
                        </div>
                      </div>

                      {/* Details specs */}
                      <div className="flex justify-between items-center text-[9px] text-slate-500 border-t border-slate-900 pt-1.5">
                        <span>CO2 SAVED: <strong className="text-emerald-500">{dispatch.estimatedCO2SavingsKg.toFixed(1)} KG</strong></span>
                        <span>DIST: ~2.3 MI</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Status Footer */}
              <div className="border-t border-slate-800 pt-2 text-[8px] text-slate-500 flex justify-between uppercase">
                <span>COORD_REF: EPSG:4326</span>
                <span className="font-mono text-slate-400">Total Active carbon offset: {stats.co2SavedKgs.toFixed(1)}kg CO2e</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
