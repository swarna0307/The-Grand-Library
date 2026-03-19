import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserDto, ResponseStructure } from '../../models/models';


@Injectable({ providedIn: 'root' })
export class UserService {
  private api = `${environment.apiUrl}/users`;
  constructor(private http: HttpClient) {}

  getAll(): Observable<ResponseStructure<UserDto[]>> {
    return this.http.get<ResponseStructure<UserDto[]>>(this.api);
  }
  getById(id: number): Observable<ResponseStructure<UserDto>> {
    return this.http.get<ResponseStructure<UserDto>>(`${this.api}/${id}`);
  }
  create(user: any): Observable<ResponseStructure<UserDto>> {
    return this.http.post<ResponseStructure<UserDto>>(this.api, user);
  }
  update(id: number, user: any): Observable<ResponseStructure<UserDto>> {
    return this.http.put<ResponseStructure<UserDto>>(`${this.api}/${id}`, user);
  }
  delete(id: number): Observable<ResponseStructure<string>> {
    return this.http.delete<ResponseStructure<string>>(`${this.api}/${id}`);
  }
}
