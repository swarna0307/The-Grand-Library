import { Component, OnInit, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { BookService } from '../../core/services/book.service';
import { CategoryService } from '../../core/services/category.service';
import { Book, Category } from '../../models/models';

@Component({
  selector: 'app-books',
  templateUrl: './books.component.html',
  styleUrls: ['./books.component.scss']
})
export class BooksComponent implements OnInit {
  categories: Category[] = [];
  books: Book[] = [];
  filtered: Book[] = [];
  selectedCategoryId: number | null = null;
  selectedCategory: Category | null = null;
  selectedBook: Book | null = null;

  searchTerm = '';
  sortBy = 'sort';
  filterAvailability = '';
  filterCategory = '';
  filterDropdownOpen = false;
  loading = false;
  error = '';
  success = '';
  showModal = false;
  showDetail = false;
  editing: Book | null = null;

  form: any = { title: '', author: '', isbn: '', categoryId: '', availabilityStatus: 'Available', totalCopies: null };
  formErrors: any = {};

  readonly STATUS_OPTIONS = [
    { value: 'Available', label: '✅ Available' },
    { value: 'NotAvailable', label: '🚫 Not Available' }
  ];

  constructor(
    public auth: AuthService,
    private bookService: BookService,
    private catService: CategoryService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.catService.getAll().subscribe({ next: r => { this.categories = r.data; } });
    this.route.queryParams.subscribe(params => {
      if (params['categoryId']) {
        this.selectedCategoryId = Number(params['categoryId']);
        this.loadAll();
      } else {
        this.loadAll();
      }
    });
  }

  loadAll() {
    this.loading = true;
    this.bookService.getAll().subscribe({
      next: r => { this.books = r.data; this.applyAll(); this.loading = false; },
      error: () => { this.error = 'Could not load books.'; this.loading = false; }
    });
  }

  applyAll() {
    let result = [...this.books];

    // Filter by availability
    if (this.filterAvailability === 'Available') {
      result = result.filter(b => b.availabilityStatus === 'Available');
    } else if (this.filterAvailability === 'NotAvailable') {
      result = result.filter(b => b.availabilityStatus === 'NotAvailable');
    }

    // Filter by category
    if (this.filterCategory !== '') {
      result = result.filter(b => b.category?.name === this.filterCategory);
      this.selectedCategory = this.categories.find(c => c.name === this.filterCategory) || null;
      this.selectedCategoryId = this.selectedCategory?.categoryId || null;
    } else if (this.selectedCategoryId) {
      // If we have a selectedCategoryId from the URL but filterCategory is empty,
      // it means the user explicitly selected "All Categories" from the dropdown.
      // We should clear the selected category to show all books.
      this.selectedCategory = null;
      this.selectedCategoryId = null;
    }

    // Search
    const term = this.searchTerm.toLowerCase();
    if (term) {
      result = result.filter(b =>
        b.title?.toLowerCase().includes(term) ||
        b.author?.toLowerCase().includes(term) ||
        b.isbn?.toLowerCase().includes(term)
      );
    }

    this.filtered = result;
    this.applySort();
  }

  onSort(val: string): void {
    if (!val) return;
    this.sortBy = val;
    this.applySort();
  }

  applySort() {
    if (this.sortBy === 'titleAsc' || this.sortBy === 'sort' || !this.sortBy) {
      this.filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (this.sortBy === 'titleDesc') {
      this.filtered.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
    } else if (this.sortBy === 'authorAsc') {
      this.filtered.sort((a, b) => (a.author || '').localeCompare(b.author || ''));
    } else if (this.sortBy === 'authorDesc') {
      this.filtered.sort((a, b) => (b.author || '').localeCompare(a.author || ''));
    } else if (this.sortBy === 'copiesAsc') {
      this.filtered.sort((a, b) => (a.availableCopies ?? 0) - (b.availableCopies ?? 0));
    } else if (this.sortBy === 'copiesDesc') {
      this.filtered.sort((a, b) => (b.availableCopies ?? 0) - (a.availableCopies ?? 0));
    }
  }

  toggleFilterDropdown() {
    this.filterDropdownOpen = !this.filterDropdownOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-filter-dropdown')) {
      this.filterDropdownOpen = false;
    }
  }

  openDetail(b: Book) { this.selectedBook = b; this.showDetail = true; }
  closeDetail() { this.showDetail = false; }

  openAdd() {
    this.editing = null;
    this.form = { title: '', author: '', isbn: '', categoryId: this.selectedCategoryId || '', availabilityStatus: 'Available', totalCopies: null };
    this.formErrors = {};
    this.error = '';
    this.showModal = true;
  }

  openEdit(b: Book) {
    this.editing = b;
    this.form = { title: b.title, author: b.author, isbn: b.isbn || '', categoryId: b.category?.categoryId || '', availabilityStatus: b.availabilityStatus || 'Available', totalCopies: b.totalCopies ?? 1 };
    this.formErrors = {};
    this.error = '';
    this.showModal = true;
  }

  closeModal() { this.showModal = false; this.error = ''; }

  validate(): boolean {
    this.formErrors = {};
    if (!this.form.title?.trim()) this.formErrors.title = 'Title is required.';
    if (!this.form.author?.trim()) this.formErrors.author = 'Author is required.';
    if (!this.form.isbn?.trim()) this.formErrors.isbn = 'ISBN is required.';
    if (!this.form.categoryId) this.formErrors.categoryId = 'Category is required.';
    if (this.form.totalCopies === null || this.form.totalCopies === undefined || this.form.totalCopies === '') {
      this.formErrors.totalCopies = 'Total copies is required.';
    } else if (this.form.totalCopies < 1) {
      this.formErrors.totalCopies = 'Total copies must be at least 1.';
    }
    return Object.keys(this.formErrors).length === 0;
  }

  save() {
    if (!this.validate()) return;
    const payload = { ...this.form, category: { categoryId: Number(this.form.categoryId) }, totalCopies: Number(this.form.totalCopies), availableCopies: this.editing ? this.editing.availableCopies : Number(this.form.totalCopies) };
    const obs = this.editing
      ? this.bookService.update(this.editing.bookId!, Number(this.form.categoryId), payload)
      : this.bookService.create(Number(this.form.categoryId), payload);

    obs.subscribe({
      next: () => {
        this.success = `Book ${this.editing ? 'updated' : 'added'} successfully!`;
        this.closeModal();
        this.loadAll();
        setTimeout(() => this.success = '', 3000);
      },
      error: e => { this.error = e.error?.message || 'Error saving book.'; }
    });
  }

  delete(b: Book) {
    if (!confirm(`Delete "${b.title}"?`)) return;
    this.bookService.delete(b.category?.categoryId!, b.bookId!).subscribe({
      next: () => {
        this.success = `"${b.title}" deleted.`;
        this.loadAll();
        setTimeout(() => this.success = '', 3000);
      },
      error: e => { this.error = e.error?.message || 'Error deleting.'; }
    });
  }

  availClass(status?: string): string {
    if (status === 'Available') return 'avail-available';
    return 'avail-not-available';
  }

  copiesLabel(b: Book): string {
    if (b.availableCopies === undefined || b.totalCopies === undefined) return 'Availability Unknown';
    return `${b.availableCopies} / ${b.totalCopies} Available`;
  }

  loanBook(b: Book) {
    this.closeDetail();
    this.router.navigate(['/loans'], { queryParams: { categoryId: b.category?.categoryId, bookId: b.bookId } });
  }

  reserveBook(b: Book) {
    this.closeDetail();
    this.router.navigate(['/reservations'], { queryParams: { categoryId: b.category?.categoryId, bookId: b.bookId } });
  }

  canReserve(b: Book): boolean {
    return (b.availableCopies ?? 0) > 0;
  }

  canLoan(b: Book): boolean {
    return (b.availableCopies ?? 0) > 0;
  }
}
