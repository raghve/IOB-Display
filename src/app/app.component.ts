import { Component, OnInit,ViewChild, ElementRef } from '@angular/core';
import { FileWatcherService } from './file-watcher.service';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MaterialUIModule } from './material-ui/material-ui.module';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { interval, Subscription } from 'rxjs';



@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    FormsModule,
    MaterialUIModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatTableModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = '';
  deviceIds:any = ''; // Example Device IDs
  apiUrl = '';
  dashboardTitle= '';
  brandImagePath= '';
  noDataImage='';
  backgroundImagePath= '';
  latestImageData: any;
  selectedDevice:any;
  isFullscreen = false;
  isCancelled = false;
  showDropdown:boolean = true;
  noData:boolean = false;
  showVisitorDetails:boolean = false;
  noMaterial:boolean = false;
  showMaterial:boolean = false;
  qrCodeId: string = '';
  materialList:any = '';
  errorMessage:any = '';
  deatilsData:any = '';
  loading: boolean = false;
  materialContent:boolean = false;
  
  @ViewChild('messageInput') messageInput!: ElementRef;

  latesimagedat:any = 0;

  displayedColumns: string[] = ['index', 'materialType', 'SerialNumber', 'Quantity', 'ItemScope', 'Detail', 'MaterialApprovesStatus'];
  dataSource:[] = [];


  private fetchIntervalSubscription: Subscription | null = null;

  constructor(
    private fileWatcherService: FileWatcherService,
    private http : HttpClient,
  ) {}

  ngOnInit(): void {
    // Fetch the config.json file from the assets folder
    this.http.get<any>('/assets/frontendConfig.json').subscribe(config => {
      console.log("FrontendConfig Called")
      this.apiUrl = config.apiUrl;
      this.fileWatcherService.initialize(this.apiUrl); // Initialize the service
      // this.deviceIds = config.deviceID;
      this.title = config.appTitle;
      this.dashboardTitle = config.dashboardTitle;
      this.brandImagePath = config.brandImagePath;
      this.noDataImage = config.noDataImage;
      console.log("This Is Api URl:", this.apiUrl);
      // Fetch device IDs after apiUrl is set
      this.fetchDeviceIds();
    });
  }

  // Method to get Device ID Dynamically from the folder
  private fetchDeviceIds(): void {
      if (!this.apiUrl) {
        console.error('API URL is not set.');
        return;
      }
      const defaultDeviceId = 'None'; // Replace with your actual default device ID
      this.deviceIds = [defaultDeviceId]; // Initialize with the default device ID
    
      this.http.get<string[]>(`${this.apiUrl}/get-device-ids`).subscribe({
        next: (data) => {
          this.deviceIds.push(...data);
          console.log('Device IDs:', this.deviceIds);
        },
        error: (err) => {
          console.error('Error fetching device IDs:', err);
        }
      });
  }

  toggleDropdown() {
   this.showDropdown = !this.showDropdown;
  }

  onDeviceSelect(event: any): void {
    this.showVisitorDetails=true;
    this.materialContent=false;
    this.qrCodeId='';
    this.materialList=false;
    this.noMaterial=false;
    const selectedDevice = (event.target as HTMLSelectElement).value;
    this.selectedDevice = selectedDevice;
    console.log('Selected Device:', selectedDevice);

    // Clear any existing interval subscription
    if (this.fetchIntervalSubscription) {
      this.fetchIntervalSubscription.unsubscribe();
    }

    // Start fetching data every 2 seconds for the selected device
    if (selectedDevice !== 'None') {
      this.fetchLatestImage(selectedDevice);
      // this.fetchIntervalSubscription = interval(3000).subscribe(() => {
      //   this.fetchLatestImage(selectedDevice);
      // });
    }
  }

  fetchLatestImage(deviceId: string): void {
    this.fileWatcherService.getLatestImage(deviceId).subscribe(
      (data) => {
        this.noData= false;
        this.latestImageData = data;
        console.log('UI DATA:', data);
      },
      (error) => {
        this.noData= true;
        console.error('Error fetching image:', error);
        this.latestImageData='';
        console.log("No Data Status :", this.noData);
        // alert("No Data Found in Device: " + deviceId);
      }
    );

    //Listein for Real Time Updates
    this.fileWatcherService.onFileAdded((data) => {
      console.log("---------------Device Popped:--------------", data.deviceId)
      if (data.deviceId === this.selectedDevice) {
        this.noData= false;
        this.latestImageData = data;
      }
    });
  }

  ngOnDestroy(): void {
    // Unsubscribe from the interval to prevent memory leaks
    if (this.fetchIntervalSubscription) {
      this.fetchIntervalSubscription.unsubscribe();
    }
  }

  enterFullscreen(): void {
    this.isFullscreen = true;
    this.isCancelled = false;
    document.documentElement.requestFullscreen();
  }

  exitFullscreen(): void {
    this.isFullscreen = false;
    this.isCancelled = false;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  }

  cancelFullscreen(): void {
    this.isFullscreen = false;
    this.isCancelled = true;
    this.latestImageData= '';
    this.selectedDevice = 'None';
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  }

  // Material Search
  showMaterialserach() {
    this.showVisitorDetails=false;
    this.latestImageData='';
    this.selectedDevice='None';
    this.materialContent=true;
    this. showMaterial = true;
  }


  
  searchMaterial() {
    this.loading = true;
    console.log("Input Value :", this.qrCodeId);
  
    let timeout = setTimeout(() => {
      alert("Request timed out after 5 seconds. Please try again.");
      this.loading = false;
    }, 8000);
  
    this.fileWatcherService.getmaterialList(this.qrCodeId).subscribe({
      next: (data) => {
        clearTimeout(timeout); // Clear timeout if data is received in time
        console.log("Data :", data);
        if (data.length == 0) {
          this.loading = false;
          this.materialList = [];
          this.dataSource = [];
          this.deatilsData = null;
          this.noMaterial = true;
        } else {
          this.loading = false;
          this.noMaterial = false;
          this.materialList = data.materialList;
          this.deatilsData = data.details;
          this.dataSource = data.materialList;
          this.errorMessage = null;
          console.log("material Data :", this.dataSource);
          console.log("Details :", this.deatilsData);
        }
      },
      error: (error) => {
        clearTimeout(timeout); // Clear timeout on error response
        console.log('Error fetching material list:', error);
        this.errorMessage = error.error.message || 'An error occurred!';
        this.materialList = null;
        this.deatilsData = null;
        this.noMaterial=true;
        this.loading=false;
        this.loading = false;
      }
    });
  
    this.qrCodeId = '';
    this.focusInput();
  }
  
  clearInput() {
    this.qrCodeId='';
    this.materialList=false;
    this.noMaterial=false;
    this.focusInput();  
      
  }

  focusInput(): void {
    this.messageInput.nativeElement.focus();
  }
   
}
  
