import { UUID } from 'crypto';

export class ReservationTimeChangedEvent {
  constructor(
    public readonly reservationId: UUID,
    public readonly newStartTime: Date,
  ) {}
}
