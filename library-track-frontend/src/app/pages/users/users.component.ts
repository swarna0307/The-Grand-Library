import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { UserDto } from '../../models/models';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
  users: UserDto[] = [];
  filtered: UserDto[] = [];
  loading = false; error = ''; success = '';
  showModal = false; editingUser: UserDto | null = null;
  userForm: any = { username: '', email: '', password: '', gender: '', phone: '', address: '', role: { name: 'ROLE_READER' } };

  // Filter / Sort
  sortBy = '';
  filterRole = '';
  filterGender = '';

  constructor(public auth: AuthService, private userService: UserService) {}

  ngOnInit() { if (!this.auth.isAdmin()) { this.error = 'Access denied.'; return; } this.load(); }

  load() {
    this.loading = true;
    this.userService.getAll().subscribe({
      next: (r) => { this.users = r.data; this.applyAll(); this.loading = false; },
      error: (e) => { this.error = e.error?.message || 'Could not load users.'; this.loading = false; }
    });
  }

  applyAll() {
    let result = [...this.users];

    // Filter by role
    if (this.filterRole) {
      result = result.filter(u => u.role?.name === this.filterRole);
    }

    // Filter by gender
    if (this.filterGender) {
      result = result.filter(u => u.gender?.toLowerCase() === this.filterGender.toLowerCase());
    }

    // Sort
    if (this.sortBy === 'usernameAsc') {
      result.sort((a, b) => (a.username || '').localeCompare(b.username || ''));
    } else if (this.sortBy === 'usernameDesc') {
      result.sort((a, b) => (b.username || '').localeCompare(a.username || ''));
    } else if (this.sortBy === 'dateAsc') {
      result.sort((a, b) => (a.registeredDate || '').localeCompare(b.registeredDate || ''));
    } else if (this.sortBy === 'dateDesc') {
      result.sort((a, b) => (b.registeredDate || '').localeCompare(a.registeredDate || ''));
    }

    this.filtered = result;
  }

  openAdd() { this.editingUser = null; this.userForm = { username: '', email: '', password: '', gender: '', phone: '', address: '', role: { name: 'ROLE_READER' } }; this.showModal = true; }
  openEdit(u: UserDto) { this.editingUser = u; this.userForm = { username: u.username, email: u.email, gender: u.gender, phone: u.phone, address: u.address, role: u.role }; this.showModal = true; }
  closeModal() { this.showModal = false; this.error = ''; }

  save() {
    this.loading = true; this.error = '';
    const obs = this.editingUser
      ? this.userService.update(this.editingUser.id!, this.userForm)
      : this.userService.create(this.userForm);
    obs.subscribe({ next: () => { this.success = 'User saved!'; this.closeModal(); this.load(); this.loading = false; }, error: (e) => { this.error = e.error?.message || 'Error.'; this.loading = false; } });
  }

  delete(u: UserDto) {
    if (!confirm(`Delete user "${u.username}"?`)) return;
    this.userService.delete(u.id!).subscribe({ next: () => { this.success = 'Deleted.'; this.load(); }, error: (e) => { this.error = e.error?.message || 'Error.'; } });
  }

  getRoleClass(r?: any): string {
    const name = r?.name || '';
    return name.includes('ADMIN') ? 'badge-danger' : name.includes('LIBRARIAN') ? 'badge-info' : 'badge-success';
  }

  getRoleDisplay(r?: any): string {
    const name = r?.name || '';
    return name.replace('ROLE_', '');
  }
}
