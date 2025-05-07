import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SearchFormComponent } from './components/search-form/search-form.component'; // Import the new component

@Component({
  selector: 'app-root',
  standalone: true, // Ensure AppComponent is standalone if SearchFormComponent is
  imports: [RouterOutlet, SearchFormComponent], // Add SearchFormComponent here
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'frontend';
}
