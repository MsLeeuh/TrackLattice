import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc,
  CollectionReference
} from 'firebase/firestore';
import { Asset } from '../models/asset.model';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class AssetService {
  private readonly STORAGE_KEY = 'it_inventory_assets';
  private assetsSubject = new BehaviorSubject<Asset[]>([]);
  public assets$: Observable<Asset[]> = this.assetsSubject.asObservable();
  private assetsCollection: CollectionReference;

  constructor(private firebaseService: FirebaseService) {
    this.assetsCollection = collection(this.firebaseService.db, 'assets');
    this.loadFromStorage();
    this.initFirestoreSync();
  }

  private loadFromStorage() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        this.assetsSubject.next(parsed);
      } catch (e) {
        this.assetsSubject.next([]);
      }
    }
  }

  private saveToStorage(assets: Asset[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(assets));
    this.assetsSubject.next(assets);
  }

  private initFirestoreSync() {
    onSnapshot(this.assetsCollection, (snapshot) => {
      if (!snapshot.empty) {
        const remoteAssets = snapshot.docs.map(d => d.data() as Asset);
        this.saveToStorage(remoteAssets);
      }
    }, (error) => {
      console.warn('Firestore real-time sync error (falling back to local cache):', error);
    });
  }

  private getDocId(asset: Partial<Asset> | { propTag?: string; serialNumber?: string }): string {
    return asset.propTag || asset.serialNumber || Date.now().toString();
  }

  getAssets(): Observable<Asset[]> {
    return this.assets$;
  }

  addAsset(asset: Asset) {
    const current = this.assetsSubject.value;
    const updated = [asset, ...current];
    this.saveToStorage(updated);

    const docId = this.getDocId(asset);
    const docRef = doc(this.firebaseService.db, 'assets', docId);
    setDoc(docRef, { ...asset }).catch(err => console.error('Error adding to Firestore:', err));
  }

  updateAsset(updatedAsset: Asset) {
    const currentAssets = this.assetsSubject.getValue();
    const index = currentAssets.findIndex(a => 
      (a.serialNumber && a.serialNumber === updatedAsset.serialNumber) ||
      (a.propTag && a.propTag === updatedAsset.propTag)
    );
    if (index !== -1) {
      currentAssets[index] = { ...updatedAsset };
      this.saveToStorage(currentAssets);

      const docId = this.getDocId(updatedAsset);
      const docRef = doc(this.firebaseService.db, 'assets', docId);
      setDoc(docRef, { ...updatedAsset }, { merge: true }).catch(err => console.error('Error updating in Firestore:', err));
    }
  }

  deleteAsset(assetIdOrTag: string) {
    const current = this.assetsSubject.value;
    const updated = current.filter(a => a.propTag !== assetIdOrTag && a.serialNumber !== assetIdOrTag);
    this.saveToStorage(updated);

    const docRef = doc(this.firebaseService.db, 'assets', assetIdOrTag);
    deleteDoc(docRef).catch(err => console.error('Error deleting from Firestore:', err));
  }
}