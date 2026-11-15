import { TestBed } from '@angular/core/testing';
import { CAMPAIGN } from '@core/campaign';

import { provideTestingEnvironment } from '../../../testing/test-providers';

import { CampaignBanner } from './campaign-banner';

describe('CampaignBanner', () => {
  const dismissedKey = `dismissed:${CAMPAIGN.id}`;

  beforeEach(() => {
    localStorage.removeItem(dismissedKey);
    jasmine.clock().install();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
    localStorage.removeItem(dismissedKey);
  });

  function render(now: Date) {
    jasmine.clock().mockDate(now);
    TestBed.configureTestingModule({
      imports: [CampaignBanner],
      providers: [provideTestingEnvironment()],
    });
    const fixture = TestBed.createComponent(CampaignBanner);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    return { fixture, element, banner: () => element.querySelector('.campaign-banner') };
  }

  const before = (seconds: number) => new Date(CAMPAIGN.endsAt.getTime() - seconds * 1000);

  it('shows the campaign name and counts down every second', () => {
    const { fixture, element } = render(before(2 * 86_400 + 65));
    expect(element.querySelector('.campaign-title')!.textContent).toContain(
      'Every scar builds a story',
    );
    expect(element.querySelector('time')!.textContent!.replace(/\s+/g, '')).toBe('2d00h01m05s');

    jasmine.clock().tick(1000);
    fixture.detectChanges();
    expect(element.querySelector('time')!.textContent!.replace(/\s+/g, '')).toBe('2d00h01m04s');
  });

  it('stays closed once dismissed', () => {
    const { fixture, element, banner } = render(before(3600));
    element.querySelector<HTMLButtonElement>('.campaign-close')!.click();
    fixture.detectChanges();
    expect(banner()).toBeNull();

    TestBed.resetTestingModule();
    expect(render(before(3600)).banner()).toBeNull();
  });

  it('disappears at the deadline', () => {
    const { fixture, banner } = render(before(1));
    expect(banner()).not.toBeNull();

    jasmine.clock().tick(1000);
    fixture.detectChanges();
    expect(banner()).toBeNull();
  });
});
