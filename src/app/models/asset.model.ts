export interface NoteEntry {
  id: string;
  timestamp: string;
  author: string;
  text: string;
  systemGenerated?: boolean;
}

export interface AssetLocation {
  jurisdiction?: string;
  building?: string;
  floor?: string;
  roomOrCloset?: string;
}

export interface Asset {
  id: string;
  propTag: string;
  serialNumber: string;
  equipmentType: string;
  status: string;
  make?: string;
  model?: string;
  deviceName?: string;
  department?: string;
  assignedEmployee?: string;
  employeeEmail?: string;
  location?: AssetLocation;
  specifications?: any;    
  dynamicData?: any;       
  notes?: NoteEntry[];
  poNumber?: string;
  vendor?: string;
  createdAt?: string;
}