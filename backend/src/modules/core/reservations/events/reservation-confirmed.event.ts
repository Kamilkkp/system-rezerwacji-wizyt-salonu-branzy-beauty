import { UUID } from 'crypto';

export class ReservationConfirmedEvent {
  constructor(public readonly reservationId: UUID) {}
}
