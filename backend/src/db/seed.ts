import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { runSchema } from './schema';

function subDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

function subHours(days: number, hours: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

function rand(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

export function seedDatabase() {
  runSchema();

  // Check if already seeded
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@smartwater.gov');
  if (existing) {
    console.log('📊 Database already seeded, skipping...');
    return;
  }

  console.log('🌱 Seeding database with demo data...');

  // ── USERS ──
  const users = [
    { id: 'user-admin-1', name: 'Rajesh Kumar', email: 'admin@smartwater.gov', password: 'Admin@123', role: 'admin', phone: '+91 98765 43210' },
    { id: 'user-worker-1', name: 'Suresh Patil', email: 'worker@smartwater.gov', password: 'Worker@123', role: 'worker', phone: '+91 98765 11111' },
    { id: 'user-worker-2', name: 'Anil Sharma', email: 'worker2@smartwater.gov', password: 'Worker@123', role: 'worker', phone: '+91 98765 22222' },
    { id: 'user-citizen-1', name: 'Priya Mehta', email: 'citizen@smartwater.gov', password: 'Citizen@123', role: 'citizen', phone: '+91 98765 33333' },
    { id: 'user-citizen-2', name: 'Amit Desai', email: 'amit@gmail.com', password: 'Citizen@123', role: 'citizen', phone: '+91 98765 44444' },
  ];

  const insertUser = db.prepare('INSERT INTO users (id,name,email,password_hash,role,phone) VALUES (?,?,?,?,?,?)');
  for (const u of users) {
    insertUser.run(u.id, u.name, u.email, bcrypt.hashSync(u.password, 10), u.role, u.phone);
  }

  // ── ZONES ──
  const zones = [
    { id: 'zone-a', name: 'Zone A - Shivajinagar', description: 'Central zone covering Shivajinagar and FC Road', population: 85000, area: 12.5, lat: 18.5308, lng: 73.8475 },
    { id: 'zone-b', name: 'Zone B - Kothrud', description: 'Western zone covering Kothrud and Karve Nagar', population: 120000, area: 18.2, lat: 18.5074, lng: 73.8077 },
    { id: 'zone-c', name: 'Zone C - Hadapsar', description: 'Eastern zone covering Hadapsar and Magarpatta', population: 95000, area: 22.0, lat: 18.5018, lng: 73.9260 },
    { id: 'zone-d', name: 'Zone D - Pimpri', description: 'Northern zone covering Pimpri-Chinchwad area', population: 110000, area: 25.4, lat: 18.6298, lng: 73.7997 },
    { id: 'zone-e', name: 'Zone E - Aundh', description: 'North-west zone covering Aundh and Baner', population: 70000, area: 14.8, lat: 18.5581, lng: 73.8082 },
  ];

  const insertZone = db.prepare('INSERT INTO zones (id,name,description,population,area_sqkm,latitude,longitude) VALUES (?,?,?,?,?,?,?)');
  for (const z of zones) {
    insertZone.run(z.id, z.name, z.description, z.population, z.area, z.lat, z.lng);
  }

  // ── WATER ASSETS ──
  const assets = [
    // Tanks
    { id: 'tank-a', type: 'tank', name: 'Water Tank A-1', zone: 'zone-a', lat: 18.5290, lng: 73.8460, status: 'active', desc: 'Main overhead tank for Zone A', meta: { capacity: 500000, current_level: 78, material: 'RCC' } },
    { id: 'tank-b', type: 'tank', name: 'Water Tank B-1', zone: 'zone-b', lat: 18.5060, lng: 73.8055, status: 'active', desc: 'Main overhead tank for Zone B', meta: { capacity: 700000, current_level: 65, material: 'Steel' } },
    { id: 'tank-c', type: 'tank', name: 'Water Tank C-1', zone: 'zone-c', lat: 18.5005, lng: 73.9245, status: 'maintenance', desc: 'Eastern zone storage tank - under inspection', meta: { capacity: 550000, current_level: 55, material: 'RCC' } },
    { id: 'tank-d', type: 'tank', name: 'Water Tank D-1', zone: 'zone-d', lat: 18.6280, lng: 73.7980, status: 'active', desc: 'Pimpri zone main tank', meta: { capacity: 650000, current_level: 82, material: 'RCC' } },
    { id: 'tank-e', type: 'tank', name: 'Water Tank E-1', zone: 'zone-e', lat: 18.5565, lng: 73.8070, status: 'active', desc: 'Aundh zone overhead tank', meta: { capacity: 400000, current_level: 70, material: 'Steel' } },
    // Pump Stations
    { id: 'pump-1', type: 'pump_station', name: 'Pump Station PS-101', zone: 'zone-a', lat: 18.5325, lng: 73.8495, status: 'active', desc: 'Primary pumping station for Zone A', meta: { capacity: '5000 L/min', power: '75 kW' } },
    { id: 'pump-2', type: 'pump_station', name: 'Pump Station PS-102', zone: 'zone-b', lat: 18.5090, lng: 73.8090, status: 'active', desc: 'Kothrud distribution pump', meta: { capacity: '7000 L/min', power: '100 kW' } },
    { id: 'pump-3', type: 'pump_station', name: 'Pump Station PS-103', zone: 'zone-c', lat: 18.5035, lng: 73.9275, status: 'warning', desc: 'Hadapsar pump station - pressure issue', meta: { capacity: '6000 L/min', power: '90 kW' } },
    // Pipelines
    { id: 'pipe-ab', type: 'pipeline', name: 'Pipeline PL-201 (A-B)', zone: 'zone-a', lat: 18.5190, lng: 73.8276, status: 'active', desc: 'Main trunk pipeline Zone A to B', meta: { start_lat: 18.5308, start_lng: 73.8475, end_lat: 18.5074, end_lng: 73.8077, diameter: 400, material: 'DI', length_m: 4200, installation_year: 2012 } },
    { id: 'pipe-bc', type: 'pipeline', name: 'Pipeline PL-202 (B-C)', zone: 'zone-b', lat: 18.5046, lng: 73.8668, status: 'active', desc: 'East-west trunk pipeline', meta: { start_lat: 18.5074, start_lng: 73.8077, end_lat: 18.5018, end_lng: 73.9260, diameter: 350, material: 'CI', length_m: 6100, installation_year: 2008 } },
    { id: 'pipe-ad', type: 'pipeline', name: 'Pipeline PL-203 (A-D)', zone: 'zone-a', lat: 18.5803, lng: 73.8236, status: 'inspection_required', desc: 'North feeder pipeline - requires inspection', meta: { start_lat: 18.5308, start_lng: 73.8475, end_lat: 18.6298, end_lng: 73.7997, diameter: 300, material: 'CI', length_m: 12000, installation_year: 2001 } },
    { id: 'pipe-ae', type: 'pipeline', name: 'Pipeline PL-204 (A-E)', zone: 'zone-a', lat: 18.5444, lng: 73.8278, status: 'active', desc: 'Aundh feeder pipeline', meta: { start_lat: 18.5308, start_lng: 73.8475, end_lat: 18.5581, end_lng: 73.8082, diameter: 250, material: 'DI', length_m: 3800, installation_year: 2015 } },
    // Valves
    { id: 'valve-1', type: 'valve', name: 'Isolation Valve V-301', zone: 'zone-a', lat: 18.5315, lng: 73.8470, status: 'active', desc: 'Zone A main isolation valve', meta: { valve_type: 'Gate Valve', size: 400 } },
    { id: 'valve-2', type: 'valve', name: 'Pressure Reducing Valve V-302', zone: 'zone-c', lat: 18.5022, lng: 73.9255, status: 'warning', desc: 'PRV at Zone C entry - pressure drop issue', meta: { valve_type: 'PRV', size: 300 } },
    { id: 'valve-3', type: 'valve', name: 'Isolation Valve V-303', zone: 'zone-d', lat: 18.6290, lng: 73.8005, status: 'active', desc: 'Zone D distribution valve', meta: { valve_type: 'Gate Valve', size: 350 } },
  ];

  const insertAsset = db.prepare('INSERT INTO water_assets (id,asset_type,name,zone_id,latitude,longitude,status,description,metadata) VALUES (?,?,?,?,?,?,?,?,?)');
  for (const a of assets) {
    insertAsset.run(a.id, a.type, a.name, a.zone, a.lat, a.lng, a.status, a.desc, JSON.stringify(a.meta));
  }

  // ── SENSORS ──
  const sensors = [
    { id: 'sens-fa101', sid: 'FA-101', type: 'flow', zone: 'zone-a', lat: 18.5295, lng: 73.8460, status: 'normal', reading: 856, unit: 'L/min' },
    { id: 'sens-pa201', sid: 'PA-201', type: 'pressure', zone: 'zone-a', lat: 18.5320, lng: 73.8490, status: 'normal', reading: 3.2, unit: 'bar' },
    { id: 'sens-fb102', sid: 'FB-102', type: 'flow', zone: 'zone-b', lat: 18.5060, lng: 73.8090, status: 'normal', reading: 1120, unit: 'L/min' },
    { id: 'sens-tb301', sid: 'TB-301', type: 'tank_level', zone: 'zone-b', lat: 18.5085, lng: 73.8065, status: 'normal', reading: 65, unit: '%' },
    { id: 'sens-fc103', sid: 'FC-103', type: 'flow', zone: 'zone-c', lat: 18.5005, lng: 73.9270, status: 'warning', reading: 730, unit: 'L/min' },
    { id: 'sens-pc202', sid: 'PC-202', type: 'pressure', zone: 'zone-c', lat: 18.5030, lng: 73.9255, status: 'warning', reading: 1.4, unit: 'bar' },
    { id: 'sens-mc401', sid: 'MC-401', type: 'water_meter', zone: 'zone-c', lat: 18.5020, lng: 73.9280, status: 'normal', reading: 48250, unit: 'L' },
    { id: 'sens-fd104', sid: 'FD-104', type: 'flow', zone: 'zone-d', lat: 18.6285, lng: 73.8010, status: 'normal', reading: 980, unit: 'L/min' },
    { id: 'sens-pd203', sid: 'PD-203', type: 'pressure', zone: 'zone-d', lat: 18.6310, lng: 73.7985, status: 'offline', reading: 0, unit: 'bar' },
    { id: 'sens-te302', sid: 'TE-302', type: 'tank_level', zone: 'zone-e', lat: 18.5570, lng: 73.8095, status: 'normal', reading: 70, unit: '%' },
  ];

  const insertSensor = db.prepare('INSERT INTO sensors (id,sensor_id,sensor_type,zone_id,latitude,longitude,status,last_reading,unit,last_updated) VALUES (?,?,?,?,?,?,?,?,?,?)');
  for (const s of sensors) {
    const updated = s.status === 'offline' ? subHours(1, 5) : new Date().toISOString();
    insertSensor.run(s.id, s.sid, s.type, s.zone, s.lat, s.lng, s.status, s.reading, s.unit, updated);
  }

  // ── SENSOR READINGS (7 days, 6/day per sensor) ──
  const insertReading = db.prepare('INSERT INTO sensor_readings (id,sensor_id,flow,pressure,tank_level,consumption,recorded_at) VALUES (?,?,?,?,?,?,?)');
  for (const s of sensors) {
    if (s.status === 'offline') continue;
    for (let day = 7; day >= 0; day--) {
      for (let h = 0; h < 24; h += 4) {
        const d = new Date();
        d.setDate(d.getDate() - day);
        d.setHours(h, 0, 0, 0);
        let flow = null, pressure = null, tank_level = null, consumption = null;
        if (s.type === 'flow') flow = rand(s.reading * 0.9, s.reading * 1.1);
        else if (s.type === 'pressure') pressure = rand(s.reading * 0.92, s.reading * 1.08);
        else if (s.type === 'tank_level') tank_level = rand(Math.max(40, s.reading - 15), Math.min(95, s.reading + 15));
        else if (s.type === 'water_meter') consumption = rand(s.reading * 0.95, s.reading * 1.05);
        insertReading.run(uuidv4(), s.id, flow, pressure, tank_level, consumption, d.toISOString());
      }
    }
  }

  // ── WATER SUPPLY (30 days per zone) ──
  const zoneSupply: Record<string, { supply: [number, number]; consume: [number, number] }> = {
    'zone-a': { supply: [95000, 105000], consume: [78000, 88000] },
    'zone-b': { supply: [130000, 145000], consume: [105000, 120000] },
    'zone-c': { supply: [105000, 115000], consume: [80000, 92000] },
    'zone-d': { supply: [115000, 125000], consume: [95000, 108000] },
    'zone-e': { supply: [75000, 85000], consume: [62000, 72000] },
  };

  const insertSupply = db.prepare('INSERT INTO water_supply (id,zone_id,date,supplied,consumed) VALUES (?,?,?,?,?)');
  for (const [zid, cfg] of Object.entries(zoneSupply)) {
    for (let day = 30; day >= 0; day--) {
      insertSupply.run(uuidv4(), zid, subDays(day), rand(cfg.supply[0], cfg.supply[1]), rand(cfg.consume[0], cfg.consume[1]));
    }
  }

  // ── COMPLAINTS ──
  const complaints = [
    { id: 'comp-001', citizen: 'user-citizen-1', type: 'pipeline_leakage', desc: 'Large water leakage near FC Road junction. Water flooding the road causing traffic issues.', lat: 18.5298, lng: 73.8468, priority: 'critical', status: 'in_progress', worker: 'user-worker-1', zone: 'zone-a', daysAgo: 5 },
    { id: 'comp-002', citizen: 'user-citizen-2', type: 'low_pressure', desc: 'Very low water pressure since 3 days. Water barely reaches 2nd floor.', lat: 18.5065, lng: 73.8082, priority: 'high', status: 'assigned', worker: 'user-worker-2', zone: 'zone-b', daysAgo: 3 },
    { id: 'comp-003', citizen: 'user-citizen-1', type: 'tank_overflow', desc: 'Overhead tank overflowing for past 2 hours. Wasting a lot of water.', lat: 18.5020, lng: 73.9265, priority: 'high', status: 'reported', worker: null, zone: 'zone-c', daysAgo: 1 },
    { id: 'comp-004', citizen: 'user-citizen-2', type: 'no_water', desc: 'No water supply for 2 days. Please check the distribution line.', lat: 18.6292, lng: 73.8000, priority: 'critical', status: 'resolved', worker: 'user-worker-1', zone: 'zone-d', daysAgo: 8 },
    { id: 'comp-005', citizen: 'user-citizen-1', type: 'broken_valve', desc: 'Valve near Aundh park is broken. Water gushing out continuously.', lat: 18.5575, lng: 73.8085, priority: 'high', status: 'verified', worker: null, zone: 'zone-e', daysAgo: 2 },
    { id: 'comp-006', citizen: 'user-citizen-2', type: 'road_leakage', desc: 'Underground pipe burst near Kothrud bus stop. Road sinking.', lat: 18.5080, lng: 73.8070, priority: 'critical', status: 'in_progress', worker: 'user-worker-2', zone: 'zone-b', daysAgo: 4 },
    { id: 'comp-007', citizen: 'user-citizen-1', type: 'low_pressure', desc: 'Pressure fluctuations between 6-8 PM daily. Need inspection.', lat: 18.5312, lng: 73.8482, priority: 'medium', status: 'closed', worker: 'user-worker-1', zone: 'zone-a', daysAgo: 15 },
    { id: 'comp-008', citizen: 'user-citizen-2', type: 'pipeline_leakage', desc: 'Wet patch on wall indicates underground leakage. Getting worse every day.', lat: 18.5025, lng: 73.9268, priority: 'medium', status: 'reported', worker: null, zone: 'zone-c', daysAgo: 1 },
    { id: 'comp-009', citizen: 'user-citizen-1', type: 'other', desc: 'Water has bad smell and color today. Seems contaminated.', lat: 18.6285, lng: 73.7995, priority: 'critical', status: 'resolved', worker: 'user-worker-2', zone: 'zone-d', daysAgo: 10 },
    { id: 'comp-010', citizen: 'user-citizen-2', type: 'no_water', desc: 'Water supply cut for 6 hours without prior notice. Need to restore.', lat: 18.5568, lng: 73.8090, priority: 'high', status: 'assigned', worker: 'user-worker-1', zone: 'zone-e', daysAgo: 2 },
  ];

  const insertComplaint = db.prepare('INSERT INTO complaints (id,citizen_id,problem_type,description,latitude,longitude,priority,status,assigned_worker_id,zone_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
  for (const c of complaints) {
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - c.daysAgo);
    insertComplaint.run(c.id, c.citizen, c.type, c.desc, c.lat, c.lng, c.priority, c.status, c.worker, c.zone, createdAt.toISOString(), new Date().toISOString());
  }

  // ── MAINTENANCE TASKS ──
  const tasks = [
    { id: 'task-001', comp: 'comp-001', worker: 'user-worker-1', status: 'in_progress', priority: 'critical', title: 'Fix Pipeline Leakage - FC Road', desc: 'Repair burst pipeline at FC Road junction. Requires excavation and pipe replacement.', zone: 'zone-a', due: subDays(-1) },
    { id: 'task-002', comp: 'comp-006', worker: 'user-worker-2', status: 'in_progress', priority: 'critical', title: 'Emergency Road Pipe Repair - Kothrud', desc: 'Emergency repair of underground pipe burst near bus stop.', zone: 'zone-b', due: subDays(-2) },
    { id: 'task-003', comp: 'comp-002', worker: 'user-worker-2', status: 'pending', priority: 'high', title: 'Pressure Investigation - Zone B', desc: 'Investigate and fix low pressure issue in Zone B residential area.', zone: 'zone-b', due: subDays(-3) },
    { id: 'task-004', comp: 'comp-004', worker: 'user-worker-1', status: 'completed', priority: 'critical', title: 'Restore Water Supply - Zone D', desc: 'Repaired distribution valve and restored water supply.', zone: 'zone-d', due: subDays(-5) },
    { id: 'task-005', comp: 'comp-007', worker: 'user-worker-1', status: 'completed', priority: 'medium', title: 'Pressure Valve Calibration - Zone A', desc: 'Calibrated pressure reducing valve to fix evening pressure drops.', zone: 'zone-a', due: subDays(-12) },
    { id: 'task-006', comp: null, worker: 'user-worker-2', status: 'pending', priority: 'medium', title: 'Routine Sensor Inspection - Zone C', desc: 'Inspect FC-103 and PC-202 sensors showing warning status. Clean and calibrate.', zone: 'zone-c', due: subDays(-7) },
    { id: 'task-007', comp: 'comp-009', worker: 'user-worker-2', status: 'completed', priority: 'critical', title: 'Water Quality Investigation - Zone D', desc: 'Investigated contamination report. Found and cleared blockage in distribution line.', zone: 'zone-d', due: subDays(-8) },
    { id: 'task-008', comp: null, worker: 'user-worker-1', status: 'pending', priority: 'high', title: 'Pipeline Inspection - PL-203', desc: 'Annual inspection of aging CI pipeline connecting Zone A to Zone D. Check for corrosion.', zone: 'zone-a', due: subDays(-14) },
  ];

  const insertTask = db.prepare('INSERT INTO maintenance_tasks (id,complaint_id,worker_id,status,priority,title,description,zone_id,due_date,notes,completed_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
  for (const t of tasks) {
    const completedAt = t.status === 'completed' ? new Date(Date.now() - Math.random() * 7 * 86400000).toISOString() : null;
    const notes = t.status === 'completed' ? 'Work completed successfully. All systems restored to normal operation.' : null;
    insertTask.run(t.id, t.comp, t.worker, t.status, t.priority, t.title, t.desc, t.zone, t.due, notes, completedAt);
  }

  // ── ALERTS ──
  const alerts = [
    { id: 'alert-001', type: 'Low Pressure Alert', zone: 'zone-c', sensor: 'sens-pc202', severity: 'high', status: 'active', msg: 'Pressure sensor PC-202 in Zone C reading 1.4 bar - below minimum threshold of 1.5 bar.' },
    { id: 'alert-002', type: 'High Water Loss', zone: 'zone-c', sensor: null, severity: 'high', status: 'active', msg: 'Zone C reporting 22.6% water loss - exceeds HIGH threshold (>20%). Possible pipeline leakage.' },
    { id: 'alert-003', type: 'Sensor Offline', zone: 'zone-d', sensor: 'sens-pd203', severity: 'medium', status: 'active', msg: 'Pressure sensor PD-203 in Zone D has not reported data for over 5 hours. Possible hardware fault.' },
    { id: 'alert-004', type: 'Pipeline Inspection Required', zone: 'zone-a', sensor: null, severity: 'medium', status: 'acknowledged', msg: 'Pipeline PL-203 (Zone A to D) is 25+ years old. Scheduled inspection overdue.' },
    { id: 'alert-005', type: 'Low Flow Rate', zone: 'zone-c', sensor: 'sens-fc103', severity: 'medium', status: 'active', msg: 'Flow sensor FC-103 reading 730 L/min - 15% below expected minimum. Possible blockage or leak.' },
    { id: 'alert-006', type: 'High Water Loss', zone: 'zone-b', sensor: null, severity: 'low', status: 'resolved', msg: 'Zone B water loss was 18.2% (MEDIUM). Road pipe repair has resolved the issue.' },
  ];

  const insertAlert = db.prepare('INSERT INTO alerts (id,alert_type,zone_id,sensor_id,severity,status,message) VALUES (?,?,?,?,?,?,?)');
  for (const a of alerts) {
    insertAlert.run(a.id, a.type, a.zone, a.sensor, a.severity, a.status, a.msg);
  }

  // ── NOTIFICATIONS ──
  const notifs = [
    { uid: 'user-admin-1', title: 'New Complaint Reported', msg: 'Citizen Priya Mehta reported tank overflow in Zone C. Complaint #comp-003', type: 'complaint' },
    { uid: 'user-admin-1', title: 'High Water Loss Alert', msg: 'Zone C water loss has exceeded 20% threshold. Immediate action required.', type: 'alert' },
    { uid: 'user-admin-1', title: 'Sensor Offline', msg: 'Pressure sensor PD-203 in Zone D has gone offline. Please investigate.', type: 'alert' },
    { uid: 'user-admin-1', title: 'Maintenance Completed', msg: 'Worker Suresh Patil has completed task #task-004 - Water supply restored in Zone D.', type: 'maintenance' },
    { uid: 'user-worker-1', title: 'New Task Assigned', msg: 'You have been assigned: Fix Pipeline Leakage - FC Road (Priority: CRITICAL)', type: 'task' },
    { uid: 'user-worker-1', title: 'Task Overdue', msg: 'Task #task-008 Pipeline Inspection PL-203 is overdue. Please update status.', type: 'warning' },
    { uid: 'user-worker-2', title: 'New Task Assigned', msg: 'You have been assigned: Emergency Road Pipe Repair - Kothrud (Priority: CRITICAL)', type: 'task' },
    { uid: 'user-worker-2', title: 'Complaint Update', msg: 'Complaint #comp-002 has been escalated to HIGH priority by admin.', type: 'info' },
    { uid: 'user-citizen-1', title: 'Complaint Status Update', msg: 'Your complaint #comp-001 (Pipeline Leakage) has been assigned to Suresh Patil and is now In Progress.', type: 'complaint' },
    { uid: 'user-citizen-1', title: 'Complaint Resolved', msg: 'Your complaint #comp-007 has been resolved. We hope the issue is fixed!', type: 'complaint' },
    { uid: 'user-citizen-2', title: 'Complaint Acknowledged', msg: 'Your complaint #comp-002 (Low Pressure) has been verified and a worker is being assigned.', type: 'complaint' },
  ];

  const insertNotif = db.prepare('INSERT INTO notifications (id,user_id,title,message,type) VALUES (?,?,?,?,?)');
  for (const n of notifs) {
    insertNotif.run(uuidv4(), n.uid, n.title, n.msg, n.type);
  }

  console.log('✅ Database seeded successfully!');
  console.log('   👤 Demo Users:');
  console.log('      Admin:  admin@smartwater.gov   / Admin@123');
  console.log('      Worker: worker@smartwater.gov  / Worker@123');
  console.log('      Citizen: citizen@smartwater.gov / Citizen@123');
}
