import { Component, OnInit } from '@angular/core';
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
  loading = false;
  error = '';
  success = '';
  showModal = false;
  showDetail = false;
  editing: Book | null = null;

  form: any = { title: '', author: '', isbn: '', categoryId: '', availabilityStatus: 'Available' };
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
      if (params['categoryId']) {
        this.selectCategory(Number(params['categoryId']));
      } else {
        this.loadAll();
      }
    });
  }

  loadAll() {
    this.selectedCategoryId = null;
    this.selectedCategory = null;
    this.loading = true;
    this.bookService.getAll().subscribe({
      next: r => { this.books = r.data; this.applySearch(); this.loading = false; },
      error: () => { this.error = 'Could not load books.'; this.loading = false; }
    });
  }

  selectCategory(catId: number) {
    this.selectedCategoryId = catId;
    this.selectedCategory = this.categories.find(c => c.categoryId === catId) || null;
    this.loading = true;
    this.bookService.getByCategory(catId).subscribe({
      next: r => { 
        this.books = r.data?.books || []; 
        this.applySearch(); 
        this.loading = false; 
      },
      error: (e) => { 
        this.error = e.error?.message || 'Could not load books for this category.'; 
        this.loading = false; 
      }
    });
  }

  applySearch() {
    const term = this.searchTerm.toLowerCase();
    this.filtered = term
      ? this.books.filter(b => b.title?.toLowerCase().includes(term) || b.author?.toLowerCase().includes(term))
      : [...this.books];
  }

  openDetail(b: Book) { this.selectedBook = b; this.showDetail = true; }
  closeDetail() { this.showDetail = false; }

  openAdd() {
    this.editing = null;
    this.form = { title: '', author: '', isbn: '', categoryId: this.selectedCategoryId || '', availabilityStatus: 'Available' };
    this.formErrors = {};
    this.error = '';
    this.showModal = true;
  }

  openEdit(b: Book) {
    this.editing = b;
    this.form = { title: b.title, author: b.author, isbn: b.isbn || '', categoryId: b.category?.categoryId || '', availabilityStatus: b.availabilityStatus || 'Available' };
    this.formErrors = {};
    this.error = '';
    this.showModal = true;
  }

  closeModal() { this.showModal = false; this.error = ''; }

  validate(): boolean {
    this.formErrors = {};
    if (!this.form.title?.trim()) this.formErrors.title = 'Title is required.';
    if (!this.form.author?.trim()) this.formErrors.author = 'Author is required.';
    if (!this.form.categoryId) this.formErrors.categoryId = 'Category is required.';
    return Object.keys(this.formErrors).length === 0;
  }

  save() {
    if (!this.validate()) return;
    const payload = { ...this.form, category: { categoryId: Number(this.form.categoryId) } };
    const obs = this.editing
      ? this.bookService.update(this.editing.bookId!, this.selectedCategoryId || Number(this.form.categoryId), payload)
      : this.bookService.create(Number(this.form.categoryId), payload);

    obs.subscribe({
      next: () => {
        this.success = `Book ${this.editing ? 'updated' : 'added'} successfully!`;
        this.closeModal();
        this.selectedCategoryId ? this.selectCategory(this.selectedCategoryId) : this.loadAll();
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
        this.selectedCategoryId ? this.selectCategory(this.selectedCategoryId) : this.loadAll();
        setTimeout(() => this.success = '', 3000);
      },
      error: e => { this.error = e.error?.message || 'Error deleting.'; }
    });
  }

  availClass(status?: string): string {
    if (status === 'Available') return 'avail-available';
    if (status === 'Loaned')    return 'avail-loaned';
    return 'avail-reserved';
  }

  canReserve(b: Book): boolean {
    return b.availabilityStatus === 'Available';
  }

  canLoan(b: Book): boolean {
    return b.availabilityStatus === 'Available';
  }

  reserveBook(b: Book) {
    this.closeDetail();
    this.router.navigate(['/reservations'], { queryParams: { bookId: b.bookId } });
  }

  loanBook(b: Book) {
    this.closeDetail();
    this.router.navigate(['/loans'], { queryParams: { bookId: b.bookId } });
  }
}
