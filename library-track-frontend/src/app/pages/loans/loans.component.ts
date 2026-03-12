import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { LoanService } from '../../core/services/loan.service';
import { LoanDto, Book } from '../../models/models';
import { BookService } from '../../core/services/book.service';

@Component({
  selector: 'app-loans',
  templateUrl: './loans.component.html',
  styleUrls: ['./loans.component.scss']
})
export class LoansComponent implements OnInit {
  loans: LoanDto[] = [];
  loading = false;
  error = '';
  success = '';
  showModal = false;
  editingLoan: LoanDto | null = null;
  lookingUpBook = false;
  foundBook: Book | null = null;

  loanForm: any = { userId: '', bookId: '', isbnQuery: '', dueDate: '', loanStatus: 'Active', returnDate: '' };
  formErrors: any = {};

  constructor(
    public auth: AuthService, 
    private loanService: LoanService,
    private bookService: BookService
  ) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.loanService.getAll().subscribe({
      next: r => { this.loans = r.data; this.loading = false; },
      error: (e) => { this.error = e.error?.message || 'Could not load loans.'; this.loading = false; }
    });
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
    if (!this.editingLoan && this.foundBook && this.foundBook.availabilityStatus !== 'Available') {
      this.error = `Cannot loan: Book status is ${this.foundBook.availabilityStatus}. Only Available books can be loaned.`;
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
