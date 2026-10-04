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
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonButton,
  IonIcon
} from '@ionic/angular';
import { AssetService } from '../services/asset.service';
import { ConfigService } from '../services/config.service';
import { AppAdminConfig, AttributeDefinition } from '../models/admin-config.model';
import { BarcodeScannerComponent } from '../components/barcode-scanner.component';
import { addIcons } from 'ionicons';
import { barcodeOutline, cameraOutline } from 'ionicons/icons';

interface DepartmentOption {
  name: string;
  code: string;
}

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonButton,
    IonIcon
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class Tab2Page implements OnInit, OnDestroy {
  intakeMode: any = 'single';

  // Single Intake Form
  singleForm: any = {
    propTag: '',
    serialNumber: '',
    equipmentType: '',
    status: 'Receiving',
    make: '',
    model: '',
    deviceName: '',
    dynamicData: {},
    assignedEmployee: '',
    department: '',
    location: { jurisdiction: '', building: '', floor: '', roomOrCloset: '' },
    macAddress: ''
  };

  selectedDeptCode: string = '';
  dynamicAttributes: AttributeDefinition[] = [];
  availableBuildings: string[] = [];

  // IP Octets
  ipOctets = { oct1: '', oct2: '', oct3: '', oct4: '' };

  // Batch PO Form
  poBatch: any = {
    poNumber: '',
    vendor: '',
    defaultCategory: '',
    expectedCount: null,
    items: []
  };

  // Department Legacy Batch Form
  deptBatchPreset: any = {
    deptCode: '',
    department: '',
    status: 'Deployed',
    jurisdiction: '',
    building: '',
    floor: '',
    roomOrCloset: ''
  };
  deptBatchAvailableBuildings: string[] = [];
  deptBatchQuickTag: string = '';
  deptBatchItems: any[] = [];

  // Dynamic Options from ConfigService
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
      barcodeOutline,
      cameraOutline
    });
  }

  ngOnInit() {
    this.configSub = this.configService.config$.subscribe((cfg: AppAdminConfig) => {
      if (!cfg) return;

      this.equipmentTypes = cfg.equipmentTypes ? cfg.equipmentTypes.map((t) => t.name) : [];
      this.departments = cfg.departments ? cfg.departments.map((d) => ({ name: d.name, code: d.code })) : [];

      const mapping: { [key: string]: string[] } = {};
      if (cfg.jurisdictions) {
        cfg.jurisdictions.forEach((j) => {
          mapping[j.name] = j.buildings || [];
        });
      }
      this.buildingMapping = mapping;
      this.jurisdictions = Object.keys(mapping);
    });
  }

  ngOnDestroy() {
    if (this.configSub) {
      this.configSub.unsubscribe();
    }
  }

  // =========================================================================
  // 1. SINGLE ITEM INTAKE HANDLERS
  // =========================================================================

  onEquipmentTypeChange() {
    const selectedType = this.singleForm.equipmentType;
    const cfg = this.configService.currentConfig;
    if (cfg && cfg.equipmentTypes) {
      const match = cfg.equipmentTypes.find((t) => t.name === selectedType);
      this.dynamicAttributes = match?.attributes || [];
    } else {
      this.dynamicAttributes = [];
    }
    this.singleForm.dynamicData = {};
    this.updateDeviceName();
  }

  onStatusChange() {
    if (this.singleForm.status === 'Storage') {
      this.selectedDeptCode = 'SCIT';
      this.singleForm.department = 'Information Technology';
      this.singleForm.location = {
        jurisdiction: 'Ashville',
        building: 'Technology and H.R. Center',
        floor: 'Basement',
        roomOrCloset: 'IT Storage'
      };
      this.availableBuildings = this.buildingMapping['Ashville'] || [];
      this.updateDeviceName();
    }
  }

  onDeptChange(code: string) {
    this.selectedDeptCode = code;
    const match = this.departments.find((d) => d.code === code);
    if (match) this.singleForm.department = match.name;
    this.updateDeviceName();
  }

  onJurisdictionChange(jurisdiction: string) {
    this.singleForm.location.jurisdiction = jurisdiction;
    this.availableBuildings = this.buildingMapping[jurisdiction] || [];
    this.singleForm.location.building = '';
  }

  updateDeviceName() {
    const type = this.singleForm.equipmentType;
    if (type !== 'Laptop' && type !== 'Workstation') return;
    let deptPrefix = this.selectedDeptCode || 'DEPT';
    if (type === 'Laptop') deptPrefix += 'LT';
    const yy = new Date().getFullYear().toString().slice(-2);
    const tag = this.singleForm.propTag || 'PENDING';
    this.singleForm.deviceName = `${deptPrefix}-${yy}-${tag}`;
  }

  simulateADLookup() {
    const val = this.singleForm.assignedEmployee;
    if (val && val.length > 2) {
      // Active Directory Lookup simulation
    }
  }

  async scanSingleBarcode(targetField: 'propTag' | 'serialNumber') {
    const modal = await this.modalCtrl.create({
      component: BarcodeScannerComponent,
      componentProps: {
        title: targetField === 'propTag' ? 'Scan Property Tag' : 'Scan Serial Number'
      }
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data && data.scannedCode) {
      if (targetField === 'propTag') {
        this.singleForm.propTag = data.scannedCode;
        this.updateDeviceName();
      } else if (targetField === 'serialNumber') {
        this.singleForm.serialNumber = data.scannedCode;
      }
    }
  }

  autoAdvanceOctet(event: any, nextInput?: any) {
    if (event.target.value.length >= 3 && nextInput) {
      nextInput.focus();
    }
  }

  async saveSingleAsset() {
    if (!this.singleForm.propTag || !this.singleForm.serialNumber) {
      alert('Property Tag and Serial Number are required!');
      return;
    }

    const newAsset: any = {
      id: Math.random().toString(36).substring(2, 9),
      ...this.singleForm,
      createdAt: new Date().toISOString()
    };

    await this.assetService.addAsset(newAsset);
    alert('Asset saved successfully!');
    this.resetSingleForm();
    this.router.navigate(['/tabs/tab1']);
  }

  resetSingleForm() {
    this.singleForm = {
      propTag: '',
      serialNumber: '',
      equipmentType: '',
      status: 'Receiving',
      make: '',
      model: '',
      deviceName: '',
      dynamicData: {},
      assignedEmployee: '',
      department: '',
      location: { jurisdiction: '', building: '', floor: '', roomOrCloset: '' },
      macAddress: ''
    };
    this.selectedDeptCode = '';
    this.dynamicAttributes = [];
  }

  // =========================================================================
  // 2. PO BATCH INTAKE HANDLERS
  // =========================================================================

  async scanShippingTag() {
    const modal = await this.modalCtrl.create({
      component: BarcodeScannerComponent,
      componentProps: { title: 'Scan Shipping Box Label' }
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data && data.scannedCode) {
      this.poBatch.items.unshift({
        propTag: data.scannedCode,
        serialNumber: ''
      });
    }
  }

  addPoRow() {
    this.poBatch.items.push({ propTag: '', serialNumber: '' });
  }

  removePoRow(index: number) {
    this.poBatch.items.splice(index, 1);
  }

  async commitPoBatch() {
    if (!this.poBatch.poNumber) {
      alert('PO Number is required!');
      return;
    }

    for (const item of this.poBatch.items) {
      if (item.propTag || item.serialNumber) {
        const asset: any = {
          id: Math.random().toString(36).substring(2, 9),
          propTag: item.propTag,
          serialNumber: item.serialNumber,
          equipmentType: this.poBatch.defaultCategory || 'Equipment',
          status: 'Receiving',
          poNumber: this.poBatch.poNumber,
          vendor: this.poBatch.vendor,
          createdAt: new Date().toISOString()
        };
        await this.assetService.addAsset(asset);
      }
    }

    alert(`Successfully committed ${this.poBatch.items.length} assets from PO ${this.poBatch.poNumber}!`);
    this.poBatch = { poNumber: '', vendor: '', defaultCategory: '', expectedCount: null, items: [] };
    this.router.navigate(['/tabs/tab1']);
  }

  // =========================================================================
  // 3. DEPARTMENT LEGACY BATCH INTAKE HANDLERS
  // =========================================================================

  onDeptBatchPresetDeptChange(code: string) {
    this.deptBatchPreset.deptCode = code;
    const match = this.departments.find((d) => d.code === code);
    if (match) this.deptBatchPreset.department = match.name;
  }

  onDeptBatchJurisdictionChange(jurisdiction: string) {
    this.deptBatchPreset.jurisdiction = jurisdiction;
    this.deptBatchAvailableBuildings = this.buildingMapping[jurisdiction] || [];
    this.deptBatchPreset.building = '';
  }

  addDeptBatchItem() {
    const tag = this.deptBatchQuickTag.trim();
    if (!tag) return;

    const defaultType = (this.equipmentTypes && this.equipmentTypes.length > 0) ? this.equipmentTypes[0] : 'Workstation';
    this.deptBatchItems.unshift({
      propTag: tag,
      serialNumber: '',
      equipmentType: defaultType,
      make: ''
    });
    this.deptBatchQuickTag = '';
  }

  async triggerDeptBatchCameraScan() {
    const modal = await this.modalCtrl.create({
      component: BarcodeScannerComponent,
      componentProps: { title: 'Scan Legacy Property Tag' }
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data && data.scannedCode) {
      const defaultType = (this.equipmentTypes && this.equipmentTypes.length > 0) ? this.equipmentTypes[0] : 'Workstation';
      this.deptBatchItems.unshift({
        propTag: data.scannedCode,
        serialNumber: '',
        equipmentType: defaultType,
        make: ''
      });
    }
  }

  removeDeptBatchItem(index: number) {
    this.deptBatchItems.splice(index, 1);
  }

  clearDeptBatch() {
    this.deptBatchItems = [];
  }

  async commitDeptBatch() {
    if (!this.deptBatchPreset.department || !this.deptBatchPreset.jurisdiction || !this.deptBatchPreset.building) {
      alert('Please set Department, Jurisdiction, and Building presets first!');
      return;
    }

    for (const item of this.deptBatchItems) {
      const asset: any = {
        id: Math.random().toString(36).substring(2, 9),
        propTag: item.propTag,
        serialNumber: item.serialNumber,
        equipmentType: item.equipmentType,
        make: item.make,
        department: this.deptBatchPreset.department,
        status: this.deptBatchPreset.status,
        location: {
          jurisdiction: this.deptBatchPreset.jurisdiction,
          building: this.deptBatchPreset.building,
          floor: this.deptBatchPreset.floor,
          roomOrCloset: this.deptBatchPreset.roomOrCloset
        },
        createdAt: new Date().toISOString()
      };
      await this.assetService.addAsset(asset);
    }

    alert(`Successfully created ${this.deptBatchItems.length} legacy assets for ${this.deptBatchPreset.department}!`);
    this.deptBatchItems = [];
    this.router.navigate(['/tabs/tab1']);
  }
}