import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ReadingProgressDto, ResponseStructure } from '../../models/models';

@Injectable({ providedIn: 'root' })
export class ReadingProgressService {
  private api = `${environment.apiUrl}/readingprogress`;
  constructor(private http: HttpClient) {}

  getAll(): Observable<ResponseStructure<ReadingProgressDto[]>> {
    return this.http.get<ResponseStructure<ReadingProgressDto[]>>(this.api);
  }
  getById(id: number): Observable<ResponseStructure<ReadingProgressDto>> {
    return this.http.get<ResponseStructure<ReadingProgressDto>>(`${this.api}/${id}`);
  }
  create(progress: any): Observable<ResponseStructure<ReadingProgressDto>> {
    return this.http.post<ResponseStructure<ReadingProgressDto>>(this.api, progress);
  }
  update(id: number, progress: any): Observable<ResponseStructure<ReadingProgressDto>> {
    return this.http.put<ResponseStructure<ReadingProgressDto>>(`${this.api}/${id}`, progress);
  }
  delete(id: number): Observable<ResponseStructure<string>> {
    return this.http.delete<ResponseStructure<string>>(`${this.api}/${id}`);
  }
}
