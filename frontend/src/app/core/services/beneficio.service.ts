import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, switchMap, tap, throwError } from 'rxjs';

import { Beneficio } from '../models/beneficio.model';
import { CustomError } from '../models/custom-error.model';
import { TransferRequest } from '../models/transfer-request.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BeneficioService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/v1/beneficios`;

  private readonly beneficiosSubject = new BehaviorSubject<Beneficio[]>([]);
  readonly beneficios$ = this.beneficiosSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  loadBeneficios(): Observable<Beneficio[]> {
    return this.http.get<Beneficio[]>(this.apiUrl).pipe(
      map((beneficios) => beneficios.map((item) => this.normalizeBeneficio(item))),
      tap((beneficios) => this.beneficiosSubject.next(beneficios)),
      catchError((error: HttpErrorResponse) => this.handleHttpError(error))
    );
  }

  refreshBeneficios(): Observable<Beneficio[]> {
    return this.loadBeneficios();
  }

  getBeneficioById(id: number): Observable<Beneficio> {
    return this.http.get<Beneficio>(`${this.apiUrl}/${id}`).pipe(
      map((beneficio) => this.normalizeBeneficio(beneficio)),
      catchError((error: HttpErrorResponse) => this.handleHttpError(error))
    );
  }

  updateBeneficio(id: number, payload: Pick<Beneficio, 'nome' | 'descricao'>): Observable<Beneficio> {
    return this.http.put<Beneficio>(`${this.apiUrl}/${id}`, payload).pipe(
      map((updated) => this.normalizeBeneficio(updated)),
      tap((updated) => {
        const current = this.beneficiosSubject.value;
        const next = current.map((item) => (item.id === updated.id ? updated : item));
        this.beneficiosSubject.next(next);
      }),
      catchError((error: HttpErrorResponse) => this.handleHttpError(error))
    );
  }

  deleteBeneficio(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const current = this.beneficiosSubject.value;
        const next = current.filter((item) => item.id !== id);
        this.beneficiosSubject.next(next);
      }),
      catchError((error: HttpErrorResponse) => this.handleHttpError(error))
    );
  }

  transferir(payload: TransferRequest): Observable<string> {
    return this.http.post(`${this.apiUrl}/transfer`, payload, { responseType: 'text' }).pipe(
      switchMap((responseMessage) =>
        this.refreshBeneficios().pipe(
          map(() => responseMessage),
          catchError(() => of(responseMessage))
        )
      ),
      catchError((error: HttpErrorResponse) => this.handleHttpError(error))
    );
  }

  private handleHttpError(error: HttpErrorResponse): Observable<never> {
    const backendMessage = this.extractBackendMessage(error.error);
    if (backendMessage) {
      return throwError(() => new Error(backendMessage));
    }

    if (error.status === 0) {
      return throwError(() => new Error(`Nao foi possivel conectar ao backend em ${environment.apiBaseUrl}.`));
    }

    return throwError(() => new Error('Ocorreu um erro inesperado ao processar a solicitacao.'));
  }

  private isCustomError(payload: unknown): payload is CustomError {
    if (typeof payload !== 'object' || payload === null) {
      return false;
    }

    const candidate = payload as Record<string, unknown>;
    return typeof candidate['error'] === 'string' && typeof candidate['status'] === 'number';
  }

  private extractBackendMessage(payload: unknown): string | null {
    if (this.isCustomError(payload)) {
      return payload.error;
    }

    if (typeof payload === 'string' && payload.trim().length > 0) {
      try {
        const parsed = JSON.parse(payload) as unknown;
        if (this.isCustomError(parsed)) {
          return parsed.error;
        }
      } catch {      }

      return payload;
    }

    return null;
  }

  private normalizeBeneficio(payload: Beneficio): Beneficio {
    const normalizedValor = this.parseMoneyValue(payload.valor);

    return {
      ...payload,
      valor: Number.isFinite(normalizedValor) ? normalizedValor : 0
    };
  }

  private parseMoneyValue(value: unknown): number {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      const normalized = trimmed.includes(',') ? trimmed.replace(/\./g, '').replace(',', '.') : trimmed;
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : Number(value);
    }

    if (typeof value === 'object' && value !== null) {
      const candidate = value as Record<string, unknown>;
      if (typeof candidate['value'] === 'number') {
        return candidate['value'];
      }
    }

    return Number.NaN;
  }
}
