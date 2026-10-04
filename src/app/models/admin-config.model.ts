export interface AttributeDefinition {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'textarea';
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

export interface EquipmentTypeConfig {
  name: string;
  attributes?: AttributeDefinition[];
}

export interface DepartmentConfig {
  name: string;
  code: string;
}

export interface JurisdictionConfig {
  name: string;
  buildings: string[];
}

export interface AppAdminConfig {
  departments: DepartmentConfig[];
  jurisdictions: JurisdictionConfig[];
  equipmentTypes: EquipmentTypeConfig[];
  customAttributes: AttributeDefinition[];
}