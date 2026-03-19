import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Book, Category, CategoryDto, ResponseStructure } from '../../models/models';
import { CategoryService } from './category.service';

@Injectable({ providedIn: 'root' })
export class BookService {
  private catApi = `${environment.apiUrl}/categories`;

  constructor(private http: HttpClient, private catService: CategoryService) {}

  /** Fetch all books by loading every category, gracefully skipping any that fail */
  getAll(): Observable<ResponseStructure<Book[]>> {
    return this.catService.getAll().pipe(
      switchMap(res => {
        const cats: Category[] = res.data || [];
        if (cats.length === 0) {
          return of({ data: [] } as ResponseStructure<Book[]>);
        }
        const requests = cats.map(c =>
          this.http.get<ResponseStructure<CategoryDto>>(`${this.catApi}/${c.categoryId}/books`).pipe(
            map(r => (r.data?.books || []).map((b: Book) => ({ ...b, category: c }))),
            catchError(() => of([] as Book[])) // silently skip failed categories
          )
        );
        return forkJoin(requests).pipe(
          map(results => ({ data: (results as Book[][]).flat() } as ResponseStructure<Book[]>))
        );
      }),
      catchError(e => of({ data: [], message: e.error?.message || 'Error loading books.' } as ResponseStructure<Book[]>))
    );
  }

  /** Fetch books for a single category */
  getByCategory(categoryId: number): Observable<ResponseStructure<CategoryDto>> {
    return this.http.get<ResponseStructure<CategoryDto>>(`${this.catApi}/${categoryId}/books`);
  }

  /** Get book by ISBN globally */
  getByIsbn(isbn: string): Observable<ResponseStructure<Book>> {
    return this.http.get<ResponseStructure<Book>>(`${environment.apiUrl}/books/isbn/${isbn}`);
  }

  /** Get single book */
  getById(categoryId: number, bookId: number): Observable<ResponseStructure<Book>> {
    return this.http.get<ResponseStructure<Book>>(`${this.catApi}/${categoryId}/books/${bookId}`);
  }

  /** Create book under a category */
  create(categoryId: number, book: any): Observable<ResponseStructure<Book>> {
    return this.http.post<ResponseStructure<Book>>(`${this.catApi}/${categoryId}/books`, book);
  }

  /** Update book (PATCH) */
  update(bookId: number, categoryId: number, book: any): Observable<ResponseStructure<Book>> {
    return this.http.patch<ResponseStructure<Book>>(`${this.catApi}/${categoryId}/books/${bookId}`, book);
  }

  /** Delete book */
  delete(categoryId: number, bookId: number): Observable<ResponseStructure<string>> {
    return this.http.delete<ResponseStructure<string>>(`${this.catApi}/${categoryId}/books/${bookId}`);
  }
}
