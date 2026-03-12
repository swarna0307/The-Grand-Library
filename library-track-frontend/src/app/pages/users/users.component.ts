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
  loading = false; error = ''; success = '';
  showModal = false; editingUser: UserDto | null = null;
  userForm: any = { username: '', email: '', password: '', gender: '', phone: '', address: '', role: { name: 'ROLE_READER' } };

  constructor(public auth: AuthService, private userService: UserService) {}

  ngOnInit() { if (!this.auth.isAdmin()) { this.error = 'Access denied.'; return; } this.load(); }

  load() {
    this.loading = true;
    this.userService.getAll().subscribe({ 
      next: (r) => { this.users = r.data; this.loading = false; }, 
      error: (e) => { this.error = e.error?.message || 'Could not load users.'; this.loading = false; } 
    });
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
