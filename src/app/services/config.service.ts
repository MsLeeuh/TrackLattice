import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { AppAdminConfig } from '../models/admin-config.model';
import { FirebaseService } from './firebase.service';

const LOCAL_STORAGE_KEY = 'hw_tracker_admin_config';
const CONFIG_DOC_PATH = 'config/app_config';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private configSubject = new BehaviorSubject<AppAdminConfig>(this.getDefaultConfig());
  public config$: Observable<AppAdminConfig> = this.configSubject.asObservable();

  constructor(private firebaseService: FirebaseService) {
    this.loadFromLocalStorage();
    this.initFirestoreListener();
  }

  public get currentConfig(): AppAdminConfig {
    return this.configSubject.value;
  }

  private initFirestoreListener() {
    const configDocRef = doc(this.firebaseService.db, CONFIG_DOC_PATH);

    onSnapshot(
      configDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const remoteConfig = snapshot.data() as AppAdminConfig;
          this.applyConfigUpdate(remoteConfig);
        } else {
          console.warn('No remote configuration found in Firestore. Seeding defaults...');
          this.saveConfig(this.getDefaultConfig());
        }
      },
      (error) => {
        console.error('Firestore Config Listener Error:', error);
      }
    );
  }

  public async saveConfig(newConfig: AppAdminConfig): Promise<void> {
    try {
      this.applyConfigUpdate(newConfig);
      const configDocRef = doc(this.firebaseService.db, CONFIG_DOC_PATH);
      await setDoc(configDocRef, newConfig, { merge: true });
    } catch (err) {
      console.error('Failed to save configuration to Firestore:', err);
      throw err;
    }
  }

  private applyConfigUpdate(config: AppAdminConfig) {
    this.configSubject.next(config);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.warn('Unable to write configuration to localStorage', e);
    }
  }

  private loadFromLocalStorage() {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as AppAdminConfig;
        this.configSubject.next(parsed);
      }
    } catch (e) {
      console.warn('Failed to parse cached configuration from localStorage', e);
    }
  }

  private getDefaultConfig(): AppAdminConfig {
    return {
      departments: [
        { name: 'Information Technology', code: 'SCIT' },
        { name: "Sheriff's Office", code: 'SHRF' },
        { name: 'Probate Court', code: 'PROB' },
        { name: 'Road Department', code: 'ROAD' },
        { name: 'County Commission', code: 'COMM' },
        { name: 'Revenue Commission', code: 'REV' }
      ],
      jurisdictions: [
        {
          name: 'Ashville',
          buildings: [
            'Technology and H.R. Center',
            'Ashville Courthouse',
            'Ashville Annex',
            'Road Department Shop'
          ]
        },
        {
          name: 'Pell City',
          buildings: [
            'Pell City Courthouse',
            'Pell City Complex',
            'St. Clair County Jail'
          ]
        }
      ],
      equipmentTypes: [
        {
          name: 'Laptop',
          attributes: [
            { key: 'cpu', label: 'CPU / Processor', type: 'text', required: true, placeholder: 'e.g. Intel i7-1185G7' },
            { key: 'ramGB', label: 'RAM (GB)', type: 'number', required: true, placeholder: '16' },
            { key: 'storageGB', label: 'Storage Size (GB)', type: 'number', required: true, placeholder: '512' },
            { key: 'storageType', label: 'Storage Type', type: 'select', options: ['NVMe SSD', 'SATA SSD', 'HDD'], required: true }
          ]
        },
        {
          name: 'Workstation',
          attributes: [
            { key: 'cpu', label: 'CPU / Processor', type: 'text', required: true, placeholder: 'e.g. Intel i9-12900K' },
            { key: 'ramGB', label: 'RAM (GB)', type: 'number', required: true, placeholder: '32' },
            { key: 'storageGB', label: 'Storage Size (GB)', type: 'number', required: true, placeholder: '1000' },
            { key: 'storageType', label: 'Storage Type', type: 'select', options: ['NVMe SSD', 'SATA SSD'], required: true }
          ]
        },
        {
          name: 'Switch',
          attributes: [
            { key: 'portCount', label: 'Port Count', type: 'number', required: true, placeholder: '48' },
            { key: 'poeSupported', label: 'PoE Supported', type: 'boolean', required: false },
            { key: 'managementIp', label: 'Management IP', type: 'text', required: false, placeholder: '10.10.X.X' }
          ]
        },
        {
          name: 'Access Point',
          attributes: [
            { key: 'wifiStandard', label: 'Wi-Fi Standard', type: 'select', options: ['Wi-Fi 6E', 'Wi-Fi 6', 'Wi-Fi 5'], required: true },
            { key: 'macAddress', label: 'MAC Address', type: 'text', required: true, placeholder: '00:1A:2B:3C:4D:5E' }
          ]
        }
      ],
      customAttributes: [
        { key: 'cpu', label: 'CPU / Processor', type: 'text' },
        { key: 'ramGB', label: 'RAM (GB)', type: 'number' },
        { key: 'storageGB', label: 'Storage Size (GB)', type: 'number' },
        { key: 'portCount', label: 'Port Count', type: 'number' },
        { key: 'macAddress', label: 'MAC Address', type: 'text' }
      ]
    };
  }
}