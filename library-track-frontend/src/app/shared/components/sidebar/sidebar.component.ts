import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LayoutService } from '../../../core/services/layout.service';

interface NavItem { label: string; icon: string; route: string; }

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  collapsed = false;
  menuItems: NavItem[] = [];
  activeRoute = '';

  constructor(public auth: AuthService, private router: Router, public layoutService: LayoutService) {}

  ngOnInit() {
    this.layoutService.sidebarCollapsed$.subscribe(c => this.collapsed = c);
    this.buildNav();
    this.activeRoute = this.router.url;
    this.router.events.subscribe(() => { this.activeRoute = this.router.url; });
  }

  buildNav() {
    const role = this.auth.getRole();
    const items: NavItem[] = [
      { label: 'Dashboard', icon: '🏠', route: '/dashboard' }
    ];

    if (role === 'ADMIN' || role === 'LIBRARIAN') {
      items.push(
        { label: 'Categories',       icon: '🗂️', route: '/categories' },
        { label: 'Books',            icon: '📖', route: '/books' },
        { label: 'Loans',            icon: '📋', route: '/loans' },
        { label: 'Reservations',     icon: '🔖', route: '/reservations' },
        { label: 'Reading Progress', icon: '📈', route: '/reading-progress' }
      );
      if (role === 'ADMIN') {
        items.push({ label: 'Users', icon: '👥', route: '/users' });
      }
    } else {
      // READER
      items.push(
        { label: 'Categories',       icon: '🗂️', route: '/categories' },
        { label: 'Browse Books',     icon: '📖', route: '/books' },
        { label: 'My Loans',         icon: '📋', route: '/loans' },
        { label: 'My Reservations',  icon: '🔖', route: '/reservations' },
        { label: 'My Reading',       icon: '📈', route: '/reading-progress' }
      );
    }

    this.menuItems = items;
  }



  navigate(route: string) { this.router.navigate([route]); }

}
