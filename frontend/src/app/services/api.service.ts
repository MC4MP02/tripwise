import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:5000/api'; 

  constructor(private http: HttpClient) { }

  getPlaces(destination: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/places`, { params: { destination } });
  }

  getWeather(city: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/weather`, { params: { city } });
  }

  translateText(text: string, lang: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/translate`, { params: { text, lang } });
  }
}
