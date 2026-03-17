import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { LoanService } from '../../core/services/loan.service';
import { LoanDto, Book } from '../../models/models';
import { BookService } from '../../core/services/book.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-loans',
  templateUrl: './loans.component.html',
  styleUrls: ['./loans.component.scss']
})
export class LoansComponent implements OnInit {
  loans: LoanDto[] = [];
  filtered: LoanDto[] = [];
  loading = false;
  error = '';
  success = '';
  showModal = false;
  editingLoan: LoanDto | null = null;
  lookingUpBook = false;
  foundBook: Book | null = null;

  // Filter / Sort / Search
  filterStatus = '';
  sortBy = 'idDesc';
  searchTerm = '';


  loanForm: any = { userId: '', bookId: '', isbnQuery: '', dueDate: '', loanStatus: 'Active', returnDate: '' };
  formErrors: any = {};

  constructor(
    public auth: AuthService,
    private loanService: LoanService,
    private bookService: BookService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.load();
    this.route.queryParams.subscribe(params => {
      if (params['categoryId'] && params['bookId']) {
        this.openAdd();
        this.lookupBookById(+params['categoryId'], +params['bookId']);
      } else if (params['isbn']) {
        this.openAdd();
        this.loanForm.isbnQuery = params['isbn'];
        this.lookupBook();
      }
    });
  }

  load() {
    this.loading = true;
    this.loanService.getAll().subscribe({
      next: r => { this.loans = r.data; this.applyAll(); this.loading = false; },
      error: (e) => { this.error = e.error?.message || 'Could not load loans.'; this.loading = false; }
    });
  }

  onSort(val: string) {
    if (!val) return;
    this.sortBy = val;
    this.applyAll();
  }

  onFilterStatus(val: string) {
    this.filterStatus = val;
    this.applyAll();
  }

  applyAll() {
    let result = [...this.loans];

    // Search
    const term = this.searchTerm.toLowerCase().trim();
    if (term) {
      result = result.filter(l =>
        (l.userName?.toLowerCase().includes(term)) ||
        (l.book?.title?.toLowerCase().includes(term)) ||
        (l.dueDate?.toLowerCase().includes(term)) ||
        (String(l.loanId).includes(term))
      );
    }

    // Filter by status
    if (this.filterStatus) {
      result = result.filter(l => l.status === this.filterStatus);
    }


    // Sort
    if (this.sortBy === 'readerAsc') {
      result.sort((a, b) => (a.userName || '').localeCompare(b.userName || ''));
    } else if (this.sortBy === 'readerDesc') {
      result.sort((a, b) => (b.userName || '').localeCompare(a.userName || ''));
    } else if (this.sortBy === 'bookAsc') {
      result.sort((a, b) => (a.book?.title || '').localeCompare(b.book?.title || ''));
    } else if (this.sortBy === 'bookDesc') {
      result.sort((a, b) => (b.book?.title || '').localeCompare(a.book?.title || ''));
    } else if (this.sortBy === 'dueDateAsc') {
      result.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
    } else if (this.sortBy === 'dueDateDesc') {
      result.sort((a, b) => (b.dueDate || '').localeCompare(a.dueDate || ''));
    } else if (this.sortBy === 'idDesc') {
      result.sort((a, b) => (b.loanId || 0) - (a.loanId || 0));
    } else if (this.sortBy === 'idAsc') {
      result.sort((a, b) => (a.loanId || 0) - (b.loanId || 0));
    }


    this.filtered = result;
  }

  openAdd() {
    this.editingLoan = null;
    this.loanForm = { userId: '', bookId: '', isbnQuery: '', dueDate: '', loanStatus: 'Active', returnDate: '' };
    this.foundBook = null;
    this.formErrors = {};
    this.error = '';
    this.showModal = true;
  }

  openEdit(l: LoanDto) {
    this.editingLoan = l;
    this.foundBook = l.book || null;
    this.loanForm = { loanStatus: l.status || 'Active', returnDate: l.returnDate || '', dueDate: l.dueDate || '' };
    this.formErrors = {};
    this.error = '';
    this.showModal = true;
  }

  lookupBook() {
    if (!this.loanForm.isbnQuery) return;
    this.lookingUpBook = true;
    this.error = '';
    this.bookService.getByIsbn(this.loanForm.isbnQuery).subscribe({
      next: (res) => {
        this.foundBook = res.data;
        this.loanForm.bookId = res.data.bookId;
        this.lookingUpBook = false;
      },
      error: (e) => {
        this.error = e.error?.message || 'Book not found with this ISBN.';
        this.foundBook = null;
        this.loanForm.bookId = '';
        this.lookingUpBook = false;
      }
    });
  }

  lookupBookById(categoryId: number, bookId: number) {
    this.lookingUpBook = true;
    this.error = '';
    this.bookService.getById(categoryId, bookId).subscribe({
      next: (res) => {
        this.foundBook = res.data;
        this.loanForm.bookId = res.data.bookId;
        this.loanForm.isbnQuery = res.data.isbn || '';
        this.lookingUpBook = false;
      },
      error: (e) => {
        this.error = e.error?.message || 'Book not found.';
        this.foundBook = null;
        this.loanForm.bookId = '';
        this.lookingUpBook = false;
      }
    });
  }

  closeModal() { this.showModal = false; this.error = ''; }

  validate(): boolean {
    this.formErrors = {};
    if (!this.editingLoan) {
      if (!this.loanForm.userId) this.formErrors.userId = 'User ID is required.';
      if (!this.loanForm.bookId) this.formErrors.bookId = 'Book ID is required.';
      if (!this.loanForm.dueDate) this.formErrors.dueDate = 'Due date is required.';
    }
    return Object.keys(this.formErrors).length === 0;
  }

  save() {
    if (!this.validate()) return;
    // Check availability for new loans
    if (!this.editingLoan && this.foundBook && (this.foundBook.availabilityStatus !== 'Available' || (this.foundBook.copies ?? 0) <= 0)) {
      this.error = `Cannot loan: Book has no available copies.`;
      return;
    }

    const obs = this.editingLoan
      ? this.loanService.update(this.editingLoan.loanId!, {
          status: this.loanForm.loanStatus,
          returnDate: this.loanForm.returnDate || null,
          dueDate: this.loanForm.dueDate || null
        })
      : this.loanService.create({
          user: { userId: Number(this.loanForm.userId) },
          book: { bookId: Number(this.loanForm.bookId) },
          dueDate: this.loanForm.dueDate
        });

    obs.subscribe({
      next: () => {
        this.success = `Loan ${this.editingLoan ? 'updated' : 'created'} successfully!`;
        this.closeModal();
        this.load();
        setTimeout(() => this.success = '', 3000);
      },
      error: e => { this.error = e.error?.message || 'Error saving loan.'; }
    });
  }

  delete(l: LoanDto) {
    if (!confirm('Delete this loan record?')) return;
    this.loanService.delete(l.loanId!).subscribe({
      next: () => { this.success = 'Loan deleted.'; this.load(); setTimeout(() => this.success = '', 3000); },
      error: e => { this.error = e.error?.message || 'Error deleting.'; }
    });
  }

  statusClass(s?: string): string {
    if (s === 'Active')   return 'badge-success';
    if (s === 'Overdue')  return 'badge-danger';
    if (s === 'Returned') return 'badge-muted';
    return 'badge-muted';
  }
}
