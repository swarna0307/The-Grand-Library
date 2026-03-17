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
  error = '';
  success = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router) {}

  register() {
    this.error = '';
    this.success = '';
    // Trim all fields to prevent spaces-only input
    const trimmedForm = {
      username: this.form.username.trim(),
      email: this.form.email.trim(),
      password: this.form.password.trim(),
      gender: this.form.gender.trim(),
      phone: this.form.phone.trim(),
      address: this.form.address.trim()
    };
    if (!trimmedForm.username || !trimmedForm.email || !trimmedForm.password || !trimmedForm.gender || !trimmedForm.phone || !trimmedForm.address) {
      this.error = 'Please fill in all required fields.';
      return;
    }
    // Additional validation for phone and password
    const phonePattern = /^[0-9]{10}$/;
    if (!phonePattern.test(trimmedForm.phone)) {
      this.error = 'Phone must be 10 digits.';
      return;
    }
    if (trimmedForm.password.length < 6) {
      this.error = 'Password must be at least 6 characters.';
      return;
    }
    this.loading = true;
    const payload = { ...trimmedForm, phone: trimmedForm.phone ? Number(trimmedForm.phone) : undefined };
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
