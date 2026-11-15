import { TestBed } from '@angular/core/testing';
import { CAMPAIGN } from '@core/campaign';

import { provideTestingEnvironment } from '../../../testing/test-providers';

import { CampaignPage, GLEAM_SCRIPT } from './campaign-page';

describe('CampaignPage', () => {
  let appended: Node[];

  beforeEach(() => {
    jasmine.clock().install();
    // Keep the real Gleam script out of the test browser; let everything else through.
    appended = [];
    const appendChild = document.body.appendChild.bind(document.body);
    spyOn(document.body, 'appendChild').and.callFake(<T extends Node>(node: T): T => {
      if (node instanceof HTMLScriptElement) {
        appended.push(node);
        return node;
      }
      return appendChild(node);
    });
  });
  afterEach(() => jasmine.clock().uninstall());

  function render(now: Date): HTMLElement {
    jasmine.clock().mockDate(now);
    TestBed.configureTestingModule({
      imports: [CampaignPage],
      providers: [provideTestingEnvironment()],
    });
    const fixture = TestBed.createComponent(CampaignPage);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the countdown before the deadline', () => {
    const element = render(new Date(CAMPAIGN.endsAt.getTime() - 90_000));
    const parts = Array.from(element.querySelectorAll('.part'), (part) => part.textContent!.trim());
    expect(parts).toEqual(['0', '00', '01', '30']);
    expect(element.querySelectorAll('.campaign-gallery img').length).toBe(3);
  });

  it('embeds the Gleam widget', () => {
    const element = render(new Date(CAMPAIGN.endsAt.getTime() - 90_000));
    const link = element.querySelector<HTMLAnchorElement>('a.e-widget')!;
    expect(link.href).toBe('https://gleam.io/G1goV/every-scar-builds-a-story');
    expect(appended.map((node) => (node as HTMLScriptElement).src)).toEqual([GLEAM_SCRIPT]);
  });

  it('says the campaign is over after the deadline', () => {
    const element = render(new Date(CAMPAIGN.endsAt.getTime() + 1000));
    expect(element.querySelector('.part')).toBeNull();
    expect(element.querySelector('[data-testid="campaign-ended"]')).not.toBeNull();
  });
});
