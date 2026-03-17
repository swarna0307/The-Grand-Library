import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { ResponseStructure, UserDto } from '../../../models/models';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  show = false;
  editing = false;
  user: UserDto | null = null;
  loading = false;
  saving = false;
  error = '';
  success = '';

  form: any = { username: '', email: '', phone: '', gender: '', address: '' };

  constructor(public auth: AuthService, private http: HttpClient) {}

  ngOnInit() {
    // Load profile when shown
  }

  open() {
    this.show = true;
    this.editing = false;
    this.error = '';
    this.success = '';
    this.loadProfile();
  }

  close() {
    this.show = false;
    this.editing = false;
  }

  loadProfile() {
    const userId = this.auth.getUserId();
    if (!userId) return;
    this.loading = true;
    this.http.get<ResponseStructure<UserDto>>(`${environment.apiUrl}/users/${userId}`)
      .subscribe({
        next: r => { this.user = r.data; this.loading = false; this.populateForm(); },
        error: () => { this.loading = false; this.error = 'Could not load profile.'; }
      });
  }

  populateForm() {
    if (this.user) {
      this.form = {
        username: this.user.username,
        email: this.user.email,
        phone: this.user.phone || '',
        gender: this.user.gender || '',
        address: this.user.address || ''
      };
    }
  }

  startEdit() {
    this.populateForm();
    this.editing = true;
    this.error = '';
    this.success = '';
  }

  cancelEdit() {
    this.editing = false;
    this.error = '';
  }

  save() {
    const userId = this.auth.getUserId();
    if (!userId) return;
    if (!this.form.email) { this.error = 'Email is required.'; return; }

    this.saving = true;
    this.http.put<ResponseStructure<UserDto>>(`${environment.apiUrl}/users/${userId}`, this.form)
      .subscribe({
        next: r => {
          this.user = r.data;
          this.editing = false;
          this.saving = false;
          this.success = 'Profile updated successfully!';
          setTimeout(() => this.success = '', 3000);
        },
        error: e => {
          this.saving = false;
          this.error = e.error?.message || 'Could not update profile.';
        }
      });
  }

  get roleDisplay(): string {
    const r = this.auth.getRole();
    return r === 'ADMIN' ? '🛡️ Administrator' : r === 'LIBRARIAN' ? '📚 Librarian' : '📖 Reader';
  }

  get roleClass(): string {
    const r = this.auth.getRole();
    return r === 'ADMIN' ? 'role-admin' : r === 'LIBRARIAN' ? 'role-librarian' : 'role-reader';
  }

  get initials(): string {
    const n = this.auth.getUsername();
    return n ? n.charAt(0).toUpperCase() : '?';
  }
}
