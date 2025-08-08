import { UUID } from 'crypto';

export class ReservationCancelledEvent {
  constructor(public readonly reservationId: UUID) {}
}
