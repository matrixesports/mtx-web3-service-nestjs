import { Scalar, CustomScalar } from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';
import { BigNumber, constants } from 'ethers';

@Scalar('BigInt')
export class BigintResolver implements CustomScalar<number, BigNumber> {
  description = 'BigNumber custom scalar type';

  parseValue(value: number): BigNumber {
    return BigNumber.from(value); // value from the client
  }

  // value sent to the client
  serialize(value: BigNumber): number {
    if (value.eq(constants.MaxUint256)) {
      return Number.MAX_SAFE_INTEGER;
    } else {
      return value.toNumber();
    }
  }

  parseLiteral(ast: ValueNode): BigNumber {
    if (ast.kind === Kind.INT) {
      return BigNumber.from(ast.value);
    }
    return null;
  }
}
