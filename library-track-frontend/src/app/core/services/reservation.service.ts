import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ReservationDto, ResponseStructure } from '../../models/models';

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private api = `${environment.apiUrl}/reservations`;
  constructor(private http: HttpClient) {}

  getAll(): Observable<ResponseStructure<ReservationDto[]>> {
    return this.http.get<ResponseStructure<ReservationDto[]>>(this.api);
  }
  getById(id: number): Observable<ResponseStructure<ReservationDto>> {
    return this.http.get<ResponseStructure<ReservationDto>>(`${this.api}/${id}`);
  }
  create(res: any): Observable<ResponseStructure<ReservationDto>> {
    return this.http.post<ResponseStructure<ReservationDto>>(this.api, res);
  }
  update(id: number, res: any): Observable<ResponseStructure<ReservationDto>> {
    return this.http.patch<ResponseStructure<ReservationDto>>(`${this.api}/${id}`, res);
  }
  delete(id: number): Observable<ResponseStructure<string>> {
    return this.http.delete<ResponseStructure<string>>(`${this.api}/${id}`);
  }
}
