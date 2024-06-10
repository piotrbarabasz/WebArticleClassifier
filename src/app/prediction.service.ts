import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders  } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PredictionService {
  apiUrl = 'http://localhost:5000';

  constructor(private http: HttpClient) { }

  predict(text: string): Observable<any> {
    const payload = { text };
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.post<any>(`${this.apiUrl}/predict`, JSON.stringify(payload), { headers });
  }

  predict_pl(text: string): Observable<any> {
    const payload = { text };
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.post<any>(`${this.apiUrl}/predict_pl`, JSON.stringify(payload), { headers });
  }
}
