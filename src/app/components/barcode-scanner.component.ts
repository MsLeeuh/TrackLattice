import { Component, OnInit, OnDestroy, Input, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalController } from '@ionic/angular';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';

@Component({
  selector: 'app-barcode-scanner',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>{{ title || 'Scan Barcode' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="closeModal()">Close</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding ion-text-center">
      <p style="font-size: 14px; color: var(--app-text-secondary); margin-bottom: 12px;">
        Point the camera at any property tag or package label.
      </p>

      <!-- Full-Frame Camera Viewfinder Container -->
      <div id="reader" style="width: 100%; max-width: 500px; margin: 0 auto; border-radius: 8px; overflow: hidden;"></div>
    </ion-content>
  `
})
export class BarcodeScannerComponent implements OnInit, OnDestroy {
  @Input() title: string = 'Scan Barcode';
  private html5QrcodeScanner?: Html5QrcodeScanner;

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {
    setTimeout(() => {
      this.startScanner();
    }, 300);
  }

  ngOnDestroy() {
    this.stopScanner();
  }

  private startScanner() {
    const config = {
      fps: 15,
      aspectRatio: 1.0,
      // Omitted 'qrbox' so scanning active area expands to full camera viewfinder
      formatsToSupport: [
        Html5QrcodeSupportedFormats.CODE_128,   // Standard Property Tags & PO Labels
        Html5QrcodeSupportedFormats.CODE_39,    // Legacy Property Tags
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODABAR,
        Html5QrcodeSupportedFormats.ITF,
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.DATA_MATRIX
      ]
    };

    this.html5QrcodeScanner = new Html5QrcodeScanner(
      'reader',
      config,
      /* verbose= */ false
    );

    this.html5QrcodeScanner.render(
      (decodedText) => {
        // Successful Scan!
        this.stopScanner();
        this.modalCtrl.dismiss({ scannedCode: decodedText });
      },
      (errorMessage) => {
        // Frame scan attempt (normal during camera auto-focus, ignored)
      }
    );
  }

  private stopScanner() {
    if (this.html5QrcodeScanner) {
      this.html5QrcodeScanner.clear().catch((err) => console.error('Error stopping scanner:', err));
    }
  }

  closeModal() {
    this.stopScanner();
    this.modalCtrl.dismiss(null);
  }
}