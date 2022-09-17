import { Scalar, CustomScalar } from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';
import { BigNumber, constants } from 'ethers';

@Scalar('Date')
export class DateResolver implements CustomScalar<string, Date> {
  description = 'Date custom scalar type';

  parseValue(value: number): Date {
    return new Date(value); // value from the client
  }

  serialize(value: Date): string {
    return value.toString(); // value sent to the client
  }

  parseLiteral(ast: ValueNode): Date {
    if (ast.kind === Kind.INT) {
      return new Date(ast.value);
    }
    return null;
  }
}

// Deprecated
@Scalar('BigInt')
export class BigIntResolver implements CustomScalar<number, BigNumber> {
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
