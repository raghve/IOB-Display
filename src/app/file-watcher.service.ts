import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { fromEvent, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FileWatcherService {
  private apiUrl = '';
  private socket!: Socket  ; // Will be initialized dynamically

  constructor(private http: HttpClient) {}

  

  // Method to set the API URL and initialize the socket connection
  initialize(apiUrl: string): void {
    this.apiUrl = apiUrl;
    this.socket = io(this.apiUrl); // Initialize socket with the API URL
  }

   // Get the latest image and its data for the selected Device ID
   getLatestImage(deviceId: string): Observable<any> {
    // console.log("Service Called")
    return this.http.get<any>(`${this.apiUrl}/get-latest-image/${deviceId}`).pipe();
  }

  // Listen for new file added to the watched folder

  onFileAdded(callback: (fileData: any) => void): void {
    this.socket.on('file-added', (fileData: any) => {
      callback(fileData);
      console.log("Socket Filedata : ", fileData)
    });
  }

  
}
