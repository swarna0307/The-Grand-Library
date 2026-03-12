import { Component, OnInit } from '@angular/core';
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

  // ── Data ─────────────────────────────────────────────────
  reservations: ReservationDto[] = [];

  // ── UI state ──────────────────────────────────────────────
  loading   = false;
  submitting = false;
  error     = '';
  success   = '';

  // ── Modal state ───────────────────────────────────────────
  showModal   = false;
  editingRes: ReservationDto | null = null;

  // ── Book lookup (create form) ─────────────────────────────
  isbnQuery     = '';
  lookingUpBook = false;
  foundBook: Book | null = null;
  bookId        = '';
  bookError     = '';

  // ── Edit form (admin/librarian review) ───────────────────
  selectedStatus = 'Pending';

  readonly STATUS_OPTIONS = [
    { value: 'Active',    label: '✅ Active',    hint: 'Book is currently Reserved' },
    { value: 'Fulfilled', label: '📦 Fulfilled', hint: 'Book has been returned' },
    { value: 'Cancelled', label: '❌ Cancelled', hint: 'Cancel this reservation' },
  ];

  constructor(
    public  auth:       AuthService,
    private resService: ReservationService,
    private bookSvc:    BookService
  ) {}

  ngOnInit(): void { this.load(); }

  // ── Load reservations ─────────────────────────────────────
  load(): void {
    this.loading = true;
    this.error   = '';
    this.resService.getAll().subscribe({
      next:  r => { this.reservations = r.data || []; this.loading = false; },
      error: e => { this.error = e.error?.message || 'Could not load reservations.'; this.loading = false; }
    });
  }

  // ── Open modal: Reader — create reservation ───────────────
  openCreate(): void {
    this.editingRes    = null;
    this.isbnQuery     = '';
    this.foundBook     = null;
    this.bookId        = '';
    this.bookError     = '';
    this.error         = '';
    this.showModal     = true;
  }

  // ── Open modal: Admin/Librarian — review reservation ──────
  openReview(r: ReservationDto): void {
    this.editingRes    = r;
    this.selectedStatus = r.status || 'Pending';
    this.error         = '';
    this.showModal     = true;
  }

  closeModal(): void { this.showModal = false; this.error = ''; }

  // ── ISBN Lookup ───────────────────────────────────────────
  lookupBook(): void {
    if (!this.isbnQuery.trim()) return;
    this.lookingUpBook = true;
    this.bookError     = '';
    this.foundBook     = null;
    this.bookSvc.getByIsbn(this.isbnQuery.trim()).subscribe({
      next: res => {
        this.foundBook     = res.data;
        this.bookId        = String(res.data.bookId);
        this.lookingUpBook = false;
      },
      error: e => {
        this.bookError     = e.error?.message || 'No book found with this ISBN.';
        this.lookingUpBook = false;
      }
    });
  }

  clearBook(): void {
    this.foundBook = null;
    this.bookId    = '';
    this.isbnQuery = '';
    this.bookError = '';
  }

  // ── Submit: create reservation (Reader) ───────────────────
  submitCreate(): void {
    if (!this.bookId) { this.bookError = 'Please enter or look up a Book ID.'; return; }
    if (this.foundBook && this.foundBook.availabilityStatus !== 'Available') {
      this.error = `This book is currently ${this.foundBook.availabilityStatus} and cannot be reserved.`;
      return;
    }
    this.submitting = true;
    this.error      = '';
    this.resService.create({ book: { bookId: Number(this.bookId) } }).subscribe({
      next: () => {
        this.submitting = false;
        this.success    = '✅ Reservation successful! The book is now reserved for you.';
        this.closeModal();
        this.load();
        setTimeout(() => this.success = '', 5000);
      },
      error: e => {
        this.submitting = false;
        // Show detailed error if available
        const detail = e.error?.data ? ` (${e.error.data})` : '';
        this.error = (e.error?.message || 'Failed to create reservation') + detail;
      }
    });
  }

  // ── Submit: update status (Admin/Librarian) ───────────────
  submitUpdate(): void {
    if (!this.editingRes) return;
    this.submitting = true;
    this.error      = '';
    this.resService.update(this.editingRes.reservationId!, { status: this.selectedStatus }).subscribe({
      next: () => {
        this.submitting = false;
        this.success    = `Reservation status updated to "${this.selectedStatus}".`;
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

  // ── Cancel: reader cancels their own reservation ──────────
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

  // ── Delete: admin/librarian only ──────────────────────────
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

  // ── Helpers ───────────────────────────────────────────────
  statusClass(s?: string): string {
    const map: Record<string, string> = {
      'Active':    'badge-success',
      'Cancelled': 'badge-danger',
      'Fulfilled': 'badge-muted',
    };
    return map[s ?? ''] ?? 'badge-muted';
  }

  statusIcon(s?: string): string {
    const map: Record<string, string> = {
      'Active':    '✅',
      'Cancelled': '❌',
      'Fulfilled': '📦',
    };
    return map[s ?? ''] ?? '•';
  }

  canCancel(r: ReservationDto): boolean {
    return this.auth.isReader() && r.status === 'Active';
  }
}
