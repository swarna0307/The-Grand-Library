import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoanDto, ResponseStructure } from '../../models/models';

@Injectable({ providedIn: 'root' })
export class LoanService {
  private api = `${environment.apiUrl}/loans`;
  constructor(private http: HttpClient) {}

  getAll(): Observable<ResponseStructure<LoanDto[]>> {
    return this.http.get<ResponseStructure<LoanDto[]>>(this.api);
  }
  getById(id: number): Observable<ResponseStructure<LoanDto>> {
    return this.http.get<ResponseStructure<LoanDto>>(`${this.api}/${id}`);
  }
  create(loan: any): Observable<ResponseStructure<LoanDto>> {
    return this.http.post<ResponseStructure<LoanDto>>(this.api, loan);
  }
  update(id: number, loan: any): Observable<ResponseStructure<LoanDto>> {
    return this.http.put<ResponseStructure<LoanDto>>(`${this.api}/${id}`, loan);
  }
  delete(id: number): Observable<ResponseStructure<string>> {
    return this.http.delete<ResponseStructure<string>>(`${this.api}/${id}`);
  }
}
