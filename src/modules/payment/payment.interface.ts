// TypeScript interfaces for the Payment module

/**
 * POST /api/payments/create
 * Tenant sends only the rentalRequestId; everything else is derived on the server.
 */
export interface ICreatePaymentPayload {
  rentalRequestId: string;
}
