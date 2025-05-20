import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-search-form',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './search-form.component.html',
  styleUrl: './search-form.component.css',
})
export class SearchFormComponent {
  destination: string = '';
  placesResult: any = null;
  weatherResult: any = null;
  loading: boolean = false;
  error: string | null = null;

  constructor(private apiService: ApiService) {}

  onSearch(destinationQuery: string): void {
    this.error = null;
    this.placesResult = null;
    this.weatherResult = null;
    this.loading = true;

    if (!destinationQuery.trim()) {
      this.error = 'Please enter a destination.';
      return;
    }

    this.apiService.getPlaces(destinationQuery).subscribe({
      next: (data) => {
        this.loading = false;
        this.placesResult = data;
        this.fetchWeather(destinationQuery);
      },
      error: (err) => {
        console.error('Error fetching places:', err);
        this.error = 'Failed to fetch places. Check the console for details.';
      },
    });
  }

  fetchWeather(city: string): void {
    this.apiService.getWeather(city).subscribe({
      next: (data) => {
        this.weatherResult = data;
      },
      error: (err) => {
        console.error('Error fetching weather:', err);

        this.error =
          (this.error ? this.error + ' ' : '') + 'Failed to fetch weather.';
      },
    });
  }
}
