import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { 
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  saveOutline, 
  addOutline, 
  createOutline, 
  trashOutline, 
  closeCircleOutline 
} from 'ionicons/icons';

import { ConfigService } from '../services/config.service';
import { AppAdminConfig, EquipmentTypeConfig } from '../models/admin-config.model';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
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
    IonContent,
    IonSegment,
    IonSegmentButton,
    IonLabel
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class Tab3Page implements OnInit, OnDestroy {
  activeSegment: any = 'attributes';

  config: AppAdminConfig = {
    departments: [],
    jurisdictions: [],
    equipmentTypes: [],
    customAttributes: []
  };

  selectedCategoryName: string = '';
  selectedCategoryConfig: EquipmentTypeConfig | null = null;

  private configSub!: Subscription;

  constructor(private configService: ConfigService) {
    addIcons({
      saveOutline,
      addOutline,
      createOutline,
      trashOutline,
      closeCircleOutline
    });
  }

  ngOnInit() {
    this.configSub = this.configService.config$.subscribe((cfg: AppAdminConfig) => {
      if (!cfg) return;
      this.config = JSON.parse(JSON.stringify(cfg));

      if (this.selectedCategoryName) {
        this.onCategorySelect();
      } else if (this.config.equipmentTypes && this.config.equipmentTypes.length > 0) {
        this.selectedCategoryName = this.config.equipmentTypes[0].name;
        this.onCategorySelect();
      }
    });
  }

  ngOnDestroy() {
    if (this.configSub) {
      this.configSub.unsubscribe();
    }
  }

  onCategorySelect() {
    const match = this.config.equipmentTypes.find((t) => t.name === this.selectedCategoryName);
    this.selectedCategoryConfig = match || null;
  }

  promptAddCategory() {
    const name = prompt('Enter new Equipment Category Name (e.g. Printer, Tablet, AP):');
    if (name && name.trim()) {
      const trimmed = name.trim();
      if (!this.config.equipmentTypes.some((t) => t.name === trimmed)) {
        this.config.equipmentTypes.push({ name: trimmed, attributes: [] });
        this.selectedCategoryName = trimmed;
        this.onCategorySelect();
      }
    }
  }

  deleteCategory(catName: string) {
    if (!confirm(`Are you sure you want to delete the category "${catName}"?`)) return;
    this.config.equipmentTypes = this.config.equipmentTypes.filter((t) => t.name !== catName);
    this.selectedCategoryName = this.config.equipmentTypes.length > 0 ? this.config.equipmentTypes[0].name : '';
    this.onCategorySelect();
  }

  promptAddAttributeToCategory() {
    if (!this.selectedCategoryConfig) return;
    const key = prompt('Enter Attribute Key (e.g. portCount, ramGB, color):');
    if (!key || !key.trim()) return;

    const label = prompt('Enter Display Label (e.g. Port Count, RAM Size):') || key;
    const typeStr = prompt('Enter Input Type (text, number, select, boolean):', 'text') || 'text';
    const type = (['text', 'number', 'select', 'boolean'].includes(typeStr) ? typeStr : 'text') as any;

    if (!this.selectedCategoryConfig.attributes) {
      this.selectedCategoryConfig.attributes = [];
    }

    this.selectedCategoryConfig.attributes.push({
      key: key.trim(),
      label: label.trim(),
      type: type,
      required: false
    });
  }

  editCategoryAttribute(index: number) {
    if (!this.selectedCategoryConfig || !this.selectedCategoryConfig.attributes) return;
    const attr = this.selectedCategoryConfig.attributes[index];
    const newLabel = prompt('Update Display Label:', attr.label);
    if (newLabel !== null && newLabel.trim()) {
      attr.label = newLabel.trim();
    }
    const newType = prompt('Update Input Type (text, number, select, boolean):', attr.type);
    if (newType && ['text', 'number', 'select', 'boolean'].includes(newType.trim())) {
      attr.type = newType.trim() as any;
    }
  }

  removeAttributeFromCategory(index: number) {
    if (this.selectedCategoryConfig && this.selectedCategoryConfig.attributes) {
      this.selectedCategoryConfig.attributes.splice(index, 1);
    }
  }

  promptCreateMasterAttribute() {
    const key = prompt('Enter Master Attribute Key:');
    if (!key || !key.trim()) return;
    const label = prompt('Enter Display Label:') || key;
    const typeStr = prompt('Enter Input Type (text, number, select, boolean):', 'text') || 'text';

    if (!this.config.customAttributes) this.config.customAttributes = [];
    this.config.customAttributes.push({
      key: key.trim(),
      label: label.trim(),
      type: typeStr as any
    });
  }

  editMasterAttribute(key: string) {
    if (!this.config.customAttributes) return;
    const attr = this.config.customAttributes.find((a) => a.key === key);
    if (!attr) return;

    const newLabel = prompt('Update Display Label:', attr.label);
    if (newLabel !== null && newLabel.trim()) {
      attr.label = newLabel.trim();
    }
    const newType = prompt('Update Input Type (text, number, select, boolean):', attr.type);
    if (newType && ['text', 'number', 'select', 'boolean'].includes(newType.trim())) {
      attr.type = newType.trim() as any;
    }
  }

  deleteMasterAttribute(key: string) {
    if (this.config.customAttributes) {
      this.config.customAttributes = this.config.customAttributes.filter((a) => a.key !== key);
    }
  }

  addDepartmentRow() {
    this.config.departments.push({ name: '', code: '' });
  }

  removeDepartmentRow(index: number) {
    this.config.departments.splice(index, 1);
  }

  promptAddJurisdiction() {
    const name = prompt('Enter new Jurisdiction name (e.g. Ashville, Pell City):');
    if (name && name.trim()) {
      this.config.jurisdictions.push({ name: name.trim(), buildings: [] });
    }
  }

  renameJurisdiction(jIndex: number) {
    const current = this.config.jurisdictions[jIndex].name;
    const updated = prompt('Edit Jurisdiction Name:', current);
    if (updated !== null && updated.trim()) {
      this.config.jurisdictions[jIndex].name = updated.trim();
    }
  }

  removeJurisdiction(index: number) {
    this.config.jurisdictions.splice(index, 1);
  }

  promptAddBuilding(jIndex: number) {
    const name = prompt('Enter Building Name:');
    if (name && name.trim()) {
      if (!this.config.jurisdictions[jIndex].buildings) {
        this.config.jurisdictions[jIndex].buildings = [];
      }
      this.config.jurisdictions[jIndex].buildings.push(name.trim());
    }
  }

  renameBuilding(jIndex: number, bIndex: number) {
    const current = this.config.jurisdictions[jIndex].buildings[bIndex];
    const updated = prompt('Edit Building Name:', current);
    if (updated !== null && updated.trim()) {
      this.config.jurisdictions[jIndex].buildings[bIndex] = updated.trim();
    }
  }

  removeBuilding(jIndex: number, bIndex: number) {
    this.config.jurisdictions[jIndex].buildings.splice(bIndex, 1);
  }

  async saveConfiguration() {
    try {
      await this.configService.saveConfig(this.config);
      alert('Configuration saved successfully and synced to Firebase!');
    } catch (e) {
      alert('Error saving configuration to Firebase.');
      console.error(e);
    }
  }
}