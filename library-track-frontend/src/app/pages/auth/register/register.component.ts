import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  form = { username: '', email: '', password: '', gender: '', phone: '', address: '' };
  error = ''; success = ''; loading = false;

  constructor(private auth: AuthService, private router: Router) {}

  register() {
    if (!this.form.username || !this.form.email || !this.form.password) {
      this.error = 'Please fill in all required fields.'; return;
    }
    this.loading = true; this.error = ''; this.success = '';
    const payload = { ...this.form, phone: this.form.phone ? Number(this.form.phone) : undefined };
    this.auth.register(payload).subscribe({
      next: () => {
        this.loading = false;
        this.success = 'Account created! Redirecting to login...';
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Registration failed. Please try again.';
      }
    });
  }
}
