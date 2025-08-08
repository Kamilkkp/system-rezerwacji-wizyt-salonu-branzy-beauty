import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { isAfter } from 'date-fns';

type PropertySelector<T> = (object: T) => unknown;

@ValidatorConstraint({ async: false })
export class IsTimeAfterConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments) {
    const [propertySelector] = args.constraints as [PropertySelector<unknown>];

    if (typeof propertySelector !== 'function') {
      return false;
    }

    const relatedValue = propertySelector(args.object);

    return (
      (typeof value === 'string' &&
        typeof relatedValue === 'string' &&
        value > relatedValue) ||
      (value instanceof Date &&
        relatedValue instanceof Date &&
        isAfter(value, relatedValue))
    );
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be after the compared value.`;
  }
}

export function IsTimeAfter<T>(
  propertySelector: PropertySelector<T>,
  validationOptions?: ValidationOptions,
) {
  // eslint-disable-next-line @typescript-eslint/no-wrapper-object-types
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [propertySelector],
      validator: IsTimeAfterConstraint,
    });
  };
}
