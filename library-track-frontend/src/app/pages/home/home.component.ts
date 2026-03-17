import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  features = [
    { icon: '🏛️', title: 'Our Collection', desc: 'Explore thousands of volumes from classic literature to modern bestsellers.' },
    { icon: '💻', title: 'Digital Resources', desc: 'Access e-books, journals, and digital archives from our curated selection.' },
    { icon: '🗓️', title: 'Community Events', desc: 'Join our weekly book clubs, tech workshops, and community gatherings.' },
    { icon: '🛡️', title: 'Quiet Study Zones', desc: 'Find your focus in our dedicated study areas and comfortable lounge spaces.' },
    { icon: '🤝', title: 'Membership', desc: 'Join a community of readers and enjoy exclusive member benefits.' },
    { icon: '📍', title: 'Visit Us', desc: 'Open daily with friendly staff ready to help you find your next great read.' }
  ];

  constructor(private router: Router) {}

  goToLogin() { this.router.navigate(['/login']); }
  goToRegister() { this.router.navigate(['/register']); }
}
