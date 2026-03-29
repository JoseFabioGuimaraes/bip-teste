import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Beneficio } from '../models/beneficio.model';
import { TransferRequest } from '../models/transfer-request.model';
import { BeneficioService } from './beneficio.service';

describe('BeneficioService', () => {
  let service: BeneficioService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    service = TestBed.inject(BeneficioService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deve normalizar valor e atualizar estado da lista', () => {
    let latestState: Beneficio[] = [];
    service.beneficios$.subscribe((state) => {
      latestState = state;
    });

    let responsePayload: Beneficio[] = [];
    service.loadBeneficios().subscribe((response) => {
      responsePayload = response;
    });

    const request = httpMock.expectOne('http://localhost:8081/api/v1/beneficios');
    expect(request.request.method).toBe('GET');

    request.flush([
      {
        id: 1,
        nome: 'Beneficio A',
        descricao: 'Conta principal',
        valor: '1.500,00',
        ativo: true,
        version: 0
      },
      {
        id: 2,
        nome: 'Beneficio B',
        descricao: 'Conta secundaria',
        valor: '500.00',
        ativo: true,
        version: 0
      }
    ] as unknown as Beneficio[]);

    expect(responsePayload.length).toBe(2);
    expect(responsePayload[0].valor).toBe(1500);
    expect(responsePayload[1].valor).toBe(500);
    expect(latestState[0].valor).toBe(1500);
    expect(latestState[1].valor).toBe(500);
  });

  it('deve retornar mensagem de negocio quando backend enviar erro JSON em string', () => {
    const payload: TransferRequest = {
      fromId: 1,
      toId: 2,
      amount: 9999
    };

    let receivedMessage = '';
    service.transferir(payload).subscribe({
      next: () => fail('Era esperado erro 400 de negocio'),
      error: (error: Error) => {
        receivedMessage = error.message;
      }
    });

    const request = httpMock.expectOne('http://localhost:8081/api/v1/beneficios/transfer');
    expect(request.request.method).toBe('POST');

    request.flush('{"status":400,"error":"insufficient balance for transfer"}', {
      status: 400,
      statusText: 'Bad Request'
    });

    expect(receivedMessage).toBe('insufficient balance for transfer');
  });
});
