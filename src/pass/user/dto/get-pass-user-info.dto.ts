import { GetPassDto } from '../../dto/get-pass.dto';

export class GetPassUserInfoDto extends GetPassDto {
  userAddress: string;
}
