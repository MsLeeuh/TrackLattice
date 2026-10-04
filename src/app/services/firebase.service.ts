import { Injectable } from '@angular/core';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private readonly app: FirebaseApp;
  public readonly db: Firestore;

  constructor() {
    this.app = !getApps().length
      ? initializeApp((environment as any).firebase)
      : getApp();
    this.db = getFirestore(this.app);
  }
}