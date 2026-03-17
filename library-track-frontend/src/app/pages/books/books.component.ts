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

  form: any = { title: '', author: '', isbn: '', categoryId: '', availabilityStatus: 'Available', copies: 1 };
  formErrors: any = {};

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
      if (params['categoryId'] && params['bookId']) {
        this.selectedCategoryId = Number(params['categoryId']);
        const cat = this.categories.find(c => c.categoryId === this.selectedCategoryId);
        this.filterCategory = cat ? cat.name : '';
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
      result = result.filter(b => b.availabilityStatus === 'NotAvailable' || (b.copies ?? 0) <= 0);
    }

    // Filter by category
    if (this.filterCategory !== '') {
      result = result.filter(b => b.category?.name === this.filterCategory);
      this.selectedCategory = this.categories.find(c => c.name === this.filterCategory) || null;
      this.selectedCategoryId = this.selectedCategory?.categoryId || null;
    } else {
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
      this.filtered.sort((a, b) => (a.copies ?? 0) - (b.copies ?? 0));
    } else if (this.sortBy === 'copiesDesc') {
      this.filtered.sort((a, b) => (b.copies ?? 0) - (a.copies ?? 0));
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
    this.form = { title: '', author: '', isbn: '', categoryId: this.selectedCategoryId || '', availabilityStatus: 'Available', copies: 1 };
    this.formErrors = {};
    this.error = '';
    this.showModal = true;
  }

  openEdit(b: Book) {
    this.editing = b;
    this.form = { title: b.title, author: b.author, isbn: b.isbn || '', categoryId: b.category?.categoryId || '', availabilityStatus: b.availabilityStatus || 'Available', copies: b.copies ?? 1 };
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
    if (this.form.copies < 0) this.formErrors.copies = 'Copies cannot be negative.';
    return Object.keys(this.formErrors).length === 0;
  }

  save() {
    if (!this.validate()) return;
    const payload = { ...this.form, category: { categoryId: Number(this.form.categoryId) }, copies: Number(this.form.copies) };
    const obs = this.editing
      ? this.bookService.update(this.editing.bookId!, this.selectedCategoryId || Number(this.form.categoryId), payload)
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
    if (b.copies === undefined || b.copies === null) return '';
    if (b.copies <= 0) return 'Not Available';
    
    if (this.auth.isAdminOrLibrarian() && b.totalCopies !== undefined) {
      return `${b.copies} / ${b.totalCopies}`;
    }
    
    return `${b.copies} cop${b.copies === 1 ? 'y' : 'ies'}`;
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
    return b.availabilityStatus === 'Available' && (b.copies ?? 0) > 0;
  }

  canLoan(b: Book): boolean {
    return b.availabilityStatus === 'Available' && (b.copies ?? 0) > 0;
  }
}
