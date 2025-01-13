import { Component, OnInit } from '@angular/core';
import { FileWatcherService } from './file-watcher.service';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { interval, Subscription } from 'rxjs';



@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    FormsModule
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
  

  latesimagedat:any = 0;


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


   
}
  
