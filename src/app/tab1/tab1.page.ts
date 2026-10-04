import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { 
  ModalController,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonSearchbar,
  IonContent,
  IonChip,
  IonModal
} from '@ionic/angular';
import { Asset } from '../models/asset.model';
import { AssetService } from '../services/asset.service';
import { ConfigService } from '../services/config.service';
import { AppAdminConfig } from '../models/admin-config.model';
import { addIcons } from 'ionicons';
import { 
  addOutline, 
  barcodeOutline, 
  searchOutline, 
  createOutline, 
  trashOutline 
} from 'ionicons/icons';

interface DepartmentOption {
  name: string;
  code: string;
}

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonSearchbar,
    IonContent,
    IonChip,
    IonModal
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class Tab1Page implements OnInit, OnDestroy {
  assets: Asset[] = [];
  filteredAssets: Asset[] = [];
  searchTerm: string = '';
  selectedAsset: Asset | null = null;
  isDetailOpen: boolean = false;

  // Editing State
  isEditing: boolean = false;
  editFormData: any = {};
  editSelectedDeptCode: string = '';
  editAvailableBuildings: string[] = [];
  editNoteText: string = '';

  // Dynamic Options (Populated from ConfigService)
  equipmentTypes: string[] = [];
  departments: DepartmentOption[] = [];
  buildingMapping: { [key: string]: string[] } = {};
  jurisdictions: string[] = [];

  private configSub!: Subscription;

  constructor(
    private assetService: AssetService,
    private configService: ConfigService,
    private modalCtrl: ModalController,
    private router: Router
  ) {
    addIcons({
      addOutline,
      barcodeOutline,
      searchOutline,
      createOutline,
      trashOutline
    });
  }

  ngOnInit() {
    // 1. Subscribe to real-time Asset Data
    this.assetService.getAssets().subscribe((data) => {
      this.assets = data;
      this.applyFilter();
    });

    // 2. Subscribe to Dynamic Admin Configuration
    this.configSub = this.configService.config$.subscribe((cfg: AppAdminConfig) => {
      if (!cfg) return;

      // Extract equipment type names
      this.equipmentTypes = cfg.equipmentTypes
        ? cfg.equipmentTypes.map((t) => t.name)
        : [];

      // Extract departments
      this.departments = cfg.departments
        ? cfg.departments.map((d) => ({ name: d.name, code: d.code }))
        : [];

      // Build building hierarchy mapping
      const mapping: { [key: string]: string[] } = {};
      if (cfg.jurisdictions) {
        cfg.jurisdictions.forEach((j) => {
          mapping[j.name] = j.buildings || [];
        });
      }
      this.buildingMapping = mapping;
      this.jurisdictions = Object.keys(mapping);

      // Refresh building dropdown if currently editing an asset
      if (this.isEditing && this.editFormData?.location?.jurisdiction) {
        this.editAvailableBuildings =
          this.buildingMapping[this.editFormData.location.jurisdiction] || [];
      }
    });
  }

  ngOnDestroy() {
    if (this.configSub) {
      this.configSub.unsubscribe();
    }
  }

  onSearchChange(event: any) {
    this.searchTerm = event?.target?.value || '';
    this.applyFilter();
  }

  applyFilter() {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredAssets = [...this.assets];
    } else {
      this.filteredAssets = this.assets.filter(
        (a) =>
          (a.propTag && a.propTag.toLowerCase().includes(term)) ||
          (a.serialNumber && a.serialNumber.toLowerCase().includes(term)) ||
          (a.model && a.model.toLowerCase().includes(term)) ||
          (a.deviceName && a.deviceName.toLowerCase().includes(term)) ||
          (a.assignedEmployee && a.assignedEmployee.toLowerCase().includes(term))
      );
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Deployed':
        return 'success';
      case 'Staging':
        return 'tertiary';
      case 'Pending Deployment':
        return 'warning';
      case 'Receiving':
        return 'medium';
      case 'Storage':
        return 'primary';
      case 'Retired / Archived':
        return 'dark';
      case 'Disposal':
        return 'danger';
      default:
        return 'primary';
    }
  }

  goToNewAsset() {
    this.router.navigate(['/tabs/tab2']);
  }

  startScan() {
    // Barcode camera scanner hook
  }

  openDetail(asset: Asset) {
    this.selectedAsset = asset;
    this.isDetailOpen = true;
    this.isEditing = false;
  }

  closeDetail() {
    this.selectedAsset = null;
    this.isDetailOpen = false;
    this.isEditing = false;
  }

  toggleEditMode() {
    if (!this.isEditing && this.selectedAsset) {
      this.editFormData = {
        ...this.selectedAsset,
        location: {
          jurisdiction: this.selectedAsset.location?.jurisdiction || '',
          building: this.selectedAsset.location?.building || '',
          floor: this.selectedAsset.location?.floor || '',
          roomOrCloset: this.selectedAsset.location?.roomOrCloset || ''
        },
        notes: this.selectedAsset.notes ? [...this.selectedAsset.notes] : []
      };

      const deptMatch = this.departments.find(
        (d) => d.name === this.editFormData.department
      );
      this.editSelectedDeptCode = deptMatch ? deptMatch.code : '';
      this.editAvailableBuildings =
        this.buildingMapping[this.editFormData.location.jurisdiction] || [];
      this.editNoteText = '';

      this.isEditing = true;
    } else {
      this.isEditing = false;
    }
  }

  onEditDeptChange(code: string) {
    this.editSelectedDeptCode = code;
    const match = this.departments.find((d) => d.code === code);
    if (match) this.editFormData.department = match.name;
    this.updateEditDeviceName();
  }

  onEditJurisdictionChange(jurisdiction: string) {
    this.editFormData.location.jurisdiction = jurisdiction;
    this.editAvailableBuildings = this.buildingMapping[jurisdiction] || [];
    this.editFormData.location.building = '';
  }

  updateEditDeviceName() {
    const type = this.editFormData.equipmentType;
    if (type !== 'Laptop' && type !== 'Workstation') return;
    let deptPrefix = this.editSelectedDeptCode || 'DEPT';
    if (type === 'Laptop') deptPrefix += 'LT';
    const yy = new Date().getFullYear().toString().slice(-2);
    const tag = this.editFormData.propTag || 'PENDING';
    this.editFormData.deviceName = `${deptPrefix}-${yy}-${tag}`;
  }

  simulateEditADLookup() {
    const val = this.editFormData.assignedEmployee;
    if (val && val.length > 2) {
      this.editFormData.employeeEmail = `${val
        .toLowerCase()
        .replace(/\s+/g, '.')}@stclairco.com`;
    }
  }

  onEditStatusChange() {
    const status = this.editFormData.status;
    if (
      status === 'Storage' ||
      status === 'Retired / Archived' ||
      status === 'Disposal'
    ) {
      this.editSelectedDeptCode = 'SCIT';
      this.editFormData.department = 'Information Technology';
      this.editFormData.assignedEmployee = '';
      this.editFormData.employeeEmail = '';
      this.editFormData.location = {
        jurisdiction: 'Ashville',
        building: 'Technology and H.R. Center',
        floor: 'Basement',
        roomOrCloset: status === 'Storage' ? 'IT Storage' : 'Holding'
      };
      this.editAvailableBuildings = this.buildingMapping['Ashville'] || [];
      this.updateEditDeviceName();
    }
  }

  saveAssetEdits() {
    if (this.editNoteText.trim()) {
      if (!this.editFormData.notes) this.editFormData.notes = [];
      this.editFormData.notes.push({
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toISOString(),
        author: 'Tech',
        text: this.editNoteText.trim(),
        systemGenerated: false
      });
    }

    this.assetService.updateAsset(this.editFormData);
    this.selectedAsset = { ...this.editFormData };
    this.isEditing = false;
  }
}