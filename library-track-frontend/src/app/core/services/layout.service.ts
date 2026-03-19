import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  private collapsedObj = new BehaviorSubject<boolean>(localStorage.getItem('sidebar_collapsed') === 'true');
  sidebarCollapsed$ = this.collapsedObj.asObservable();

  constructor() {
    this.updateBodyClass(this.collapsedObj.value);
  }

  toggleSidebar() {
    const newVal = !this.collapsedObj.value;
    this.collapsedObj.next(newVal);
    localStorage.setItem('sidebar_collapsed', String(newVal));
    this.updateBodyClass(newVal);
  }

  private updateBodyClass(collapsed: boolean) {
    if (collapsed) {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }
  }
}
