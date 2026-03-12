import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { ReadingProgressService } from '../../core/services/reading-progress.service';
import { ReadingProgressDto } from '../../models/models';

@Component({
  selector: 'app-reading-progress',
  templateUrl: './reading-progress.component.html',
  styleUrls: ['./reading-progress.component.scss']
})
export class ReadingProgressComponent implements OnInit {
  progresses: ReadingProgressDto[] = [];
  loading = false;
  error = '';
  success = '';
  showModal = false;
  editing: ReadingProgressDto | null = null;

  // Backend fields: pagesRead, totalPages
  // Percentage is auto-calculated now
  form: any = { bookId: '', pagesRead: 0, totalPages: 0 };
  formErrors: any = {};

  constructor(public auth: AuthService, private progressService: ReadingProgressService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.error = '';
    this.progressService.getAll().subscribe({
      next: r => { this.progresses = r.data || []; this.loading = false; },
      error: e => { this.error = e.error?.message || 'Could not load reading progress.'; this.loading = false; }
    });
  }

  openAdd() {
    this.editing = null;
    this.form = { bookId: '', pagesRead: 0, totalPages: 0 };
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
    if (!this.editing && !this.form.bookId) this.formErrors.bookId = 'Book ID is required.';
    
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
