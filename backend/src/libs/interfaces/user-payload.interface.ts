import { UUID } from 'crypto';

export interface UserPayload {
  id: UUID;
  email: string;
}
