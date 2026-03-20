import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { LoanService } from '../../core/services/loan.service';
import { ReservationService } from '../../core/services/reservation.service';
import { ReadingProgressService } from '../../core/services/reading-progress.service';
import { BookService } from '../../core/services/book.service';
import { Book, DashboardDto, LoanDto, ReadingProgressDto, ReservationDto } from '../../models/models';
import { forkJoin } from 'rxjs';

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

  // Reader Specific Data
  activeReading: ReadingProgressDto[] = [];
  dueSoonLoans: LoanDto[] = [];
  recentReservations: ReservationDto[] = [];
  newArrivals: Book[] = [];

  constructor(
    public auth: AuthService,
    private dashService: DashboardService,
    private loanService: LoanService,
    private resService: ReservationService,
    private progressService: ReadingProgressService,
    private bookService: BookService
  ) {}

  ngOnInit() {
    setInterval(() => this.currentTime = new Date(), 1000);
    this.loadDashboard();
  }

  loadDashboard() {
    const role = this.auth.getRole();
    const userId = this.auth.getUserId();

    if (role === 'READER' && userId) {
      // Fetch everything for reader
      forkJoin({
        stats: this.dashService.getReaderDashboard(Number(userId)),
        loans: this.loanService.getAll(),
        reservations: this.resService.getAll(),
        progress: this.progressService.getAll(),
        books: this.bookService.getAll()
      }).subscribe({
        next: (res) => {
          this.dashboard = res.stats.data;
          
          // Process Active Reading
          this.activeReading = (res.progress.data || [])
            .filter(p => !p.isHistory && (p.percentageComplete || 0) < 100)
            .sort((a,b) => new Date(b.lastUpdated || '').getTime() - new Date(a.lastUpdated || '').getTime());

          // Process Due Soon (next 7 days)
          const today = new Date();
          const nextWeek = new Date();
          nextWeek.setDate(today.getDate() + 7);
          
          this.dueSoonLoans = (res.loans.data || [])
            .filter(l => l.status === 'Active' && l.dueDate && new Date(l.dueDate) <= nextWeek)
            .sort((a,b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

          // Process Recent Reservations
          this.recentReservations = (res.reservations.data || [])
            .filter(r => r.status === 'Active')
            .slice(0, 4);

          // Process New Arrivals
          this.newArrivals = (res.books.data || []).slice(-4).reverse();
          
          this.loading = false;
        },
        error: (e) => {
          this.loading = false;
          this.error = e.error?.message || 'Could not load your reader dashboard.';
        }
      });
    } else {
      // Admin/Librarian path
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

  getRoleClass(r?: any): string {
    const name = r?.name || '';
    return name.includes('ADMIN') ? 'badge-danger' : name.includes('LIBRARIAN') ? 'badge-info' : 'badge-success';
  }
  getRoleDisplay(r?: any): string {
    return (r?.name || 'READER').replace('ROLE_', '');
  }
}
