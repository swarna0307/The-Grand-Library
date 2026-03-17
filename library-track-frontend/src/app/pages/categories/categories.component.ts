import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { CategoryService } from '../../core/services/category.service';
import { Category, ResponseStructure } from '../../models/models';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent implements OnInit {
  categories: Category[] = [];
  filteredCategories: Category[] = [];
  searchTerm = '';
  sortBy = 'nameAsc';
  filterByCategory = '';
  loading = false;
  error = '';
  success = '';
  showModal = false;
  editing: Category | null = null;

  form: Category = { name: '', description: '' };
  formErrors: any = {};

  constructor(public auth: AuthService, private catService: CategoryService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.catService.getAll().subscribe({
      next: r => { 
        this.categories = r.data; 
        this.applySearch();
        this.loading = false; 
      },
      error: (e) => { this.error = e.error?.message || 'Could not load categories.'; this.loading = false; }
    });
  }

  applySearch() {
    const term = this.searchTerm.toLowerCase();
    let result = [...this.categories];
    if (term) {
      result = result.filter(c => c.name?.toLowerCase().includes(term) || c.description?.toLowerCase().includes(term));
    }
    if (this.filterByCategory) {
      result = result.filter(c => c.name === this.filterByCategory);
    }
    this.filteredCategories = result;
    this.applySort();
  }

  applySort() {
    if (this.sortBy === 'nameAsc') {
      this.filteredCategories.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (this.sortBy === 'nameDesc') {
      this.filteredCategories.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    }
  }

  openAdd() {
    this.editing = null;
    this.form = { name: '', description: '' };
    this.formErrors = {};
    this.error = '';
    this.showModal = true;
  }

  openEdit(c: Category) {
    this.editing = c;
    this.form = { name: c.name, description: c.description || '' };
    this.formErrors = {};
    this.error = '';
    this.showModal = true;
  }

  closeModal() { this.showModal = false; this.error = ''; }

  validate(): boolean {
    this.formErrors = {};
    if (!this.form.name?.trim()) this.formErrors.name = 'Category name is required.';
    if (!this.form.description?.trim()) this.formErrors.description = 'Description is required.';
    return Object.keys(this.formErrors).length === 0;
  }

  save() {
    if (!this.validate()) return;
    const obs = this.editing
      ? this.catService.update(this.editing.categoryId!, this.form)
      : this.catService.create(this.form);

    obs.subscribe({
      next: () => {
        this.success = `Category ${this.editing ? 'updated' : 'created'} successfully!`;
        this.closeModal();
        this.load();
        setTimeout(() => this.success = '', 3000);
      },
      error: e => { this.error = e.error?.message || 'Error saving category.'; }
    });
  }

  delete(c: Category) {
    if (!confirm(`Delete category "${c.name}"?`)) return;
    this.catService.delete(c.categoryId!).subscribe({
      next: () => { this.success = `"${c.name}" deleted.`; this.load(); setTimeout(() => this.success = '', 3000); },
      error: e => { this.error = e.error?.message || 'Error deleting.'; }
    });
  }
}
