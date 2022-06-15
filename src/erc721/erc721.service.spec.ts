import { Test, TestingModule } from '@nestjs/testing';
import { Erc721Service } from './erc721.service';

describe('Erc721Service', () => {
  let service: Erc721Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Erc721Service],
    }).compile();

    service = module.get<Erc721Service>(Erc721Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
