import { Routes } from '@angular/router';
import { provideRouter } from '@angular/router';

export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' }, // Default route
    

];

export const appRouting = provideRouter(routes);