import { Location } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

interface ErrorDetails {
  title: string;
  message: string;
  description?: string;
}

const ERROR_MAP: Record<number, ErrorDetails> = {
  401: {
    title: $localize`:@@error.401.title:Sesión requerida`,
    message: $localize`:@@error.401.message:Debe iniciar sesión para ver esta página.`,
  },
  403: {
    title: $localize`:@@error.403.title:Acceso denegado`,
    message: $localize`:@@error.403.message:No tiene permiso para ver esta página.`,
  },
  404: {
    title: $localize`:@@error.404.title:Página no encontrada`,
    message: $localize`:@@error.404.message:La página que busca no existe o fue movida.`,
  },
};

@Component({
  selector: 'app-error-page',
  imports: [RouterLink],
  templateUrl: './error-page.html',
})
export class ErrorPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);

  statusCode: number = 500;
  errorDetails: ErrorDetails = this.getErrorDetails(500);

  ngOnInit(): void {
    this.route.data.subscribe((data) => {
      this.statusCode = data['statusCode'] || 500;
      this.errorDetails = this.getErrorDetails(this.statusCode);
    });
  }

  goBack(): void {
    this.location.back();
  }

  private getErrorDetails(statusCode: number): ErrorDetails {
    return (
      ERROR_MAP[statusCode] || {
        title: $localize`:@@error.generic.title:Error`,
        message: $localize`:@@error.generic.message:Ocurrió un error inesperado. Intente de nuevo más tarde.`,
      }
    );
  }
}
