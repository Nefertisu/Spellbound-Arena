import { registerDecorator, ValidationOptions } from 'class-validator';
import { SumRangeConstraint } from './sum-range.validator';

export function SumRange(
  options: {
    min?: number;
    max?: number;
  },
  validationOptions?: ValidationOptions,
) {
  return (object: object, propertyName: string): void => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [options.min, options.max],
      validator: SumRangeConstraint,
    });
  };
}
