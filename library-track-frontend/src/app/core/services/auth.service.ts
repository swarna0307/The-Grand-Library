import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ResponseStructure, UserDto, UserRole } from '../../models/models';

interface LoginResponse {
  token: string;
  role: string;       // "ROLE_ADMIN" | "ROLE_LIBRARIAN" | "ROLE_READER"
  userId: number;
  username: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private router: Router) {}

  login(username: string, password: string): Observable<ResponseStructure<LoginResponse>> {
    return this.http.post<ResponseStructure<LoginResponse>>(
      `${this.apiUrl}/auth/login`, { username, password }
    ).pipe(tap(res => {
      const data = res.data;

      // Store token, username, and role — all from response body, NOT from JWT decoding
      localStorage.setItem('token',    data.token);
      localStorage.setItem('username', data.username || username);
      localStorage.setItem('userId',   String(data.userId || ''));
      localStorage.setItem('role',     this.normalizeRole(data.role));
    }));
  }

  register(user: any): Observable<ResponseStructure<UserDto>> {
    return this.http.post<ResponseStructure<UserDto>>(`${this.apiUrl}/auth/register`, user);
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const payload = this.decodeToken(token);
      const expiry = payload?.exp * 1000;
      return Date.now() < expiry;
    } catch { return false; }
  }

  getRole(): UserRole {
    return (localStorage.getItem('role') as UserRole) || 'READER';
  }

  getUsername(): string {
    return localStorage.getItem('username') || '';
  }

  getUserId(): string {
    return localStorage.getItem('userId') || '';
  }

  isAdmin(): boolean           { return this.getRole() === 'ADMIN'; }
  isLibrarian(): boolean       { return this.getRole() === 'LIBRARIAN'; }
  isReader(): boolean          { return this.getRole() === 'READER'; }
  isAdminOrLibrarian(): boolean { return this.isAdmin() || this.isLibrarian(); }

  // Converts "ROLE_ADMIN" → "ADMIN", "ROLE_LIBRARIAN" → "LIBRARIAN" etc.
  private normalizeRole(roleName: string): UserRole {
    if (!roleName) return 'READER';
    if (roleName.includes('ADMIN'))     return 'ADMIN';
    if (roleName.includes('LIBRARIAN')) return 'LIBRARIAN';
    return 'READER';
  }

  private decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '=='.slice(0, (4 - base64.length % 4) % 4);
      return JSON.parse(atob(padded));
    } catch { return {}; }
  }
}
