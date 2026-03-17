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

  // Filter / Sort / Search
  searchTerm = '';
  sortBy = 'idDesc';
  filterRole = '';
  filterGender = '';
  filterDropdownOpen = false;

  toggleFilterDropdown() {
    this.filterDropdownOpen = !this.filterDropdownOpen;
  }


  onSort(val: string) {
    if (!val) return;
    this.sortBy = val;
    this.applyAll();
  }

  onFilterRole(val: string) {
    this.filterRole = val;
    this.applyAll();
  }

  onFilterGender(val: string) {
    this.filterGender = val;
    this.applyAll();
  }

  constructor(public auth: AuthService, private userService: UserService) {}

  ngOnInit() { if (!this.auth.isAdmin()) { this.error = 'Access denied.'; return; } this.load(); }

  load() {
    this.loading = true;
    this.userService.getAll().subscribe({
      next: (r) => { this.users = r.data; this.applyAll(); this.loading = false; },
      error: (e) => { this.error = e.error?.message || 'Could not load users.'; this.loading = false; this.success = ''; }
    });
  }

  applyAll() {
    let result = [...this.users];

    // Search
    const term = this.searchTerm.toLowerCase().trim();
    if (term) {
      result = result.filter(u =>
        u.username?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        String(u.id).includes(term)
      );
    }

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
    } else if (this.sortBy === 'idDesc') {
      result.sort((a, b) => (b.id || 0) - (a.id || 0));
    } else if (this.sortBy === 'idAsc') {
      result.sort((a, b) => (a.id || 0) - (b.id || 0));
    }

    this.filtered = result;
  }


  openAdd() { this.editingUser = null; this.userForm = { username: '', email: '', password: '', gender: '', phone: '', address: '', role: { name: 'ROLE_READER' } }; this.showModal = true; }
  openEdit(u: UserDto) { this.editingUser = u; this.userForm = { username: u.username, email: u.email, gender: u.gender, phone: u.phone, address: u.address, role: u.role }; this.showModal = true; }
  closeModal() { this.showModal = false; this.error = ''; }

  save() {
    this.loading = true; this.error = ''; this.success = '';
    const obs = this.editingUser
      ? this.userService.update(this.editingUser.id!, this.userForm)
      : this.userService.create(this.userForm);
    obs.subscribe({ 
      next: () => { 
        this.success = 'User saved!'; 
        this.closeModal(); 
        this.load(); 
        this.loading = false;
        setTimeout(() => this.success = '', 5000);
      }, 
      error: (e) => { 
        this.error = e.error?.message || 'Error saving user.'; 
        this.loading = false; 
      } 
    });
  }

  delete(u: UserDto) {
    if (!confirm(`Delete user "${u.username}"?`)) return;
    this.error = ''; this.success = '';
    this.userService.delete(u.id!).subscribe({ 
      next: () => { 
        this.success = 'Deleted.'; 
        this.load();
        setTimeout(() => this.success = '', 5000);
      }, 
      error: (e) => { 
        this.error = e.error?.message || 'Error deleting user.'; 
      } 
    });
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
