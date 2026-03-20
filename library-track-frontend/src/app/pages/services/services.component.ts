import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-services',
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.scss']
})
export class ServicesComponent {
  services = [
    { icon: '🏛️', title: 'Our Collection', desc: 'Explore thousands of volumes from classic literature to modern bestsellers. Our curated catalogue spans over a century of literary heritage.' },
    { icon: '🛡️', title: 'Quiet Study Zones', desc: 'Find your focus in our dedicated reading rooms, study carrels, and comfortable lounge spaces designed for deep concentration.' },
    { icon: '🤝', title: 'Membership', desc: 'Join a community of readers and enjoy exclusive member benefits — from priority reservations to event invitations.' },
    { icon: '📚', title: 'Reading Progress', desc: 'Track how far you\'ve come with any book through our member portal and set personal reading goals.' },
    { icon: '🎓', title: 'Research Assistance', desc: 'Our trained librarians are always available to help you find the right resources for your academic or personal research.' },
    { icon: '📍', title: 'Visit Us', desc: 'Open daily with friendly and knowledgeable staff ready to help you find your next great read.' }
  ];

  constructor(private router: Router) { }
  goToLogin() { this.router.navigate(['/login']); }
  goToRegister() { this.router.navigate(['/register']); }
  goHome() { this.router.navigate(['/']); }
  goTo(path: string) { this.router.navigate(['/' + path]); }
}
