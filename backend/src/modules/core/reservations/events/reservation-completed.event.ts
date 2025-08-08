import { UUID } from 'crypto';

export class ReservationCompletedEvent {
  constructor(public readonly reservationId: UUID) {}
}
