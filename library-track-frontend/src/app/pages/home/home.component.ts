import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  features = [
    { icon: '📚', title: 'Great Collection', desc: 'A vast collection of physical volumes spanning a century of literature.' },
    { icon: '🛡️', title: 'Quiet Heritage', desc: 'Dedicated focus zones in our stunning architectural halls.' },
    { icon: '🤝', title: 'Community', desc: 'Join a vibrant local community of readers and thinkers.' }
  ];

  constructor(private router: Router) {}

  goToLogin() { this.router.navigate(['/login']); }
  goToRegister() { this.router.navigate(['/register']); }
  goHome() { this.router.navigate(['/']); }
  goTo(path: string) { this.router.navigate(['/' + path]); }
}
