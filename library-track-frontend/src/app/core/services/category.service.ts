import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category, ResponseStructure } from '../../models/models';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private api = `${environment.apiUrl}/categories`;
  constructor(private http: HttpClient) {}

  getAll(): Observable<ResponseStructure<Category[]>> {
    return this.http.get<ResponseStructure<Category[]>>(this.api);
  }
  getById(id: number): Observable<ResponseStructure<Category>> {
    return this.http.get<ResponseStructure<Category>>(`${this.api}/${id}`);
  }
  create(cat: Category): Observable<ResponseStructure<Category>> {
    return this.http.post<ResponseStructure<Category>>(this.api, cat);
  }
  update(id: number, cat: Category): Observable<ResponseStructure<Category>> {
    return this.http.put<ResponseStructure<Category>>(`${this.api}/${id}`, cat);
  }
  delete(id: number): Observable<ResponseStructure<string>> {
    return this.http.delete<ResponseStructure<string>>(`${this.api}/${id}`);
  }
}
