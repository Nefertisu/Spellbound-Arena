import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'sumRange', async: false })
export class SumRangeConstraint implements ValidatorConstraintInterface {
  validate(value: Record<string, number>, args: ValidationArguments): boolean {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const [min, max] = args.constraints as [
      number | undefined,
      number | undefined,
    ];

    const sum = Object.values(value).reduce((acc, current) => {
      if (typeof current !== 'number') {
        return acc;
      }

      return acc + current;
    }, 0);

    if (min !== undefined && sum < min) {
      return false;
    }

    if (max !== undefined && sum > max) {
      return false;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    const [min, max] = args.constraints as [
      number | undefined,
      number | undefined,
    ];

    if (min !== undefined && max !== undefined) {
      return `Sum of values must be between ${min} and ${max}`;
    }

    if (min !== undefined) {
      return `Sum of values must be at least ${min}`;
    }

    return `Sum of values must not exceed ${max}`;
  }
}
