import { Component, inject } from '@angular/core';
import { AuthService } from '@auth/auth.service';

/** Placeholder for the project management screen. */
@Component({
  selector: 'app-admin',
  template: `<h2>Administration</h2>
    <p>Logged in as {{ username() }}.</p>`,
})
export class Admin {
  readonly username = inject(AuthService).username;
}
