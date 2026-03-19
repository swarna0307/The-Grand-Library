import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardDto, ResponseStructure } from '../../models/models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private api = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<ResponseStructure<DashboardDto>> {
    return this.http.get<ResponseStructure<DashboardDto>>(this.api);
  }

  getReaderDashboard(readerId: number): Observable<ResponseStructure<DashboardDto>> {
    return this.http.get<ResponseStructure<DashboardDto>>(`${this.api}/reader/${readerId}`);
  }
}
