import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChatWidget } from '@components/chat-widget/chat-widget';
import { AppConfigService } from '@core/app-config.service';
import { Footer } from '@layout/footer/footer';
import { Header } from '@layout/header/header';

@Component({
  selector: 'app-root',
  templateUrl: 'app.html',
  imports: [RouterOutlet, Header, Footer, ChatWidget],
})
export class App {
  readonly chatEnabled = inject(AppConfigService).value.chatEnabled === true;
}
