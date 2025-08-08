import { UUID } from 'crypto';

export class SalonFrontendUrlUpdatedEvent {
  constructor(public readonly salonId: UUID) {}
}
