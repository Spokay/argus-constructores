import { Component } from '@angular/core';
import { CtaBand } from '@components/cta-band/cta-band';

/** About us: the brochure's mission text, split into intro, project stages and experience. */
@Component({
  selector: 'app-about',
  templateUrl: 'about.html',
  styleUrl: 'about.css',
  imports: [CtaBand],
})
export class About {}
