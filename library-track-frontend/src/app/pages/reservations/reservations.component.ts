import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ReservationService } from '../../core/services/reservation.service';
import { BookService } from '../../core/services/book.service';
import { ReservationDto, Book } from '../../models/models';

@Component({
  selector: 'app-reservations',
  templateUrl: './reservations.component.html',
  styleUrls: ['./reservations.component.scss']
})
export class ReservationsComponent implements OnInit {

  reservations: ReservationDto[] = [];
  filtered: ReservationDto[] = [];

  loading = false;
  submitting = false;
  error = '';
  success = '';

  showModal = false;
  editingRes: ReservationDto | null = null;

  isbnQuery = '';
  lookingUpBook = false;
  foundBook: Book | null = null;
  bookId = '';
  bookError = '';

  selectedStatus = 'Active';

  // Filter / Sort / Search
  filterStatus = '';
  sortBy = '';
  searchTerm = '';

  readonly STATUS_OPTIONS = [
    { value: 'Active', label: '✅ Active', hint: 'Book is currently Reserved' },
    { value: 'Fulfilled', label: '📦 Fulfilled', hint: 'Book has been returned' },
    { value: 'Cancelled', label: '❌ Cancelled', hint: 'Cancel this reservation' },
  ];

  constructor(
    public auth: AuthService,
    private resService: ReservationService,
    private bookSvc: BookService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.load();
    this.route.queryParams.subscribe(params => {
      if (params['categoryId'] && params['bookId']) {
        this.openCreate();
        this.lookupBookById(+params['categoryId'], +params['bookId']);
      } else if (params['isbn']) {
        this.openCreate();
        this.isbnQuery = params['isbn'];
        this.lookupBook();
      }
    });
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.resService.getAll().subscribe({
      next: r => { this.reservations = r.data || []; this.applyAll(); this.loading = false; },
      error: e => { this.error = e.error?.message || 'Could not load reservations.'; this.loading = false; }
    });
  }

  applyAll(): void {
    let result = [...this.reservations];

    // Search
    const term = this.searchTerm.toLowerCase().trim();
    if (term) {
      result = result.filter(r =>
        r.username?.toLowerCase().includes(term) ||
        r.book?.title?.toLowerCase().includes(term) ||
        r.reservedDate?.toLowerCase().includes(term) ||
        String(r.reservationId).includes(term)
      );
    }

    // Filter by status
    if (this.filterStatus) {
      result = result.filter(r => r.status === this.filterStatus);
    }

    // Sort
    if (this.sortBy === 'readerAsc') {
      result.sort((a, b) => (a.username || '').localeCompare(b.username || ''));
    } else if (this.sortBy === 'readerDesc') {
      result.sort((a, b) => (b.username || '').localeCompare(a.username || ''));
    } else if (this.sortBy === 'bookAsc') {
      result.sort((a, b) => (a.book?.title || '').localeCompare(b.book?.title || ''));
    } else if (this.sortBy === 'bookDesc') {
      result.sort((a, b) => (b.book?.title || '').localeCompare(a.book?.title || ''));
    } else if (this.sortBy === 'dateAsc') {
      result.sort((a, b) => (a.reservedDate || '').localeCompare(b.reservedDate || ''));
    } else if (this.sortBy === 'dateDesc') {
      result.sort((a, b) => (b.reservedDate || '').localeCompare(a.reservedDate || ''));
    } else if (this.sortBy === 'idDesc') {
      result.sort((a, b) => (b.reservationId || 0) - (a.reservationId || 0));
    } else if (this.sortBy === 'idAsc') {
      result.sort((a, b) => (a.reservationId || 0) - (b.reservationId || 0));
    }

    this.filtered = result;
  }

  openCreate(): void {
    this.editingRes = null;
    this.isbnQuery = '';
    this.foundBook = null;
    this.bookId = '';
    this.bookError = '';
    this.error = '';
    this.showModal = true;
  }

  openReview(r: ReservationDto): void {
    this.editingRes = r;
    this.selectedStatus = r.status || 'Active';
    this.error = '';
    this.showModal = true;
  }

  closeModal(): void { this.showModal = false; this.error = ''; }

  lookupBook(): void {
    if (!this.isbnQuery.trim()) return;
    this.lookingUpBook = true;
    this.bookError = '';
    this.foundBook = null;
    this.bookSvc.getByIsbn(this.isbnQuery.trim()).subscribe({
      next: res => {
        this.foundBook = res.data;
        this.bookId = String(res.data.bookId);
        this.lookingUpBook = false;
      },
      error: e => {
        this.bookError = e.error?.message || 'No book found with this ISBN.';
        this.lookingUpBook = false;
      }
    });
  }

  lookupBookById(categoryId: number, bookId: number): void {
    this.lookingUpBook = true;
    this.bookError = '';
    this.foundBook = null;
    this.bookSvc.getById(categoryId, bookId).subscribe({
      next: res => {
        this.foundBook = res.data;
        this.bookId = String(res.data.bookId);
        this.isbnQuery = res.data.isbn || '';
        this.lookingUpBook = false;
      },
      error: e => {
        this.bookError = e.error?.message || 'Book not found.';
        this.lookingUpBook = false;
      }
    });
  }

  clearBook(): void {
    this.foundBook = null;
    this.bookId = '';
    this.isbnQuery = '';
    this.bookError = '';
  }

  submitCreate(): void {
    if (!this.bookId) { this.bookError = 'Please enter or look up a Book ID.'; return; }
    if (this.foundBook && (this.foundBook.availableCopies ?? 0) <= 0) {
      this.error = `This book is currently unavailable and cannot be reserved.`;
      return;
    }
    this.submitting = true;
    this.error = '';
    this.resService.create({ book: { bookId: Number(this.bookId) } }).subscribe({
      next: () => {
        this.submitting = false;
        this.success = '✅ Reservation successful! The book is now reserved for you.';
        this.closeModal();
        this.load();
        setTimeout(() => this.success = '', 5000);
      },
      error: e => {
        this.submitting = false;
        const detail = e.error?.data ? ` (${e.error.data})` : '';
        this.error = (e.error?.message || 'Failed to create reservation') + detail;
      }
    });
  }

  submitUpdate(): void {
    if (!this.editingRes) return;
    this.submitting = true;
    this.error = '';
    this.resService.update(this.editingRes.reservationId!, { status: this.selectedStatus }).subscribe({
      next: () => {
        this.submitting = false;
        this.success = `Reservation status updated to "${this.selectedStatus}".`;
        this.closeModal();
        this.load();
        setTimeout(() => this.success = '', 4000);
      },
      error: e => {
        this.submitting = false;
        this.error = e.error?.message || 'Failed to update reservation.';
      }
    });
  }

  cancelReservation(r: ReservationDto): void {
    if (!confirm('Cancel this reservation request?')) return;
    this.resService.update(r.reservationId!, { status: 'Cancelled' }).subscribe({
      next: () => {
        this.success = 'Reservation cancelled.';
        this.load();
        setTimeout(() => this.success = '', 3000);
      },
      error: e => { this.error = e.error?.message || 'Could not cancel reservation.'; }
    });
  }

  deleteReservation(r: ReservationDto): void {
    if (!confirm(`Delete reservation for "${r.book?.title || 'this book'}"?`)) return;
    this.resService.delete(r.reservationId!).subscribe({
      next: () => {
        this.success = 'Reservation deleted.';
        this.load();
        setTimeout(() => this.success = '', 3000);
      },
      error: e => { this.error = e.error?.message || 'Could not delete reservation.'; }
    });
  }

  statusClass(s?: string): string {
    const map: Record<string, string> = {
      'Active': 'badge-success',
      'Cancelled': 'badge-danger',
      'Fulfilled': 'badge-muted',
    };
    return map[s ?? ''] ?? 'badge-muted';
  }

  onSort(val: string): void {
    if (!val) return;
    this.sortBy = val;
    this.applyAll();
  }

  onFilterStatus(val: string): void {
    this.filterStatus = val;
    this.applyAll();
  }

  applySort(): void {
    this.applyAll();
  }

  statusIcon(s?: string): string {
    const map: Record<string, string> = {
      'Active': '✅',
      'Cancelled': '❌',
      'Fulfilled': '📦',
    };
    return map[s ?? ''] ?? '•';
  }

  canCancel(r: ReservationDto): boolean {
    return this.auth.isReader() && r.status === 'Active';
  }
}
