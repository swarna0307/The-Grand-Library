import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { ReadingProgressService } from '../../core/services/reading-progress.service';
import { LoanService } from '../../core/services/loan.service';
import { ReservationService } from '../../core/services/reservation.service';
import { ReadingProgressDto, Book } from '../../models/models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-reading-progress',
  templateUrl: './reading-progress.component.html',
  styleUrls: ['./reading-progress.component.scss']
})
export class ReadingProgressComponent implements OnInit {
  progresses: ReadingProgressDto[] = [];
  suggestedBooks: Book[] = [];
  loading = false;
  error = '';
  success = '';
  showModal = false;
  editing: ReadingProgressDto | null = null;

  // Backend fields: pagesRead, totalPages
  // Percentage is auto-calculated now
  form: any = { bookId: '', pagesRead: 0, totalPages: 0 };
  formErrors: any = {};

  // Filter / Sort / Search
  searchTerm = '';
  filterStatus = ''; // '' | 'InProgress' | 'Completed'
  sortBy = 'idDesc';
  filtered: ReadingProgressDto[] = [];


  constructor(
    public auth: AuthService,
    private progressService: ReadingProgressService,
    private loanService: LoanService,
    private reservationService: ReservationService
  ) { }

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.error = '';

    const obs: any = {
      progress: this.progressService.getAll()
    };

    // Only readers get suggestions of their own books
    if (this.auth.isReader()) {
      obs.loans = this.loanService.getAll();
      obs.reservations = this.reservationService.getAll();
    }

    forkJoin(obs).subscribe({
      next: (res: any) => {
        this.progresses = res.progress.data || [];

        if (this.auth.isReader()) {
          const trackedBookIds = new Set(this.progresses.map(p => p.book?.bookId));
          const suggestions = new Map<number, Book>();

          // Add books from active loans
          res.loans.data?.forEach((l: any) => {
            if (l.status === 'Active' || l.status === 'Overdue') {
              if (l.book && !trackedBookIds.has(l.book.bookId)) {
                suggestions.set(l.book.bookId!, l.book);
              }
            }
          });

          // Add books from active reservations
          res.reservations.data?.forEach((r: any) => {
            if (r.status === 'Active') {
              if (r.book && !trackedBookIds.has(r.book.bookId)) {
                suggestions.set(r.book.bookId!, r.book);
              }
            }
          });

          this.suggestedBooks = Array.from(suggestions.values());
        }

        this.applyAll();
        this.loading = false;
      },
      error: e => {
        this.error = e.error?.message || 'Could not load data.';
        this.loading = false;
      }
    });
  }

  applyAll() {
    let result = [...this.progresses];

    // Search
    const term = this.searchTerm.toLowerCase().trim();
    if (term) {
      result = result.filter(p =>
        p.username?.toLowerCase().includes(term) ||
        p.book?.title?.toLowerCase().includes(term) ||
        String(p.progressId).includes(term)
      );
    }

    // Filter by status
    if (this.filterStatus === 'InProgress') {
      result = result.filter(p => this.getPercent(p) < 100);
    } else if (this.filterStatus === 'Completed') {
      result = result.filter(p => this.getPercent(p) >= 100);
    }

    this.filtered = result;
  }

  onSort(val: string) {
    if (!val) return;
    this.sortBy = val;
    this.applyAll();
    this.applySort();
  }

  onFilterStatus(val: string) {
    this.filterStatus = val;
    this.applyAll();
  }

  applySort() {
    if (this.sortBy === 'readerAsc') {
      this.filtered.sort((a, b) => (a.username || '').localeCompare(b.username || ''));
    } else if (this.sortBy === 'readerDesc') {
      this.filtered.sort((a, b) => (b.username || '').localeCompare(a.username || ''));
    } else if (this.sortBy === 'bookAsc') {
      this.filtered.sort((a, b) => (a.book?.title || '').localeCompare(b.book?.title || ''));
    } else if (this.sortBy === 'bookDesc') {
      this.filtered.sort((a, b) => (b.book?.title || '').localeCompare(a.book?.title || ''));
    } else if (this.sortBy === 'pctDesc') {
      this.filtered.sort((a, b) => this.getPercent(b) - this.getPercent(a));
    } else if (this.sortBy === 'pctAsc') {
      this.filtered.sort((a, b) => this.getPercent(a) - this.getPercent(b));
    } else if (this.sortBy === 'idDesc') {
      this.filtered.sort((a, b) => (b.progressId || 0) - (a.progressId || 0));
    } else if (this.sortBy === 'idAsc') {
      this.filtered.sort((a, b) => (a.progressId || 0) - (b.progressId || 0));
    }
  }


  openAdd() {
    this.editing = null;
    this.form = { bookId: '', pagesRead: 0, totalPages: 0 };
    this.formErrors = {};
    this.error = '';
    this.showModal = true;
  }

  startTracking(book: Book) {
    this.editing = null;
    this.form = {
      bookId: book.bookId,
      pagesRead: 0,
      totalPages: 0 // No default, user must enter
    };
    this.formErrors = {};
    this.error = '';
    this.showModal = true;
  }

  openEdit(p: ReadingProgressDto) {
    this.editing = p;
    this.form = {
      pagesRead: p.pagesRead || 0,
      totalPages: p.totalPages || 0
    };
    this.formErrors = {};
    this.error = '';
    this.showModal = true;
  }

  closeModal() { this.showModal = false; this.error = ''; }

  validate(): boolean {
    this.formErrors = {};
    if (!this.editing && !this.form.bookId) this.formErrors.bookId = 'Please select a book you currently have.';

    if (Number(this.form.pagesRead) < 0) this.formErrors.pagesRead = 'Pages read cannot be negative.';
    if (Number(this.form.totalPages) <= 0) this.formErrors.totalPages = 'Total pages must be greater than zero.';
    if (Number(this.form.pagesRead) > Number(this.form.totalPages)) this.formErrors.pagesRead = 'Pages read cannot exceed total pages.';

    return Object.keys(this.formErrors).length === 0;
  }

  save() {
    if (!this.validate()) return;
    const userId = Number(this.auth.getUserId());

    const calculatedPercentage = (Number(this.form.pagesRead) / Number(this.form.totalPages)) * 100;

    const payload = this.editing
      ? { pagesRead: Number(this.form.pagesRead), totalPages: Number(this.form.totalPages), percentageComplete: calculatedPercentage }
      : {
        user: { userId },
        book: { bookId: Number(this.form.bookId) },
        pagesRead: Number(this.form.pagesRead),
        totalPages: Number(this.form.totalPages),
        percentageComplete: calculatedPercentage
      };

    const obs = this.editing
      ? this.progressService.update(this.editing.progressId!, payload)
      : this.progressService.create(payload);

    obs.subscribe({
      next: () => {
        this.success = `Progress ${this.editing ? 'updated' : 'created'}!`;
        this.closeModal();
        this.load();
        setTimeout(() => this.success = '', 3000);
      },
      error: e => { this.error = e.error?.message || 'Error saving progress.'; }
    });
  }

  delete(p: ReadingProgressDto) {
    if (!confirm('Delete this reading progress entry?')) return;
    this.progressService.delete(p.progressId!).subscribe({
      next: () => { this.success = 'Progress deleted.'; this.load(); setTimeout(() => this.success = '', 3000); },
      error: e => { this.error = e.error?.message || 'Error deleting.'; }
    });
  }

  getPercent(p: ReadingProgressDto): number {
    return Math.min(100, Math.max(0, p.percentageComplete || 0));
  }
}