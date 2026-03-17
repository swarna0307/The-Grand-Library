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
  filtered: ReadingProgressDto[] = [];
  suggestedBooks: Book[] = [];
  loading = false;
  error = '';
  success = '';
  showModal = false;
  editing: ReadingProgressDto | null = null;

  // Filter / Sort / Search
  filterProgress = '';   // '' | 'inProgress' | 'completed'
  sortBy = '';
  searchTerm = '';

  form: any = { bookId: '', pagesRead: 0, totalPages: 0 };
  formErrors: any = {};

  constructor(
    public auth: AuthService,
    private progressService: ReadingProgressService,
    private loanService: LoanService,
    private reservationService: ReservationService
  ) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.error = '';
    
    const obs: any = {
      progress: this.progressService.getAll()
    };
    
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

          res.loans.data?.forEach((l: any) => {
            if (l.status === 'Active' || l.status === 'Overdue') {
              if (l.book && !trackedBookIds.has(l.book.bookId)) {
                suggestions.set(l.book.bookId!, l.book);
              }
            }
          });

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

    // Filter by progress status
    if (this.filterProgress === 'inProgress') {
      result = result.filter(p => (p.percentageComplete ?? 0) < 100);
    } else if (this.filterProgress === 'completed') {
      result = result.filter(p => (p.percentageComplete ?? 0) >= 100);
    }

    // Search (admin/librarian only)
    if (this.auth.isAdminOrLibrarian() && this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(p =>
        p.username?.toLowerCase().includes(term) ||
        p.book?.title?.toLowerCase().includes(term)
      );
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
    } else if (this.sortBy === 'percentAsc') {
      result.sort((a, b) => (a.percentageComplete ?? 0) - (b.percentageComplete ?? 0));
    } else if (this.sortBy === 'percentDesc') {
      result.sort((a, b) => (b.percentageComplete ?? 0) - (a.percentageComplete ?? 0));
    }

    this.filtered = result;
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
    this.form = { bookId: book.bookId, pagesRead: 0, totalPages: 0 };
    this.formErrors = {};
    this.error = '';
    this.showModal = true;
  }

  openEdit(p: ReadingProgressDto) {
    this.editing = p;
    this.form = { pagesRead: p.pagesRead || 0, totalPages: p.totalPages || 0 };
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
