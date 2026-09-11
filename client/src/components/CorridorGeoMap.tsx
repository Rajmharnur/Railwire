import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Compass,
  ExternalLink,
  Filter,
  Globe,
  Key,
  Layers,
  MapPin,
  Maximize2,
  Minus,
  Navigation,
  Plus,
  Radio,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  Train,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  PRE_SEEDED_STATIONS,
  LIVE_GEO_TRAINS,
  NATIONAL_CORRIDORS,
  type GeoStation,
  type GeoTrain,
  type NationalCorridor,
  getStoredIndianRailApiKey,
  setStoredIndianRailApiKey,
  getStoredGoogleMapsApiKey,
  setStoredGoogleMapsApiKey,
  loadGoogleMapsScript,
  GOOGLE_MAPS_DARK_STYLE,
  fetchStationLocationFromApi,
} from "@/lib/indianRailApi";

declare const L: any;
declare const google: any;

interface CorridorGeoMapProps {
  corridorId?: string;
  selectedStationCode?: string;
  onSelectStation?: (station: GeoStation) => void;
  onSelectTrain?: (train: GeoTrain) => void;
}

export type GeoMapTheme = "googleSatellite" | "googleRoadmap" | "darkTelemetry" | "googleTerrain";

interface MapThemeConfig {
  id: GeoMapTheme;
  name: string;
  badge: string;
  url: string;
  subdomains?: string[];
  maxZoom: number;
  attribution: string;
}

export const MAP_THEMES: Record<GeoMapTheme, MapThemeConfig> = {
  googleSatellite: {
    id: "googleSatellite",
    name: "Google Satellite",
    badge: "🛰️ SATELLITE",
    url: "https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    subdomains: ["0", "1", "2", "3"],
    maxZoom: 20,
    attribution: "© Google Maps Satellite Hybrid",
  },
  googleRoadmap: {
    id: "googleRoadmap",
    name: "Google Roadmap",
    badge: "🗺️ ROADMAP",
    url: "https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    subdomains: ["0", "1", "2", "3"],
    maxZoom: 20,
    attribution: "© Google Maps",
  },
  darkTelemetry: {
    id: "darkTelemetry",
    name: "Dark Telemetry",
    badge: "🌙 DARK GIS",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    subdomains: undefined,
    maxZoom: 16,
    attribution: "© Esri World Dark Gray",
  },
  googleTerrain: {
    id: "googleTerrain",
    name: "Google Terrain",
    badge: "⛰️ TERRAIN",
    url: "https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}",
    subdomains: ["0", "1", "2", "3"],
    maxZoom: 20,
    attribution: "© Google Maps Terrain",
  },
};

export function CorridorGeoMap({
  corridorId: initialCorridorId,
  selectedStationCode,
  onSelectStation,
  onSelectTrain,
}: CorridorGeoMapProps) {
  // Map Basemap Theme ("googleSatellite" default - 100% free, no watermark, real Google satellite)
  const [mapTheme, setMapTheme] = useState<GeoMapTheme>("googleSatellite");
  const activeTileLayerRef = useRef<any>(null);

  // Map Engine & Provider state ("google" vs "leaflet")
  const [mapProvider, setMapProvider] = useState<"google" | "leaflet">("leaflet");
  const [googleMapType, setGoogleMapType] = useState<"roadmap" | "satellite" | "terrain">("roadmap");
  const [googleApiKey, setGoogleApiKey] = useState(getStoredGoogleMapsApiKey());
  const [showGoogleKeyModal, setShowGoogleKeyModal] = useState(false);
  const [googleKeyInput, setGoogleKeyInput] = useState(getStoredGoogleMapsApiKey());
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);

  // Active selected corridor filter ("ALL" means whole Pan-India network)
  const [activeCorridorId, setActiveCorridorId] = useState<string>("ALL");

  // Search query
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Selected item
  const [activeStation, setActiveStation] = useState<GeoStation | null>(null);
  const [activeTrain, setActiveTrain] = useState<GeoTrain | null>(null);

  // Filter layer toggles
  const [showTrains, setShowTrains] = useState(true);
  const [showStations, setShowStations] = useState(true);
  const [showCorridors, setShowCorridors] = useState(true);
  const [trainTypeFilter, setTrainTypeFilter] = useState<string>("ALL");

  // API Key modal (IndianRailAPI)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(getStoredIndianRailApiKey());
  const [apiTesting, setApiTesting] = useState(false);

  // Live stations & trains state
  const [stations, setStations] = useState<GeoStation[]>(PRE_SEEDED_STATIONS);
  const [trains] = useState<GeoTrain[]>(LIVE_GEO_TRAINS);

  // Leaflet Map DOM & instance refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const corridorsLayerRef = useRef<any>(null);
  const stationsLayerRef = useRef<any>(null);
  const trainsLayerRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  // Google Maps DOM & instance refs
  const googleMapContainerRef = useRef<HTMLDivElement | null>(null);
  const googleMapInstanceRef = useRef<any>(null);
  const googlePolylinesRef = useRef<any[]>([]);
  const googleStationMarkersRef = useRef<any[]>([]);
  const googleTrainMarkersRef = useRef<any[]>([]);

  // Corridors list
  const [corridorCategoryFilter, setCorridorCategoryFilter] = useState<"ALL" | "DFC" | "GQ">("ALL");

  const visibleCorridors = useMemo(() => {
    let list = NATIONAL_CORRIDORS;
    if (corridorCategoryFilter === "DFC") {
      list = list.filter((c) => c.type === "DEDICATED_FREIGHT");
    } else if (corridorCategoryFilter === "GQ") {
      list = list.filter((c) => c.type === "GOLDEN_QUADRILATERAL");
    }
    if (activeCorridorId !== "ALL") {
      return list.filter((c) => c.id === activeCorridorId);
    }
    return list;
  }, [activeCorridorId, corridorCategoryFilter]);

  const activeCorridor = useMemo(() => {
    if (activeCorridorId === "ALL") return null;
    return NATIONAL_CORRIDORS.find((c) => c.id === activeCorridorId) || null;
  }, [activeCorridorId]);

  // Filtered stations based on corridor
  const visibleStations = useMemo(() => {
    if (!showStations) return [];
    if (activeCorridorId === "ALL") return stations;
    const corr = NATIONAL_CORRIDORS.find((c) => c.id === activeCorridorId);
    if (!corr) return stations;
    return stations.filter(
      (s) => corr.stations.includes(s.code) || s.corridorId === activeCorridorId
    );
  }, [stations, activeCorridorId, showStations]);

  // Filtered trains
  const visibleTrains = useMemo(() => {
    if (!showTrains) return [];
    let list = trains;
    if (activeCorridorId !== "ALL") {
      list = list.filter((t) => t.corridorId === activeCorridorId);
    }
    if (trainTypeFilter !== "ALL") {
      list = list.filter((t) => t.type === trainTypeFilter);
    }
    return list;
  }, [trains, showTrains, activeCorridorId, trainTypeFilter]);

  // Search filter results across India
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { stations: [], trains: [], corridors: [] };

    const matchedStations = stations.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.state.toLowerCase().includes(q) ||
        s.division.toLowerCase().includes(q) ||
        s.zone.toLowerCase().includes(q)
    );

    const matchedTrains = trains.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.number.toLowerCase().includes(q) ||
        t.origin.toLowerCase().includes(q) ||
        t.destination.toLowerCase().includes(q)
    );

    const matchedCorridors = NATIONAL_CORRIDORS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
    );

    return {
      stations: matchedStations.slice(0, 8),
      trains: matchedTrains.slice(0, 8),
      corridors: matchedCorridors.slice(0, 4),
    };
  }, [searchQuery, stations, trains]);

  // Leaflet map initialization
  useEffect(() => {
    let checkInterval: any = null;

    const initMap = () => {
      if (!mapContainerRef.current || mapInstanceRef.current) return;
      if (typeof L === "undefined") return;

      try {
        // Center of India (Nagpur / Central India), zoom 5 covers Kashmir to Kanyakumari
        const map = L.map(mapContainerRef.current, {
          center: [22.3, 79.5],
          zoom: 5,
          minZoom: 4,
          maxZoom: 18,
          zoomControl: false,
          attributionControl: false,
        });

        // Layers
        corridorsLayerRef.current = L.layerGroup().addTo(map);
        stationsLayerRef.current = L.layerGroup().addTo(map);
        trainsLayerRef.current = L.layerGroup().addTo(map);

        mapInstanceRef.current = map;
        setMapReady(true);

        // Invalidate size once DOM settles
        setTimeout(() => {
          map.invalidateSize();
        }, 200);
      } catch (err) {
        console.error("Leaflet init error:", err);
      }
    };

    if (typeof L !== "undefined") {
      initMap();
    } else {
      checkInterval = setInterval(() => {
        if (typeof L !== "undefined") {
          clearInterval(checkInterval);
          initMap();
        }
      }, 100);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Dynamic Map Basemap Layer Switcher (Google Satellite, Google Roadmap, Dark Telemetry, Google Terrain)
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || typeof L === "undefined") return;

    if (activeTileLayerRef.current) {
      mapInstanceRef.current.removeLayer(activeTileLayerRef.current);
      activeTileLayerRef.current = null;
    }

    const theme = MAP_THEMES[mapTheme] || MAP_THEMES.googleSatellite;
    const tileOptions: any = {
      maxZoom: theme.maxZoom,
      attribution: theme.attribution,
    };
    if (theme.subdomains && theme.subdomains.length) {
      tileOptions.subdomains = theme.subdomains;
    }

    const newLayer = L.tileLayer(theme.url, tileOptions);
    newLayer.addTo(mapInstanceRef.current);
    newLayer.bringToBack();
    activeTileLayerRef.current = newLayer;
  }, [mapReady, mapTheme]);

  // Google Maps Initializer
  const initGoogleMap = useCallback(
    async (customKey?: string) => {
      const key = (customKey !== undefined ? customKey : googleApiKey || "").trim();
      if (!key) {
        setShowGoogleKeyModal(true);
        return false;
      }
      setGoogleLoading(true);
      try {
        const loaded = await loadGoogleMapsScript(key);
        if (!loaded || typeof google === "undefined" || !google.maps) {
          toast.error("Could not load Google Maps API", {
            description: "Check your API key and ensure 'Maps JavaScript API' is enabled in Google Cloud Console.",
          });
          setShowGoogleKeyModal(true);
          return false;
        }

        if (!googleMapInstanceRef.current && googleMapContainerRef.current) {
          const map = new google.maps.Map(googleMapContainerRef.current, {
            center: { lat: 22.3, lng: 79.5 },
            zoom: 5,
            minZoom: 4,
            maxZoom: 19,
            mapTypeId: googleMapType,
            styles: googleMapType === "roadmap" ? GOOGLE_MAPS_DARK_STYLE : undefined,
            disableDefaultUI: true,
            zoomControl: false,
            mapTypeControl: false,
            streetViewControl: false,
          });
          googleMapInstanceRef.current = map;
        }

        setGoogleReady(true);
        setMapProvider("google");
        setStoredGoogleMapsApiKey(key);
        setGoogleApiKey(key);
        toast.success("Google Maps API Active", {
          description: "Rendering Pan-India corridors, stations, and trains on Google Maps.",
        });
        return true;
      } catch (err) {
        console.error("Google Maps init error:", err);
        toast.error("Google Maps initialization failed");
        setShowGoogleKeyModal(true);
        return false;
      } finally {
        setGoogleLoading(false);
      }
    },
    [googleApiKey, googleMapType]
  );

  // Auto-init Google Maps if API key is already stored
  useEffect(() => {
    const stored = getStoredGoogleMapsApiKey();
    if (stored && !googleReady && !googleLoading) {
      initGoogleMap(stored);
    }
  }, []);

  // Sync Google Map Type changes
  useEffect(() => {
    if (googleMapInstanceRef.current && typeof google !== "undefined" && google.maps) {
      googleMapInstanceRef.current.setMapTypeId(googleMapType);
      if (googleMapType === "roadmap") {
        googleMapInstanceRef.current.setOptions({ styles: GOOGLE_MAPS_DARK_STYLE });
      } else {
        googleMapInstanceRef.current.setOptions({ styles: null });
      }
    }
  }, [googleMapType]);

  // Render Google Map Corridors
  useEffect(() => {
    if (mapProvider !== "google" || !googleMapInstanceRef.current || typeof google === "undefined" || !google.maps) return;

    googlePolylinesRef.current.forEach((p) => p.setMap(null));
    googlePolylinesRef.current = [];

    if (!showCorridors) return;

    visibleCorridors.forEach((corr) => {
      const corrStations = corr.stations
        .map((code) => stations.find((s) => s.code === code))
        .filter((s): s is GeoStation => s !== undefined);

      if (corrStations.length < 2) return;

      const path = corrStations.map((s) => ({ lat: s.lat, lng: s.lng }));
      let strokeColor = "#06b6d4";
      if (corr.type === "DEDICATED_FREIGHT") {
        if (corr.id === "DFC-EASTERN") strokeColor = "#10b981";
        else if (corr.id === "DFC-WESTERN") strokeColor = "#06b6d4";
        else if (corr.id === "DFC-EAST-WEST") strokeColor = "#f59e0b";
        else if (corr.id === "DFC-NORTH-SOUTH") strokeColor = "#a855f7";
        else if (corr.id === "DFC-EAST-COAST") strokeColor = "#0284c7";
        else if (corr.id === "DFC-EAST-WEST-DS") strokeColor = "#6366f1";
        else if (corr.id === "DFC-SOUTHERN") strokeColor = "#ec4899";
        else strokeColor = "#f59e0b";
      } else if (corr.type === "HIGH_SPEED_DEDICATED") {
        strokeColor = "#10b981";
      }

      const isSelected = activeCorridorId === corr.id;
      const polyline = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor,
        strokeOpacity: isSelected ? 1.0 : 0.8,
        strokeWeight: isSelected ? 5 : 3.5,
        map: googleMapInstanceRef.current,
      });

      polyline.addListener("click", () => {
        setActiveCorridorId(corr.id);
        setActiveStation(null);
        setActiveTrain(null);
        toast.info(`Focused Corridor: ${corr.name}`, {
          description: `${corr.lengthKm} KM · ${corr.status || "Operational"} · ${corr.startPoint || ""} → ${corr.terminationPoint || ""}`,
        });
      });

      googlePolylinesRef.current.push(polyline);
    });
  }, [mapProvider, googleReady, visibleCorridors, showCorridors, stations, activeCorridorId]);

  // Render Google Map Stations
  useEffect(() => {
    if (mapProvider !== "google" || !googleMapInstanceRef.current || typeof google === "undefined" || !google.maps) return;

    googleStationMarkersRef.current.forEach((m) => m.setMap(null));
    googleStationMarkersRef.current = [];

    if (!showStations) return;

    visibleStations.forEach((station) => {
      const isSelected = activeStation?.code === station.code;
      const isJunction = station.isJunction || station.platforms >= 8;

      const marker = new google.maps.Marker({
        position: { lat: station.lat, lng: station.lng },
        map: googleMapInstanceRef.current,
        title: `${station.name} (${station.code})`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: isSelected ? 7 : isJunction ? 5.5 : 4,
          fillColor: isSelected ? "#ffffff" : isJunction ? "#ef4444" : "#0284c7",
          fillOpacity: 0.95,
          strokeColor: isSelected ? "#22d3ee" : "#050b14",
          strokeWeight: isSelected ? 3 : 1.5,
        },
      });

      marker.addListener("click", () => {
        setActiveStation(station);
        setActiveTrain(null);
        if (onSelectStation) onSelectStation(station);
        googleMapInstanceRef.current.panTo({ lat: station.lat, lng: station.lng });
        toast.info(`Station: ${station.name} (${station.code})`, {
          description: `GPS: ${station.lat.toFixed(4)}°N, ${station.lng.toFixed(4)}°E · ${station.division} Div / ${station.zone}`,
        });
      });

      googleStationMarkersRef.current.push(marker);
    });
  }, [mapProvider, googleReady, visibleStations, showStations, activeStation, onSelectStation]);

  // Render Google Map Trains
  useEffect(() => {
    if (mapProvider !== "google" || !googleMapInstanceRef.current || typeof google === "undefined" || !google.maps) return;

    googleTrainMarkersRef.current.forEach((m) => m.setMap(null));
    googleTrainMarkersRef.current = [];

    if (!showTrains) return;

    visibleTrains.forEach((train) => {
      const isSelected = activeTrain?.number === train.number;
      const isFreight = train.type === "FREIGHT_CONTAINER";
      const color = isFreight ? "#f59e0b" : train.type === "VANDE_BHARAT" ? "#3b82f6" : "#10b981";

      const marker = new google.maps.Marker({
        position: { lat: train.lat, lng: train.lng },
        map: googleMapInstanceRef.current,
        title: `${train.number} - ${train.name} (${train.speedKmh} km/h)`,
        icon: {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: isSelected ? 6 : 4.5,
          rotation: train.headingDeg,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: isSelected ? "#22d3ee" : "#ffffff",
          strokeWeight: 1.5,
        },
      });

      marker.addListener("click", () => {
        setActiveTrain(train);
        setActiveStation(null);
        if (onSelectTrain) onSelectTrain(train);
        googleMapInstanceRef.current.panTo({ lat: train.lat, lng: train.lng });
        toast.success(`Tracking Train #${train.number} (${train.name})`, {
          description: `Speed: ${train.speedKmh} km/h · Approaching: ${train.nextStation}`,
        });
      });

      googleTrainMarkersRef.current.push(marker);
    });
  }, [mapProvider, googleReady, visibleTrains, showTrains, activeTrain, onSelectTrain]);

  // Update Corridors on Map
  useEffect(() => {
    if (!mapReady || !corridorsLayerRef.current || typeof L === "undefined") return;

    corridorsLayerRef.current.clearLayers();
    if (!showCorridors) return;

    visibleCorridors.forEach((corr) => {
      const corrStations = corr.stations
        .map((code) => stations.find((s) => s.code === code))
        .filter((s): s is GeoStation => s !== undefined);

      if (corrStations.length < 2) return;

      const latLngs = corrStations.map((s) => [s.lat, s.lng]);

      // Corridor color based on type
      let color = "#06b6d4"; // Electric Cyan (Golden Quad)
      let weight = 3;
      let dashArray: string | undefined = corr.electrified ? undefined : "6, 4";

      if (corr.type === "DEDICATED_FREIGHT") {
        color = corr.status === "Operational" ? "#f59e0b" : "#fbbf24"; // Heavy Freight Amber/Gold
        weight = 3.5;
        dashArray = corr.status === "Operational" ? undefined : "8, 5";
      } else if (corr.type === "HIGH_SPEED_DEDICATED") {
        color = "#10b981";
      } else if (corr.type === "COASTAL") {
        color = "#38bdf8";
      } else if (corr.type === "TRUNK") {
        color = "#a78bfa";
      }

      // Glow casing for track
      const casing = L.polyline(latLngs, {
        color: "#0a1324",
        weight: weight + 3,
        opacity: 0.9,
      });

      // Main railway track line
      const track = L.polyline(latLngs, {
        color,
        weight,
        opacity: 0.9,
        dashArray,
      });

      track.on("click", () => {
        setActiveCorridorId(corr.id);
        setActiveStation(null);
        setActiveTrain(null);
        toast.info(`Focused Corridor: ${corr.name}`, {
          description: `${corr.lengthKm} KM · ${corr.status || "Operational"} · ${corr.startPoint || ""} → ${corr.terminationPoint || ""}`,
        });
      });

      const statusBadge = corr.status
        ? `<span style="display:inline-block;padding:1px 5px;border-radius:4px;font-size:9px;background:${
            corr.status === "Operational" ? "#064e3b" : "#312e81"
          };color:${corr.status === "Operational" ? "#6ee7b7" : "#c7d2fe"};margin-left:4px">${corr.status}</span>`
        : "";

      const startTerm = corr.startPoint && corr.terminationPoint
        ? `<div style="font-size:9.5px;color:#94a3b8;margin-top:2px">${corr.startPoint} ➔ ${corr.terminationPoint}</div>`
        : "";

      const logistics = corr.logisticsHub
        ? `<div style="font-size:9px;color:#f59e0b;font-weight:bold;margin-top:2px">Logistics Hub: ${corr.logisticsHub}</div>`
        : "";

      track.bindTooltip(
        `<div style="font-family:monospace;font-size:11px;font-weight:bold;color:${color}">
          ${corr.code}: ${corr.name} (${corr.lengthKm} KM)
          ${statusBadge}
          ${startTerm}
          ${logistics}
        </div>`,
        { sticky: true, opacity: 0.95 }
      );

      corridorsLayerRef.current.addLayer(casing);
      corridorsLayerRef.current.addLayer(track);
    });
  }, [mapReady, visibleCorridors, stations, showCorridors]);

  // Update Stations on Map
  useEffect(() => {
    if (!mapReady || !stationsLayerRef.current || typeof L === "undefined") return;

    stationsLayerRef.current.clearLayers();
    if (!showStations) return;

    visibleStations.forEach((stn) => {
      const isSelected = activeStation?.code === stn.code;
      const isMajorHub = stn.isJunction || stn.platforms >= 8;
      const radius = isMajorHub ? 6 : 4.5;
      const fillColor = isMajorHub ? "#ef4444" : "#0284c7";
      const strokeColor = isSelected ? "#22d3ee" : "#ffffff";

      const marker = L.circleMarker([stn.lat, stn.lng], {
        radius,
        fillColor,
        color: strokeColor,
        weight: isSelected ? 3 : 1.5,
        fillOpacity: 0.95,
      });

      marker.bindTooltip(
        `<div style="font-family:sans-serif;font-size:11px;font-weight:700;color:#f8fafc">
          ${stn.name} <span style="color:#38bdf8;font-family:monospace">(${stn.code})</span>
          <div style="font-size:9.5px;color:#94a3b8;font-weight:normal">${stn.division} Div · ${stn.zone} · ${stn.platforms} PF</div>
        </div>`,
        { direction: "top", offset: [0, -6], opacity: 0.95 }
      );

      marker.on("click", () => {
        setActiveStation(stn);
        setActiveTrain(null);
        if (onSelectStation) onSelectStation(stn);
        toast.info(`Station: ${stn.name} (${stn.code})`, {
          description: `GPS: ${stn.lat.toFixed(4)}°N, ${stn.lng.toFixed(4)}°E · ${stn.division} Div / ${stn.zone}`,
        });
      });

      stationsLayerRef.current.addLayer(marker);
    });
  }, [mapReady, visibleStations, activeStation, onSelectStation, showStations]);

  // Update Trains on Map
  useEffect(() => {
    if (!mapReady || !trainsLayerRef.current || typeof L === "undefined") return;

    trainsLayerRef.current.clearLayers();
    if (!showTrains) return;

    visibleTrains.forEach((trn) => {
      const isSelected = activeTrain?.number === trn.number;
      const isVandeBharat = trn.type === "VANDE_BHARAT";
      const isRajdhani = trn.type === "RAJDHANI";
      const isGatimaan = trn.type === "SHATABDI_GATIMAAN";
      const isFreight = trn.type === "FREIGHT_CONTAINER";

      const badgeColor = isVandeBharat
        ? "#3b82f6"
        : isGatimaan || isRajdhani
        ? "#10b981"
        : isFreight
        ? "#f59e0b"
        : "#06b6d4";

      const html = `
        <div style="
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #070e1d;
          border: 1.5px solid ${isSelected ? "#22d3ee" : badgeColor};
          border-radius: 6px;
          padding: 2px 6px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.8);
          font-family: monospace;
          font-size: 10px;
          font-weight: bold;
          color: ${badgeColor};
          white-space: nowrap;
          cursor: pointer;
        ">
          <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${badgeColor}"></span>
          <span>#${trn.number}</span>
          <span style="color:#94a3b8;font-size:9px">${trn.speedKmh}k</span>
        </div>
      `;

      const icon = L.divIcon({
        html,
        className: "custom-rail-train-icon",
        iconAnchor: [32, 12],
      });

      const marker = L.marker([trn.lat, trn.lng], { icon });

      marker.bindTooltip(
        `<div style="font-family:sans-serif;font-size:11px;font-weight:700;color:#f8fafc">
          #${trn.number} ${trn.name}
          <div style="font-size:9.5px;color:#94a3b8;font-weight:normal">${trn.origin} → ${trn.destination}</div>
          <div style="font-size:9.5px;color:${badgeColor};font-family:monospace;font-weight:bold">Speed: ${trn.speedKmh} km/h · Signal: ${trn.signalAspect}</div>
        </div>`,
        { direction: "top", offset: [0, -12], opacity: 0.95 }
      );

      marker.on("click", () => {
        setActiveTrain(trn);
        setActiveStation(null);
        if (onSelectTrain) onSelectTrain(trn);
        toast.success(`Tracking Train #${trn.number} (${trn.name})`, {
          description: `Speed: ${trn.speedKmh} km/h · Approaching: ${trn.nextStation}`,
        });
      });

      trainsLayerRef.current.addLayer(marker);
    });
  }, [mapReady, visibleTrains, activeTrain, onSelectTrain, showTrains]);

  // Sync external selectedStationCode
  useEffect(() => {
    if (selectedStationCode) {
      const match = stations.find((s) => s.code === selectedStationCode);
      if (match) {
        setActiveStation(match);
        if (mapProvider === "google" && googleMapInstanceRef.current) {
          googleMapInstanceRef.current.panTo({ lat: match.lat, lng: match.lng });
          googleMapInstanceRef.current.setZoom(10);
        } else if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([match.lat, match.lng], 9, { duration: 1.0 });
        }
      }
    }
  }, [selectedStationCode, stations, mapProvider]);

  // Handle Search Result Selection
  const handleSelectSearchResultStation = (station: GeoStation) => {
    setActiveStation(station);
    setActiveTrain(null);
    setSearchQuery(`${station.name} (${station.code})`);
    setShowSearchResults(false);

    if (mapProvider === "google" && googleMapInstanceRef.current) {
      googleMapInstanceRef.current.panTo({ lat: station.lat, lng: station.lng });
      googleMapInstanceRef.current.setZoom(12);
    } else if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([station.lat, station.lng], 11, { duration: 1.2 });
    }

    if (onSelectStation) onSelectStation(station);
    toast.info(`Station Centered: ${station.name} (${station.code})`, {
      description: `GPS: ${station.lat.toFixed(4)}°N, ${station.lng.toFixed(4)}°E · ${station.division} Div / ${station.zone}`,
    });
  };

  const handleSelectSearchResultTrain = (train: GeoTrain) => {
    setActiveTrain(train);
    setActiveStation(null);
    setSearchQuery(`${train.number} ${train.name}`);
    setShowSearchResults(false);

    if (mapProvider === "google" && googleMapInstanceRef.current) {
      googleMapInstanceRef.current.panTo({ lat: train.lat, lng: train.lng });
      googleMapInstanceRef.current.setZoom(12);
    } else if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([train.lat, train.lng], 11, { duration: 1.2 });
    }

    if (onSelectTrain) onSelectTrain(train);
    toast.success(`Tracking Train #${train.number} (${train.name})`, {
      description: `Speed: ${train.speedKmh} km/h · Approaching: ${train.nextStation}`,
    });
  };

  const handleSelectCorridor = (cId: string) => {
    setActiveCorridorId(cId);
    setActiveStation(null);
    setActiveTrain(null);

    if (cId === "ALL") {
      if (mapProvider === "google" && googleMapInstanceRef.current) {
        googleMapInstanceRef.current.panTo({ lat: 22.3, lng: 79.5 });
        googleMapInstanceRef.current.setZoom(5);
      } else if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([22.3, 79.5], 5, { duration: 1.2 });
      }
      toast.info("Pan-India National Railway Network");
      return;
    }

    const c = NATIONAL_CORRIDORS.find((x) => x.id === cId);
    if (c) {
      const cStations = c.stations
        .map((code) => stations.find((s) => s.code === code))
        .filter((s): s is GeoStation => s !== undefined);

      if (cStations.length >= 2) {
        if (
          mapProvider === "google" &&
          googleMapInstanceRef.current &&
          typeof google !== "undefined" &&
          google.maps
        ) {
          const bounds = new google.maps.LatLngBounds();
          cStations.forEach((stn) => bounds.extend({ lat: stn.lat, lng: stn.lng }));
          googleMapInstanceRef.current.fitBounds(bounds, 50);
        } else if (mapInstanceRef.current && typeof L !== "undefined") {
          const bounds = L.latLngBounds(cStations.map((s) => [s.lat, s.lng]));
          mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], duration: 1.2 });
        }
      }
    }
    toast.info(`Corridor Focused: ${c?.name}`);
  };

  const handleResetView = () => {
    setActiveCorridorId("ALL");
    setActiveStation(null);
    setActiveTrain(null);
    setSearchQuery("");
    if (mapProvider === "google" && googleMapInstanceRef.current) {
      googleMapInstanceRef.current.panTo({ lat: 22.3, lng: 79.5 });
      googleMapInstanceRef.current.setZoom(5);
    } else if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([22.3, 79.5], 5, { duration: 1.2 });
    }
  };

  const handleZoomIn = () => {
    if (mapProvider === "google" && googleMapInstanceRef.current) {
      const cur = googleMapInstanceRef.current.getZoom() || 5;
      googleMapInstanceRef.current.setZoom(cur + 1);
    } else if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapProvider === "google" && googleMapInstanceRef.current) {
      const cur = googleMapInstanceRef.current.getZoom() || 5;
      googleMapInstanceRef.current.setZoom(Math.max(cur - 1, 4));
    } else if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  // Test IndianRailAPI key
  const handleTestApiKey = async () => {
    if (!apiKeyInput.trim()) {
      toast.error("Please enter an IndianRailAPI key");
      return;
    }
    setApiTesting(true);
    try {
      const testResult = await fetchStationLocationFromApi("NDLS", apiKeyInput.trim());
      if (testResult) {
        setStoredIndianRailApiKey(apiKeyInput.trim());
        toast.success("IndianRailAPI Key Verified & Saved!", {
          description: `Successfully resolved New Delhi (NDLS) location at ${testResult.lat}°N, ${testResult.lng}°E`,
        });
        setShowApiKeyModal(false);
      } else {
        toast.error("API Error or Invalid Key", {
          description: "Could not fetch station location from indianrailapi.com. Check key quota.",
        });
      }
    } catch {
      toast.error("Connection Failed to indianrailapi.com");
    } finally {
      setApiTesting(false);
    }
  };

  return (
    <div className="relative border border-[#1a2538] rounded-xl bg-[#070e1d] overflow-hidden shadow-2xl">
      {/* Top Search & Controls Bar */}
      <div className="p-3.5 bg-[#091122] border-b border-[#141f33] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 z-30 relative">
        {/* Pan-India Search Box */}
        <div className="relative flex-1 max-w-lg">
          <div className="flex items-center gap-2 px-3 py-2 bg-[#0d1628] rounded-lg border border-[#1e2e48] focus-within:border-[#06b6d4] transition-colors">
            <Search size={15} className="text-[#647b99] shrink-0" />
            <input
              type="text"
              placeholder="Search all Indian stations (NDLS, HWH, CSMT, SBC) or trains (Vande Bharat, Rajdhani, 12050)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              className="w-full bg-transparent border-0 text-xs text-[#e2e8f0] focus:outline-none placeholder:text-[#526682]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setShowSearchResults(false);
                }}
                className="text-[#647b99] hover:text-white p-0.5"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showSearchResults && searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#0b1324] border border-[#1e2e48] rounded-lg shadow-2xl max-h-80 overflow-y-auto z-50 p-2 space-y-2">
              {searchResults.stations.length === 0 &&
                searchResults.trains.length === 0 &&
                searchResults.corridors.length === 0 && (
                  <div className="p-3 text-center text-xs text-[#647b99]">
                    No stations, trains, or corridors matching "{searchQuery}"
                  </div>
                )}

              {/* Corridors match */}
              {searchResults.corridors.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[#a78bfa] flex items-center gap-1.5">
                    <Compass size={11} /> NATIONAL CORRIDORS
                  </div>
                  {searchResults.corridors.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        handleSelectCorridor(c.id);
                        setShowSearchResults(false);
                      }}
                      className="p-2 rounded hover:bg-[#132038] cursor-pointer flex items-center justify-between text-xs transition-colors"
                    >
                      <span className="text-[#e2e8f0] font-bold">{c.name}</span>
                      <span className="text-[10px] font-mono text-[#a78bfa] px-1.5 py-0.5 rounded bg-[#1e1738]">
                        {c.lengthKm} KM
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Stations match */}
              {searchResults.stations.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[#22d3ee] flex items-center gap-1.5">
                    <MapPin size={11} /> INDIAN RAILWAYS STATIONS
                  </div>
                  {searchResults.stations.map((stn) => (
                    <div
                      key={stn.code}
                      onClick={() => handleSelectSearchResultStation(stn)}
                      className="p-2 rounded hover:bg-[#132038] cursor-pointer flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <div className="font-bold text-[#e2e8f0] flex items-center gap-2">
                          <span>{stn.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#162540] text-[#22d3ee]">
                            {stn.code}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#7186a5]">
                          {stn.division} Div · {stn.zone} Zone · {stn.state}
                        </div>
                      </div>
                      <div className="text-right text-[10px] font-mono text-[#526682]">
                        {stn.lat.toFixed(2)}°N, {stn.lng.toFixed(2)}°E
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Trains match */}
              {searchResults.trains.length > 0 && (
                <div className="border-t border-[#16233b] pt-1">
                  <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[#34d399] flex items-center gap-1.5">
                    <Train size={11} /> LIVE TRAINS IN TRANSIT
                  </div>
                  {searchResults.trains.map((trn) => (
                    <div
                      key={trn.number}
                      onClick={() => handleSelectSearchResultTrain(trn)}
                      className="p-2 rounded hover:bg-[#132038] cursor-pointer flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <div className="font-bold text-[#e2e8f0] flex items-center gap-2">
                          <span className="font-mono text-[#10b981]">#{trn.number}</span>
                          <span>{trn.name}</span>
                        </div>
                        <div className="text-[11px] text-[#7186a5]">
                          {trn.origin} → {trn.destination} · {trn.speedKmh} km/h
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#0a1e1e] text-[#22d3ee] border border-[#06b6d4]/30">
                        {trn.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Category Filter & Quick Corridor Strip */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-full">
          <div className="flex items-center bg-[#070e1d] p-0.5 rounded-lg border border-[#1e2e48] shrink-0">
            <button
              type="button"
              onClick={() => {
                setCorridorCategoryFilter("ALL");
                handleSelectCorridor("ALL");
              }}
              className={`px-2 py-1 rounded text-xs font-mono font-bold transition ${
                corridorCategoryFilter === "ALL" && activeCorridorId === "ALL"
                  ? "bg-[#06b6d4] text-[#001f26] shadow-sm"
                  : "text-[#8ea4c2] hover:text-white"
              }`}
            >
              ALL
            </button>
            <button
              type="button"
              onClick={() => {
                setCorridorCategoryFilter("DFC");
                handleSelectCorridor("DFC-EASTERN");
              }}
              className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition flex items-center gap-1 ${
                corridorCategoryFilter === "DFC"
                  ? "bg-[#f59e0b] text-[#1e1505] shadow-sm"
                  : "text-[#f59e0b]/80 hover:text-[#f59e0b]"
              }`}
            >
              <span>DFCs (7)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setCorridorCategoryFilter("GQ");
                handleSelectCorridor("GQ-DELHI-MUMBAI");
              }}
              className={`px-2 py-1 rounded text-xs font-mono font-bold transition ${
                corridorCategoryFilter === "GQ"
                  ? "bg-[#06b6d4] text-[#001f26] shadow-sm"
                  : "text-[#8ea4c2] hover:text-white"
              }`}
            >
              GQ (6)
            </button>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {visibleCorridors.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelectCorridor(c.id)}
                className={`px-2 py-1 rounded text-[11px] font-mono transition shrink-0 border ${
                  activeCorridorId === c.id
                    ? c.type === "DEDICATED_FREIGHT"
                      ? "bg-[#f59e0b] text-[#1e1505] border-[#f59e0b] font-bold"
                      : "bg-[#06b6d4] text-[#001f26] border-[#06b6d4] font-bold"
                    : c.type === "DEDICATED_FREIGHT"
                    ? "bg-[#0d1628] text-[#fbbf24] hover:text-white border-[#f59e0b]/30"
                    : "bg-[#0d1628] text-[#7186a5] hover:text-white border-[#1e2e48]"
                }`}
                title={`${c.name} (${c.lengthKm} KM)`}
              >
                {c.code}
              </button>
            ))}
          </div>
        </div>

        {/* Layer Toggles & API Key Button */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Map Basemap Mode Switcher: Google Satellite, Google Roadmap, Dark GIS, Google Terrain */}
          <div className="flex items-center bg-[#070e1d] p-0.5 rounded-lg border border-[#1e2e48]">
            {(Object.keys(MAP_THEMES) as GeoMapTheme[]).map((themeKey) => {
              const theme = MAP_THEMES[themeKey];
              const isActive = mapTheme === themeKey;
              return (
                <button
                  key={themeKey}
                  type="button"
                  onClick={() => {
                    setMapTheme(themeKey);
                    if (mapProvider === "google" && googleMapInstanceRef.current && typeof google !== "undefined" && google.maps) {
                      if (themeKey === "googleSatellite") {
                        googleMapInstanceRef.current.setMapTypeId("hybrid");
                      } else if (themeKey === "googleRoadmap") {
                        googleMapInstanceRef.current.setMapTypeId("roadmap");
                      } else if (themeKey === "googleTerrain") {
                        googleMapInstanceRef.current.setMapTypeId("terrain");
                      }
                    }
                    toast.info(`Map View: ${theme.name}`, {
                      description: "High-resolution basemap active with zero watermark.",
                    });
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    isActive
                      ? themeKey === "googleSatellite"
                        ? "bg-[#10b981] text-black font-bold shadow-sm"
                        : themeKey === "googleRoadmap"
                        ? "bg-[#06b6d4] text-[#001f26] font-bold shadow-sm"
                        : themeKey === "darkTelemetry"
                        ? "bg-[#1e2e48] text-white shadow-sm"
                        : "bg-[#f59e0b] text-[#1e1505] font-bold shadow-sm"
                      : "text-[#7186a5] hover:text-white"
                  }`}
                  title={`Switch to ${theme.name}`}
                >
                  <span>{theme.badge}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setShowCorridors(!showCorridors)}
            className={`px-2 py-1.5 rounded text-xs font-mono flex items-center gap-1 border transition ${
              showCorridors
                ? "bg-[#06b6d4]/20 border-[#06b6d4] text-[#22d3ee]"
                : "bg-[#0d1628] border-[#1e2e48] text-[#647b99]"
            }`}
            title="Toggle National Corridors"
          >
            <Compass size={13} />
            <span>CORRIDORS</span>
          </button>

          <button
            type="button"
            onClick={() => setShowStations(!showStations)}
            className={`px-2 py-1.5 rounded text-xs font-mono flex items-center gap-1 border transition ${
              showStations
                ? "bg-[#0284c7]/20 border-[#0284c7] text-[#38bdf8]"
                : "bg-[#0d1628] border-[#1e2e48] text-[#647b99]"
            }`}
            title="Toggle Stations"
          >
            <MapPin size={13} />
            <span>STATIONS</span>
          </button>

          <button
            type="button"
            onClick={() => setShowTrains(!showTrains)}
            className={`px-2 py-1.5 rounded text-xs font-mono flex items-center gap-1 border transition ${
              showTrains
                ? "bg-[#10b981]/20 border-[#10b981] text-[#34d399]"
                : "bg-[#0d1628] border-[#1e2e48] text-[#647b99]"
            }`}
            title="Toggle Live Trains"
          >
            <Train size={13} />
            <span>TRAINS</span>
          </button>

          {/* Google Maps API Key Modal Button */}
          <button
            type="button"
            onClick={() => setShowGoogleKeyModal(true)}
            className={`px-2.5 py-1.5 rounded text-xs font-mono flex items-center gap-1.5 border transition cursor-pointer ${
              googleReady
                ? "bg-[#10b981]/15 text-[#34d399] border-[#10b981]/40"
                : "bg-[#0f172a] hover:bg-[#16233b] text-[#38bdf8] border-[#1e2e48]"
            }`}
            title="Configure Google Maps API Key"
          >
            <Globe size={13} />
            <span>GOOGLE KEY</span>
          </button>

          {/* IndianRailAPI Key Button */}
          <button
            type="button"
            onClick={() => setShowApiKeyModal(true)}
            className="px-2.5 py-1.5 rounded text-xs font-mono flex items-center gap-1.5 bg-[#0f172a] hover:bg-[#16233b] text-[#f59e0b] border border-[#1e2e48] transition cursor-pointer"
            title="Configure IndianRailAPI Key"
          >
            <Key size={13} />
            <span>RAIL API</span>
          </button>
        </div>
      </div>

      {/* Real Geographical Map Viewport */}
      <div className="relative h-[680px] w-full bg-[#050914] overflow-hidden">
        {/* Google Maps DOM Container */}
        <div
          ref={googleMapContainerRef}
          className={`w-full h-full z-10 ${mapProvider === "google" ? "block" : "hidden"}`}
        />
        {/* Leaflet Map DOM Container */}
        <div
          ref={mapContainerRef}
          className={`w-full h-full z-10 ${mapProvider === "leaflet" ? "block" : "hidden"}`}
        />

        {/* Floating Zoom & Reset Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-1.5 z-20">
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-8 h-8 rounded-lg bg-[#091122]/90 border border-[#1e2e48] hover:border-[#06b6d4] text-[#cbd5e1] flex items-center justify-center shadow-lg transition"
            title="Zoom In"
          >
            <Plus size={15} />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-8 h-8 rounded-lg bg-[#091122]/90 border border-[#1e2e48] hover:border-[#06b6d4] text-[#cbd5e1] flex items-center justify-center shadow-lg transition"
            title="Zoom Out"
          >
            <Minus size={15} />
          </button>
          <button
            type="button"
            onClick={handleResetView}
            className="w-8 h-8 rounded-lg bg-[#091122]/90 border border-[#1e2e48] hover:border-[#06b6d4] text-[#cbd5e1] flex items-center justify-center shadow-lg transition"
            title="Reset Pan & Zoom (Pan-India)"
          >
            <RotateCcw size={14} />
          </button>
        </div>

        {/* Live Network Stats Strip */}
        <div className="absolute bottom-4 left-4 flex items-center gap-3 bg-[#08101e]/90 backdrop-blur-md border border-[#1a273c] px-3.5 py-1.5 rounded-lg text-[10px] font-mono text-[#7186a5] z-20">
          <div className="flex items-center gap-1.5 text-[#22d3ee] font-bold">
            <Globe size={13} />
            <span>PAN-INDIA GIS ({MAP_THEMES[mapTheme]?.name.toUpperCase() || "SATELLITE"})</span>
          </div>
          <span className="text-[#1e2e48]">|</span>
          <div>
            CORRIDORS: <b className="text-white">{visibleCorridors.length}</b>
          </div>
          <span className="text-[#1e2e48]">|</span>
          <div>
            STATIONS: <b className="text-[#38bdf8]">{visibleStations.length}</b>
          </div>
          <span className="text-[#1e2e48]">|</span>
          <div>
            LIVE TRAINS: <b className="text-[#10b981]">{visibleTrains.length}</b>
          </div>
          <span className="text-[#1e2e48]">|</span>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
            <span>KAVACH TPWS ONLINE</span>
          </div>
        </div>

        {/* Station Inspector Floating Drawer */}
        {activeStation && (
          <div className="absolute bottom-4 right-4 max-w-sm w-full bg-[#091224]/95 backdrop-blur-md border border-[#1e3050] rounded-xl p-4 shadow-2xl z-20 text-xs animate-in fade-in slide-in-from-bottom-3 duration-150">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0284c7]/20 border border-[#0284c7]/40 flex items-center justify-center text-[#38bdf8]">
                  <MapPin size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{activeStation.name}</h4>
                  <div className="text-[10px] font-mono text-[#22d3ee]">
                    {activeStation.code} · {activeStation.division} Division ({activeStation.zone})
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveStation(null)}
                className="text-[#647b99] hover:text-white p-1"
              >
                <X size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 my-3 text-[11px] font-mono">
              <div className="p-2 rounded bg-[#0d1628] border border-[#18263e]">
                <span className="text-[#647b99] block text-[9px] uppercase">GPS Coordinates</span>
                <span className="text-white font-bold">
                  {activeStation.lat.toFixed(4)}°N, {activeStation.lng.toFixed(4)}°E
                </span>
              </div>
              <div className="p-2 rounded bg-[#0d1628] border border-[#18263e]">
                <span className="text-[#647b99] block text-[9px] uppercase">Platforms / Track</span>
                <span className="text-[#38bdf8] font-bold">
                  {activeStation.platforms} Platforms ({activeStation.elevationM}m MSL)
                </span>
              </div>
              <div className="p-2 rounded bg-[#0d1628] border border-[#18263e]">
                <span className="text-[#647b99] block text-[9px] uppercase">Interlocking</span>
                <span className="text-[#e2e8f0] truncate block" title={activeStation.interlockingType}>
                  {activeStation.interlockingType}
                </span>
              </div>
              <div className="p-2 rounded bg-[#0d1628] border border-[#18263e]">
                <span className="text-[#647b99] block text-[9px] uppercase">Kavach TPWS</span>
                <span className="text-[#10b981] font-bold flex items-center gap-1">
                  <CheckCircle2 size={11} /> Certified Safe
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-[#647b99] border-t border-[#16233b] pt-2">
              <span>State: {activeStation.state}</span>
              <span className="text-[#22d3ee] font-mono">KM {activeStation.km}</span>
            </div>
          </div>
        )}

        {/* Train Inspector Floating Drawer */}
        {activeTrain && (
          <div className="absolute bottom-4 right-4 max-w-sm w-full bg-[#091224]/95 backdrop-blur-md border border-[#1e3050] rounded-xl p-4 shadow-2xl z-20 text-xs animate-in fade-in slide-in-from-bottom-3 duration-150">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#10b981]/20 border border-[#10b981]/40 flex items-center justify-center text-[#34d399]">
                  <Train size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">#{activeTrain.number} {activeTrain.name}</h4>
                  <div className="text-[10px] font-mono text-[#22d3ee]">
                    {activeTrain.type.replace(/_/g, " ")} · Heading {activeTrain.headingDeg}°
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTrain(null)}
                className="text-[#647b99] hover:text-white p-1"
              >
                <X size={14} />
              </button>
            </div>

            <div className="p-2 rounded bg-[#06101e] border border-[#142640] mb-3 text-[11px]">
              <div className="flex items-center justify-between text-white font-bold">
                <span>{activeTrain.origin}</span>
                <span className="text-[#06b6d4]">→</span>
                <span>{activeTrain.destination}</span>
              </div>
              <div className="text-[10px] text-[#647b99] mt-1">
                Approaching next: <b className="text-[#e2e8f0]">{activeTrain.nextStation}</b>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px] font-mono mb-3">
              <div className="p-2 rounded bg-[#0d1628] border border-[#18263e]">
                <span className="text-[#647b99] block text-[9px] uppercase">Speed</span>
                <span className="text-[#10b981] font-bold text-sm">{activeTrain.speedKmh} km/h</span>
              </div>
              <div className="p-2 rounded bg-[#0d1628] border border-[#18263e]">
                <span className="text-[#647b99] block text-[9px] uppercase">Signal Aspect</span>
                <span className="text-[#22d3ee] font-bold text-xs">{activeTrain.signalAspect}</span>
              </div>
              <div className="p-2 rounded bg-[#0d1628] border border-[#18263e]">
                <span className="text-[#647b99] block text-[9px] uppercase">Status</span>
                <span className="text-[#34d399] font-bold text-xs">{activeTrain.status}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-[#647b99] border-t border-[#16233b] pt-2">
              <span>GPS: {activeTrain.lat.toFixed(4)}°N, {activeTrain.lng.toFixed(4)}°E</span>
              <span className="text-[#10b981] font-mono font-bold">
                {activeTrain.delayMins === 0 ? "Right Time" : `+${activeTrain.delayMins}m Delay`}
              </span>
            </div>
          </div>
        )}

        {/* Active Corridor Inspection Floating Drawer */}
        {activeCorridor && !activeStation && !activeTrain && (
          <div className="absolute bottom-4 right-4 max-w-md w-full bg-[#091224]/95 backdrop-blur-md border border-[#1e3050] rounded-xl p-4 shadow-2xl z-20 text-xs animate-in fade-in slide-in-from-bottom-3 duration-150">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    activeCorridor.type === "DEDICATED_FREIGHT"
                      ? "bg-[#f59e0b]/20 border border-[#f59e0b]/40 text-[#f59e0b]"
                      : "bg-[#06b6d4]/20 border border-[#06b6d4]/40 text-[#22d3ee]"
                  }`}
                >
                  <Compass size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{activeCorridor.name}</h4>
                  <div className="text-[10px] font-mono text-[#cbd5e1] flex items-center gap-1.5">
                    <span className="text-[#38bdf8] font-bold">{activeCorridor.code}</span>
                    <span>·</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        activeCorridor.status === "Operational"
                          ? "bg-[#064e3b] text-[#6ee7b7]"
                          : "bg-[#312e81] text-[#c7d2fe]"
                      }`}
                    >
                      {activeCorridor.status || "Operational"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveCorridorId("ALL")}
                className="text-[#647b99] hover:text-white p-1"
                title="Deselect corridor"
              >
                <X size={14} />
              </button>
            </div>

            {activeCorridor.startPoint && activeCorridor.terminationPoint && (
              <div className="p-2.5 rounded-lg bg-[#06101e] border border-[#142640] mb-3 text-[11px]">
                <div className="flex items-center justify-between text-white font-bold">
                  <div>
                    <span className="text-[9px] text-[#647b99] block font-normal uppercase">Origin / Start</span>
                    <span>{activeCorridor.startPoint}</span>
                  </div>
                  <span className="text-[#f59e0b] font-bold">➔</span>
                  <div className="text-right">
                    <span className="text-[9px] text-[#647b99] block font-normal uppercase">Termination</span>
                    <span>{activeCorridor.terminationPoint}</span>
                  </div>
                </div>
                {activeCorridor.logisticsHub && (
                  <div className="text-[10px] text-[#f59e0b] mt-1.5 border-t border-[#12233b] pt-1 flex items-center gap-1 font-mono font-bold">
                    <span>Logistics Hub:</span>
                    <span className="text-white">{activeCorridor.logisticsHub}</span>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 text-[11px] font-mono mb-3">
              <div className="p-2 rounded bg-[#0d1628] border border-[#18263e]">
                <span className="text-[#647b99] block text-[9px] uppercase">Length</span>
                <span className="text-[#38bdf8] font-bold text-xs">
                  {activeCorridor.lengthKm.toLocaleString()} KM
                </span>
              </div>
              <div className="p-2 rounded bg-[#0d1628] border border-[#18263e]">
                <span className="text-[#647b99] block text-[9px] uppercase">Tracks</span>
                <span className="text-white font-bold text-xs">{activeCorridor.tracks} Lines (25kV)</span>
              </div>
              <div className="p-2 rounded bg-[#0d1628] border border-[#18263e]">
                <span className="text-[#647b99] block text-[9px] uppercase">Design Speed</span>
                <span className="text-[#10b981] font-bold text-xs">{activeCorridor.maxSpeedKmh} km/h</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-[#647b99] border-t border-[#16233b] pt-2">
              <span>
                Stations along path: <b className="text-white">{activeCorridor.stations.length} hubs</b>
              </span>
              <span className="text-[#22d3ee] font-mono">Density: {activeCorridor.densityGmt} GMT</span>
            </div>
          </div>
        )}
      </div>

      {/* IndianRailAPI Key Configuration Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0b1324] border border-[#1e2e48] rounded-xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowApiKeyModal(false)}
              className="absolute top-4 right-4 text-[#647b99] hover:text-white"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#f59e0b]/20 border border-[#f59e0b]/40 flex items-center justify-center text-[#f59e0b]">
                <Key size={20} />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">IndianRailAPI Configuration</h3>
                <p className="text-xs text-[#7186a5]">
                  Connect live station GPS telemetry from indianrailapi.com
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#070e1d] border border-[#16233b] text-[11px] font-mono text-[#94a3b8] mb-4 space-y-1">
              <div className="text-[#38bdf8] font-bold">API Endpoint Pattern:</div>
              <div className="text-[#cbd5e1] break-all">
                http://indianrailapi.com/api/v2/StationLocationOnMap/apikey/&lt;apikey&gt;/StationCode/&lt;StationCode&gt;
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <label className="text-xs font-semibold text-[#cbd5e1] block">
                Enter IndianRailAPI Key:
              </label>
              <input
                type="text"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="e.g. 87a29e4d1f5b0c3a9d..."
                className="w-full px-3 py-2 rounded-lg bg-[#070e1d] border border-[#1e2e48] text-xs text-white focus:outline-none focus:border-[#06b6d4] font-mono"
              />
              <p className="text-[10px] text-[#647b99]">
                Key is stored securely in your browser's local storage and used to resolve station coordinates.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#141f33]">
              <button
                type="button"
                onClick={() => setShowApiKeyModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-[#94a3b8] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTestApiKey}
                disabled={apiTesting}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#06b6d4] hover:bg-[#22d3ee] text-[#001f26] flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                {apiTesting ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={12} />
                    <span>Verify & Save Key</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Maps API Key Modal */}
      {showGoogleKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0b1324] border border-[#1e2e48] rounded-xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowGoogleKeyModal(false)}
              className="absolute top-4 right-4 text-[#647b99] hover:text-white"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#10b981]/20 border border-[#10b981]/40 flex items-center justify-center text-[#10b981]">
                <Globe size={20} />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Google Maps API Configuration</h3>
                <p className="text-xs text-[#7186a5]">
                  High-resolution satellite hybrid & vector roadmaps for Indian Railways
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#070e1d] border border-[#16233b] text-[11px] font-mono text-[#94a3b8] mb-4 space-y-1">
              <div className="text-[#10b981] font-bold">Google Cloud Setup:</div>
              <ul className="list-disc list-inside text-[#cbd5e1] space-y-0.5 text-[10.5px]">
                <li>Requires <b>Maps JavaScript API</b> enabled in GCP Console</li>
                <li>Libraries: <code>geometry, places</code></li>
                <li>Supports Custom Dark Roadmap, Satellite Hybrid & Terrain</li>
              </ul>
            </div>

            <div className="space-y-2 mb-4">
              <label className="text-xs font-semibold text-[#cbd5e1] block">
                Google Maps API Key:
              </label>
              <input
                type="text"
                value={googleKeyInput}
                onChange={(e) => setGoogleKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 rounded-lg bg-[#070e1d] border border-[#1e2e48] text-xs text-white focus:outline-none focus:border-[#10b981] font-mono"
              />
              <p className="text-[10px] text-[#647b99]">
                Key is stored securely in your browser's local storage and used directly by the Google Maps SDK.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#141f33]">
              <button
                type="button"
                onClick={() => setShowGoogleKeyModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-[#94a3b8] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const ok = await initGoogleMap(googleKeyInput);
                  if (ok) {
                    setShowGoogleKeyModal(false);
                  }
                }}
                disabled={googleLoading}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#10b981] hover:bg-[#34d399] text-black flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                {googleLoading ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={12} />
                    <span>Apply & Connect Google Maps</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
