import { UUID } from 'crypto';

export class NewReservationEvent {
  constructor(public readonly reservationId: UUID) {}
}
