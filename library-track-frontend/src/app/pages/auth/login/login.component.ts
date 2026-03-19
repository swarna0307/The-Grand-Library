import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router) {
    if (this.auth.isLoggedIn()) this.router.navigate(['/dashboard']);
  }

  login() {
    if (!this.username || !this.password) { this.error = 'Please enter username and password.'; return; }
    this.loading = true; this.error = '';
    this.auth.login(this.username, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        // Show a clear message for authentication errors
        if (err.status === 401 || err.status === 403 || err.status === 404) {
          this.error = 'Incorrect username or password.';
        } else {
          this.error = 'An unexpected error occurred. Please try again later.';
        }
      }
    });
  }
}
