import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { ReservationService } from '../../core/services/reservation.service';
import { ReservationDto, Book } from '../../models/models';
import { BookService } from '../../core/services/book.service';

@Component({
  selector: 'app-reservations',
  templateUrl: './reservations.component.html',
  styleUrls: ['./reservations.component.scss']
})
export class ReservationsComponent implements OnInit {
  reservations: ReservationDto[] = [];
  loading = false;
  error = '';
  success = '';
  showModal = false;
  editingRes: ReservationDto | null = null;
  lookingUpBook = false;
  foundBook: Book | null = null;

  resForm: any = { bookId: '', isbnQuery: '', reservationStatus: 'Active' };
  formErrors: any = {};

  constructor(
    public auth: AuthService, 
    private resService: ReservationService,
    private bookService: BookService
  ) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.error = '';
    this.resService.getAll().subscribe({
      next: r => { this.reservations = r.data || []; this.loading = false; },
      error: e => { this.error = e.error?.message || 'Could not load reservations.'; this.loading = false; }
    });
  }

  openAdd() {
    this.editingRes = null;
    this.resForm = { bookId: '', isbnQuery: '' };
    this.foundBook = null;
    this.formErrors = {};
    this.error = '';
    this.showModal = true;
  }

  openEdit(r: ReservationDto) {
    this.editingRes = r;
    this.foundBook = r.book || null;
    this.resForm = { reservationStatus: r.status || 'Pending' };
    this.formErrors = {};
    this.error = '';
    this.showModal = true;
  }

  lookupBook() {
    if (!this.resForm.isbnQuery) return;
    this.lookingUpBook = true;
    this.error = '';
    this.bookService.getByIsbn(this.resForm.isbnQuery).subscribe({
      next: (res) => {
        this.foundBook = res.data;
        this.resForm.bookId = res.data.bookId;
        this.lookingUpBook = false;
      },
      error: (e) => {
        this.error = e.error?.message || 'Book not found with this ISBN.';
        this.foundBook = null;
        this.resForm.bookId = '';
        this.lookingUpBook = false;
      }
    });
  }

  closeModal() { this.showModal = false; this.error = ''; }

  validate(): boolean {
    this.formErrors = {};
    if (!this.editingRes && !this.resForm.bookId) this.formErrors.bookId = 'Book ID is required.';
    return Object.keys(this.formErrors).length === 0;
  }

  save() {
    if (!this.validate()) return;
    const userId = Number(this.auth.getUserId());

    // Check availability for new reservations
    if (!this.editingRes && this.foundBook && this.foundBook.availabilityStatus !== 'Available') {
      this.error = `Cannot reserve: Book status is ${this.foundBook.availabilityStatus}. Only Available books can be reserved.`;
      return;
    }

    const obs = this.editingRes
      ? this.resService.update(this.editingRes.reservationId!, { status: this.resForm.reservationStatus })
      : this.resService.create({
          user: { userId },
          book: { bookId: Number(this.resForm.bookId) }
        });

    obs.subscribe({
      next: () => {
        this.success = this.editingRes
          ? 'Reservation updated!'
          : '✅ Reservation sent! Waiting for librarian/admin approval.';
        this.closeModal();
        this.load();
        setTimeout(() => this.success = '', 4000);
      },
      error: e => { 
        this.error = e.error?.message || 'Error saving reservation.';
        if (e.error?.data) {
          this.error += ' (' + e.error.data + ')';
        }
      }
    });
  }

  delete(r: ReservationDto) {
    if (!confirm('Delete this reservation?')) return;
    this.resService.delete(r.reservationId!).subscribe({
      next: () => { this.success = 'Reservation deleted.'; this.load(); setTimeout(() => this.success = '', 3000); },
      error: e => { this.error = e.error?.message || 'Error deleting.'; }
    });
  }

  cancelReservation(r: ReservationDto) {
    if (!confirm('Are you sure you want to cancel this reservation request?')) return;
    this.resService.update(r.reservationId!, { status: 'Cancelled' }).subscribe({
      next: () => { 
        this.success = 'Reservation cancelled successfully.'; 
        this.load(); 
        setTimeout(() => this.success = '', 3000); 
      },
      error: e => { this.error = e.error?.message || 'Error cancelling reservation.'; }
    });
  }

  statusClass(s?: string): string {
    if (s === 'Pending')   return 'badge-warning';
    if (s === 'Active')    return 'badge-success';
    if (s === 'Cancelled') return 'badge-danger';
    if (s === 'Fulfilled') return 'badge-muted';
    return 'badge-muted';
  }

  statusIcon(s?: string): string {
    if (s === 'Pending')   return '⏳';
    if (s === 'Active')    return '✅';
    if (s === 'Cancelled') return '❌';
    if (s === 'Fulfilled') return '📦';
    return '•';
  }
}
