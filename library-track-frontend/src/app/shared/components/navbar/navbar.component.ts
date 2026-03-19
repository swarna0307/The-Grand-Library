import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LayoutService } from '../../../core/services/layout.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  constructor(public auth: AuthService, private router: Router, public layoutService: LayoutService) {}

  toggleSidebar() {
    this.layoutService.toggleSidebar();
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  get initials(): string {
    const n = this.auth.getUsername();
    return n ? n.charAt(0).toUpperCase() : 'U';
  }
}
