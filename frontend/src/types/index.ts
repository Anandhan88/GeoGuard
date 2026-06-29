// ===== Core Types for GeoGuard AI =====

export type UserRole = 'citizen' | 'volunteer' | 'authority' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  languagePref: 'en' | 'ta' | 'hi';
  location?: LatLng;
  avatarUrl?: string;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface GeoZone {
  id: string;
  name: string;
  coordinates: LatLng[];
  center: LatLng;
}

// ===== Risk & Predictions =====

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'minimal';

export interface RiskFactor {
  name: string;
  value: number;
  unit: string;
  contribution: number; // percentage contribution to risk
  trend: 'increasing' | 'decreasing' | 'stable';
  threshold: number;
  description: string;
}

export interface FloodPrediction {
  id: string;
  zoneId: string;
  zoneName: string;
  riskScore: number; // 0-100
  probability: number; // 0-1
  confidence: number; // 0-1
  predictedDepth: number; // meters
  predictedDuration: number; // hours
  riskLevel: RiskLevel;
  factors: RiskFactor[];
  affectedPopulation: number;
  predictedFor: string;
  generatedAt: string;
  center: LatLng;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number; // 0-1
}

// ===== Weather =====

export interface HourlyForecast {
  time: string;
  timestamp: string;
  rainfall: number;
  predicted: boolean;
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
  windDirection: string;
  pressure: number;
  visibility: number;
  condition: string;
  icon: string;
  forecast: WeatherForecast[];
  hourlyForecast?: HourlyForecast[];
}

export interface WeatherForecast {
  date: string;
  tempHigh: number;
  tempLow: number;
  rainfall: number;
  condition: string;
  icon: string;
}

// ===== Citizen Reports =====

export type ReportType = 'flood' | 'road_blocked' | 'bridge_damaged' | 'tree_fallen' | 'power_outage' | 'landslide' | 'fire' | 'other';

export interface CitizenReport {
  id: string;
  userId: string;
  userName: string;
  type: ReportType;
  description: string;
  severity: number; // 1-5
  imageUrl?: string;
  verified: boolean;
  location: LatLng;
  address?: string;
  createdAt: string;
  upvotes: number;
}

// ===== Shelters =====

export interface Shelter {
  id: string;
  name: string;
  type: 'school' | 'community_hall' | 'stadium' | 'temple' | 'government';
  capacity: number;
  currentOccupancy: number;
  amenities: string[];
  contact: string;
  location: LatLng;
  address: string;
  distance?: number; // km from user
  isOpen: boolean;
}

// ===== Alerts =====

export type AlertSeverity = 'extreme' | 'critical' | 'severe' | 'moderate' | 'advisory';

export interface Alert {
  id: string;
  type: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  targetZone: string;
  issuedAt: string;
  expiresAt: string;
  isActive: boolean;
}

// ===== Evacuation =====

export interface EvacuationRoute {
  id: string;
  name: string;
  origin: LatLng;
  destination: LatLng;
  shelterName: string;
  waypoints: LatLng[];
  distance: number; // km
  estimatedTime: number; // minutes
  riskAlongRoute: number; // 0-100
  isRecommended: boolean;
  avoidedZones: string[];
}

// ===== Impact Assessment =====

export interface ImpactAssessment {
  zoneId: string;
  zoneName: string;
  populationAffected: number;
  buildingsAtRisk: number;
  schoolsAffected: number;
  hospitalsAffected: number;
  agriculturalAreaHa: number;
  impactScore: number; // 0-100
  economicLossEstimate: number; // in lakhs
  humanRiskIndex: number; // 0-100
}

// ===== Resource Allocation =====

export interface ResourceAllocation {
  zoneId: string;
  zoneName: string;
  ambulances: number;
  rescueBoats: number;
  reliefTrucks: number;
  medicalTeams: number;
  totalPersonnel: number;
  severity: RiskLevel;
}

// ===== Damage Assessment =====

export interface DamageReport {
  id: string;
  beforeImageUrl: string;
  afterImageUrl: string;
  damagePercentage: number;
  estimatedRepairCost: number;
  priorityScore: number;
  location: LatLng;
  description: string;
  category: 'structural' | 'road' | 'infrastructure' | 'agricultural';
}

// ===== Dashboard Stats =====

export interface DashboardStats {
  activeAlerts: number;
  zonesAtRisk: number;
  populationAffected: number;
  sheltersActive: number;
  citizenReports: number;
  resourcesDeployed: number;
  predictionsGenerated: number;
  avgRiskScore: number;
}

// ===== Chat =====

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  language: 'en' | 'ta' | 'hi';
}


// ===== Satellite Imagery =====

export interface SatelliteImage {
  id: string;
  source: string;
  capture_date: string;
  image_url: string;
  analysis_result_json: {
    flooded_area_km: number;
    water_spread_pct: number;
    severity: string;
    risk_level: string;
    ndwi_score: number;
    coverage_pct: number;
    anomaly_detected: boolean;
    analysis: string;
    polygons: any[];
  };
  bounds_json?: any;
}

export interface SatelliteStatus {
  status: 'Idle' | 'Searching' | 'Downloading' | 'Processing' | 'Completed' | 'Failed';
  download_status: 'Idle' | 'Downloading' | 'Completed' | 'Failed';
  processing_status: 'Idle' | 'Processing' | 'Completed' | 'Failed';
  progress: number;
  satellite_name: string;
  product_id: string | null;
  product_name: string | null;
  acquisition_time: string | null;
  last_update: string | null;
  file_path: string | null;
  error_message: string | null;
}

