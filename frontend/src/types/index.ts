// All TypeScript types/interfaces for SmartWater

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'worker' | 'citizen';
  phone?: string;
  avatar_url?: string;
  created_at?: string;
  is_active?: number;
}

export interface Zone {
  id: string;
  name: string;
  description?: string;
  population?: number;
  area_sqkm?: number;
  latitude: number;
  longitude: number;
  created_at?: string;
}

export interface Sensor {
  id: string;
  sensor_id: string;
  sensor_type: 'flow' | 'pressure' | 'tank_level' | 'water_meter';
  zone_id: string;
  zone_name?: string;
  latitude: number;
  longitude: number;
  status: 'normal' | 'warning' | 'offline' | 'critical';
  last_reading: number;
  unit: string;
  last_updated: string;
  created_at?: string;
}

export interface SensorReading {
  id: string;
  sensor_id: string;
  flow?: number;
  pressure?: number;
  tank_level?: number;
  consumption?: number;
  recorded_at: string;
}

export interface WaterSupply {
  date: string;
  zone_id: string;
  zone_name?: string;
  supplied: number;
  consumed: number;
  loss?: number;
  loss_percentage?: number;
  loss_status?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface Complaint {
  id: string;
  citizen_id: string;
  citizen_name?: string;
  problem_type: 'pipeline_leakage' | 'road_leakage' | 'tank_overflow' | 'low_pressure' | 'no_water' | 'broken_valve' | 'other';
  description: string;
  latitude?: number;
  longitude?: number;
  photo_url?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'reported' | 'verified' | 'assigned' | 'in_progress' | 'resolved' | 'closed';
  assigned_worker_id?: string;
  assigned_worker_name?: string;
  zone_id?: string;
  zone_name?: string;
  created_at: string;
  updated_at?: string;
}

export interface MaintenanceTask {
  id: string;
  complaint_id?: string;
  complaint_description?: string;
  problem_type?: string;
  worker_id: string;
  worker_name?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  notes?: string;
  before_photo?: string;
  after_photo?: string;
  due_date?: string;
  zone_id?: string;
  zone_name?: string;
  title: string;
  description?: string;
  created_at: string;
  completed_at?: string;
}

export interface Alert {
  id: string;
  alert_type: string;
  zone_id?: string;
  zone_name?: string;
  sensor_id?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved';
  message: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  read: number;
  type: string;
  created_at: string;
}

export interface DashboardData {
  summary: {
    total_supplied: number;
    total_consumed: number;
    water_loss: number;
    loss_percentage: number;
    loss_status: 'LOW' | 'MEDIUM' | 'HIGH';
    active_alerts: number;
    open_complaints: number;
    pending_maintenance: number;
    resolved_complaints: number;
  };
  zone_summary: Array<{
    id: string;
    name: string;
    population: number;
    supplied: number;
    consumed: number;
    loss: number;
    loss_pct: number;
  }>;
  daily_consumption: Array<{ date: string; supplied: number; consumed: number }>;
  complaint_status_counts: Record<string, number>;
  maintenance_status_counts: Record<string, number>;
  recent_alerts: Alert[];
  recent_complaints: Complaint[];
}

export interface WaterAsset {
  id: string;
  asset_type: string;
  name: string;
  zone_id?: string;
  zone_name?: string;
  latitude: number;
  longitude: number;
  status: string;
  description?: string;
  metadata?: Record<string, any>;
}

export type MapFeature = {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: {
    id: string;
    feature_type: string;
    name: string;
    zone_id?: string;
    zone_name?: string;
    status: string;
    [key: string]: any;
  };
};
