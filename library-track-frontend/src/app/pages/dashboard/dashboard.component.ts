import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { UserService } from '../../core/services/user.service';
import { DashboardDto, UserDto } from '../../models/models';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  dashboard: DashboardDto | null = null;
  loading = true;
  error = '';
  currentTime = new Date();

  constructor(
    public auth: AuthService,
    private dashService: DashboardService
  ) {}

  ngOnInit() {
    setInterval(() => this.currentTime = new Date(), 1000);
    this.loadDashboard();
  }

  loadDashboard() {
    const role = this.auth.getRole();
    if (role === 'READER') {
      const userId = this.auth.getUserId();
      if (userId) {
        this.dashService.getReaderDashboard(Number(userId)).subscribe({
          next: (res) => { this.dashboard = res.data; this.loading = false; },
          error: (e) => { 
            this.loading = false;
            this.error = e.error?.message || 'Could not load your reader dashboard.';
          }
        });
      } else { this.loading = false; }
    } else {
      this.dashService.getDashboard().subscribe({
        next: (res) => { this.dashboard = res.data; this.loading = false; },
        error: (e) => { 
          this.loading = false; 
          this.error = e.error?.message || 'Could not load administration dashboard.';
        }
      });
    }
  }

  // ── HELPERS ──────────────────────────────────────
  get booksPerCategoryKeys(): string[] {
    return this.dashboard?.booksPerCategory ? Object.keys(this.dashboard.booksPerCategory) : [];
  }
  get availabilityKeys(): string[] {
    return this.dashboard?.booksByAvailability ? Object.keys(this.dashboard.booksByAvailability) : [];
  }
  getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return '☀️ Good morning';
    if (h < 17) return '🌤️ Good afternoon';
    return '🌙 Good evening';
  }
  get roleTitle(): string {
    const r = this.auth.getRole();
    return r === 'ADMIN' ? '🛡️ Administration' : r === 'LIBRARIAN' ? '📚 Library Management' : '📖 My Reading Space';
  }
  getAvailabilityClass(key: string): string {
    if (key.toLowerCase().includes('available')) return 'success';
    if (key.toLowerCase().includes('borrowed')) return 'warning';
    return 'danger';
  }
  getRoleClass(r?: any): string {
    const name = r?.name || '';
    return name.includes('ADMIN') ? 'badge-danger' : name.includes('LIBRARIAN') ? 'badge-info' : 'badge-success';
  }
  getRoleDisplay(r?: any): string {
    return (r?.name || 'READER').replace('ROLE_', '');
  }
}
