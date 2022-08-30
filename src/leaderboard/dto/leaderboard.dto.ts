export class GetSeasonXpRankingDto {
  userAddress: string;
  id: string;
  pfp: string;
  name: string;
  total: number;
  others: { total: number; userAddress: string }[];
}
