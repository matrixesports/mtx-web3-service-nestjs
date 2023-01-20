import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PlayerCubits } from 'src/graphql.schema';
import { ManacubeLevelResponse, PlayerDetail } from './manacube.dto';

@Injectable()
export class ManacubeService {
  private baseUrl: string;
  constructor(private config: ConfigService) {
    this.baseUrl = config.get<string>('microservice.manacube.baseUrl');
  }

  /**
   * Retrieves a players available cubit balance
   * @param playerId the minecraft player UUID
   * @returns the cubit balance
   */
  async getPlayerCubitBalance(playerId: string) {
    try {
      const { data, status } = await axios.get(`${this.baseUrl}/api/cubits/${playerId}`);
      if (status == HttpStatus.OK) {
        return { uuid: playerId, balance: data } as PlayerCubits;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.log('=> An Error occured getting cubit balances for player', playerId);
      console.log('=> Error: ', error.message);
    }
  }

  /**
   * Increment a player's cubits balance by a given value
   * @param value the numver of cubits to add to the players balance
   * @param playerId the player uuid
   */
  async incrementPlayerCubits(playerId: string, value: number) {
    try {
      console.log('=> Api Key ', `${this.config.get('microservice.manacube.apiKey')}`);
      const { data, status } = await axios.get<number>(
        `${this.baseUrl}/api/cubits/${playerId}/increment`,
        {
          params: {
            value,
          },
          headers: {
            Authorization: this.config.get('microservice.manacube.apiKey'),
          },
        },
      );

      return { balance: data };
    } catch (error) {
      console.log('=> An Error occured incrementing cubit balance for player', playerId);
      console.log('=> Error Description', error.message);
    }
  }

  /**
   * Retreives a specific player's level information
   * @param playerId the unique player uuid
   * @returns player level stats
   */
  async getPlayerLevel(playerId: string) {
    try {
      const { data, status } = await axios.get<ManacubeLevelResponse>(
        `${this.baseUrl}/api/manalevel/${playerId}`,
      );
      return data;
    } catch (error) {
      console.log('=> An Error occured getting level info for player', playerId);
      console.log('=> Error: ', error.message);
    }
  }

  /**
   * Increments a players level info for a particular stat
   * @param playerId unique player uuid
   * @param stat stat Example `manaapi:matrix`
   * @param progression
   * @returns the updated player level progression
   */
  async incrementPlayerLevel(playerId: string, stat: string, progression: number) {
    try {
      const { data } = await axios.get<number>(
        `${this.baseUrl}/api/manalevel/${playerId}/increment-stat`,
        {
          params: {
            stat,
            progression,
          },
          headers: {
            Authorization: this.config.get('microservice.manacube.apiKey'),
          },
        },
      );

      return { level: data };
    } catch (error) {
      console.log('=> An Error occured incrementing player level for player', playerId);
      console.log('=> Error Description', error.message);
    }
  }

  /**
   * Retrieves the names and uuids of all patron players
   */
  async getPatronMembers() {
    try {
      const { data } = await axios.get<PlayerDetail[]>(`${this.baseUrl}/api/patrons/patrons`);
      return data;
    } catch (error) {
      console.log('=> An Error occured getting patron players');
      console.log('=> Error: ', error.message);
    }
  }
}
