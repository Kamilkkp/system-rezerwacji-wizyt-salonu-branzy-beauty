import { Prisma } from '@prisma/client';

export type ReservationWithDetails = Prisma.ReservationGetPayload<{
  include: {
    service: {
      include: {
        serviceGroup: {
          include: {
            salon: {
              include: {
                address: true;
                contactInfo: true;
              };
            };
          };
        };
      };
    };
    Promotion: true;
  };
}>;
