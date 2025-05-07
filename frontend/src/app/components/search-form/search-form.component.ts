import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms'; // For ngModel
import { CommonModule } from '@angular/common'; // For ngIf, ngFor, etc.
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-search-form',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './search-form.component.html',
  styleUrl: './search-form.component.css'
})
export class SearchFormComponent {
  destination: string = '';
  placesResult: any = null;
  weatherResult: any = null;
  error: string | null = null;

  constructor(private apiService: ApiService) {}

  onSearch(destinationQuery: string): void { 
    this.error = null;
    this.placesResult = null;
    this.weatherResult = null;

    if (!destinationQuery.trim()) { 
      this.error = "Please enter a destination.";
      return;
    }

    this.apiService.getPlaces(destinationQuery).subscribe({ // Use the method parameter
      next: (data) => {
        this.placesResult = data;
        this.fetchWeather(destinationQuery); // Use the method parameter
      },
      error: (err) => {
        console.error('Error fetching places:', err);
        this.error = 'Failed to fetch places. Check the console for details.';
      }
    });
  }

  fetchWeather(city: string): void {
    this.apiService.getWeather(city).subscribe({
      next: (data) => {
        this.weatherResult = data;
      },
      error: (err) => {
        console.error('Error fetching weather:', err);
        // Optionally update the error message or handle weather errors separately
        this.error = (this.error ? this.error + ' ' : '') + 'Failed to fetch weather.';
      }
    });
  }
}
