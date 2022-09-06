import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BattlePassDB } from 'src/battle-pass/battle-pass.entity';
import { Repository } from 'typeorm';
import { InventoryDB } from './inventory.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryDB)
    private inventoryRepository: Repository<InventoryDB>,
    @InjectRepository(BattlePassDB)
    private battlePassRepository: Repository<BattlePassDB>,
  ) {}

  async getAllBattlePass() {
    return await this.battlePassRepository.find();
  }

  async getInventory(query: {
    user_address?: string;
    contract_address?: string;
    id?: number;
  }) {
    return await this.inventoryRepository.findBy(query);
  }

  async updateInventory(
    userAddress: string,
    contractAddress: string,
    id: number,
    amount: number,
  ) {
    const entity = await this.inventoryRepository.findOneByOrFail({
      user_address: userAddress,
      contract_address: contractAddress,
      id,
    });
    const newBalance = entity.balance - amount;
    if (newBalance < 0) throw new Error('Balance Cannot Be Negative');
    else if (newBalance == 0) {
      this.inventoryRepository.delete({
        user_address: userAddress,
        contract_address: contractAddress,
        id,
      });
    } else {
      this.inventoryRepository.save({
        user_address: userAddress,
        contract_address: contractAddress,
        id,
        balance: newBalance,
      });
    }
  }
}
