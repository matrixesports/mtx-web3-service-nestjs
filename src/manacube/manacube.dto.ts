interface LevelStat {
  key: string;
  value: number;
  progression: number;
}

export class ManacubeLevelResponse {
  uuid: string;
  totalExp: number;
  stats: LevelStat[];
}

export class PlayerLevelInfo {
  uuid: string;
  progression: number;
  stat: string;
}

export class PlayerCubitBalanceIncrement {
  uuid: string;
  value: number;
}

export class PlayerDetail {
  uuid: string;
  name: string;
}
