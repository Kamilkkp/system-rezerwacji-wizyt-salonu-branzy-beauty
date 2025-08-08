import { UUID } from 'crypto';

export class SalonWithFrontendUrlDeletedEvent {
  constructor(public readonly salonId: UUID) {}
}
