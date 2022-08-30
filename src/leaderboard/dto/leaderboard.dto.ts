import { Result } from 'ethers/lib/utils';

export class GetSeasonXpRankingDto {
  userAddress: string;
  id: number;
  pfp: string;
  name: string;
  total: number;
  others?: number[];
}
