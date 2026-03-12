export type UserRole = 'ADMIN' | 'LIBRARIAN' | 'READER';

export interface Role {
  id?: number;
  name: string;
}

export interface UserDto {
  id?: number;
  username: string;
  email: string;
  phone?: string;
  gender?: string;
  address?: string;
  role?: Role;
  registeredDate?: string;
}

export interface Category {
  categoryId?: number;
  name: string;
  description?: string;
}

export interface Book {
  bookId?: number;
  title: string;
  author: string;
  isbn?: string;
  category?: Category;
  availabilityStatus?: 'Available' | 'Loaned' | 'Reserved';
}

export interface LoanDto {
  loanId?: number;
  userId?: number;
  userName?: string;
  book?: Book;
  loanDate?: string;
  dueDate?: string;
  returnDate?: string;
  status?: 'Active' | 'Overdue' | 'Returned';
}

export interface ReservationDto {
  reservationId?: number;
  userId?: number;
  userName?: string;
  book?: Book;
  reservedDate?: string;
  status?: 'Pending' | 'Active' | 'Cancelled' | 'Fulfilled';
}

export interface ReadingProgressDto {
  progressId?: number;
  userId?: number;
  username?: string;
  book?: Book;
  pagesRead?: number;
  totalPages?: number;
  percentageComplete?: number;
  lastUpdated?: string;
}

export interface DashboardDto {
  totalBooks?: number;
  totalCategories?: number;
  totalLoans?: number;
  totalReservations?: number;
  booksPerCategory?: { [key: string]: number };
  booksByAvailability?: { [key: string]: number };
}

export interface CategoryDto {
  categoryId?: number;
  name?: string;
  description?: string;
  books?: Book[];
}

export interface ResponseStructure<T> {
  message?: string;
  data: T;
  status?: number;
}
