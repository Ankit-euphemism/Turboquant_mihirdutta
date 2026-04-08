/**
 * GOOGLE PAY SERVICE (FRONTEND)
 * 
 * Handles Google Pay integration for ticket purchases
 * 
 * Flow:
 * 1. Frontend calls createGooglePayOrder() → Gets order ID from backend
 * 2. User clicks Google Pay button
 * 3. Google Pay processes payment
 * 4. Frontend calls verifyGooglePayment() → Backend verifies
 * 5. Backend creates tickets if verification succeeds
 */

import { supabase } from '../lib/supabase';

declare global {
  interface Window {
    google: {
      payments: {
        api: {
          PaymentsClient: new (options: unknown) => PaymentsClient;
        };
      };
    };
  }
}

interface PaymentsClient {
  isReadyToPay(request: IsReadyToPayRequest): Promise<{ result: boolean }>;
  loadPaymentData(request: PaymentDataRequest): Promise<PaymentData>;
}

interface IsReadyToPayRequest {
  apiVersion: number;
  apiVersionMinor: number;
  allowedPaymentMethods: Array<{ type: string }>;
}

interface PaymentDataRequest {
  apiVersion: number;
  apiVersionMinor: number;
  allowedPaymentMethods: Array<unknown>;
  transactionInfo: {
    totalPriceStatus: string;
    totalPrice: string;
    currencyCode: string;
  };
  merchantInfo: {
    merchantId: string;
    merchantName: string;
  };
}

interface PaymentData {
  paymentMethodData: {
    tokenizationData: {
      token: string;
    };
  };
}

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────
export interface GooglePayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
  event_id: string;
  user_id: string;
  quantity: number;
  created_at: string;
}

export interface GooglePaymentResponse {
  token: string;
  payment_method_id: string;
}

export interface GooglePayVerificationRequest {
  payment_method_id: string;
  token: string;
  event_id: string;
  user_id: string;
  quantity: number;
  amount: number;
}

// ──────────────────────────────────────────────
// Load Google Pay Script
// ──────────────────────────────────────────────
export const loadGooglePayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.google?.payments?.api?.PaymentsClient) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://pay.google.com/gp/p/js/pay.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// ──────────────────────────────────────────────
// Create Google Pay Order (Backend)
// ──────────────────────────────────────────────
export const createGooglePayOrder = async (
  eventId: string,
  userId: string,
  quantity: number,
  amount: number // in INR
): Promise<GooglePayOrder> => {
  try {
    const { data, error } = await supabase.functions.invoke('create-googlepay-order', {
      body: {
        event_id: eventId,
        user_id: userId,
        quantity,
        amount,
      },
    });

    if (error) throw error;
    return data as GooglePayOrder;
  } catch (err) {
    console.error('Failed to create Google Pay order:', err);
    throw err;
  }
};

// ──────────────────────────────────────────────
// Initialize Google Pay
// ──────────────────────────────────────────────
export const initializeGooglePay = async (): Promise<PaymentsClient | null> => {
  try {
    const isLoaded = await loadGooglePayScript();
    if (!isLoaded) {
      throw new Error('Failed to load Google Pay script');
    }

    const paymentsClient = new window.google.payments.api.PaymentsClient({
      environment: 'PRODUCTION', // Use 'TEST' for development
    });

    const isReady = await paymentsClient.isReadyToPay({
      apiVersion: 2,
      apiVersionMinor: 0,
      allowedPaymentMethods: [{ type: 'CARD' }],
    });

    if (isReady.result) {
      return paymentsClient;
    } else {
      console.warn('Google Pay is not ready');
      return null;
    }
  } catch (err) {
    console.error('Failed to initialize Google Pay:', err);
    return null;
  }
};

// ──────────────────────────────────────────────
// Get Payment Data Request
// ──────────────────────────────────────────────
export const getPaymentDataRequest = (
  amount: number,
  quantity: number
): PaymentDataRequest => {
  return {
    apiVersion: 2,
    apiVersionMinor: 0,
    allowedPaymentMethods: [
      {
        type: 'CARD',
        parameters: {
          allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
          allowedCardNetworks: ['MASTERCARD', 'VISA'],
        },
        tokenizationSpecification: {
          type: 'PAYMENT_GATEWAY',
          parameters: {
            gateway: 'razorpay',
            gatewayMerchantId: import.meta.env.VITE_RAZORPAY_KEY_ID,
          },
        },
      },
    ],
    transactionInfo: {
      totalPriceStatus: 'FINAL',
      totalPrice: amount.toFixed(2),
      currencyCode: 'INR',
    },
    merchantInfo: {
      merchantId: import.meta.env.VITE_GOOGLE_MERCHANT_ID || 'happenin_merchant',
      merchantName: 'Happenin Events',
    },
  };
};

// ──────────────────────────────────────────────
// Open Google Pay Payment Modal
// ──────────────────────────────────────────────
export const openGooglePayPayment = async (
  order: GooglePayOrder,
  onSuccess: (response: GooglePaymentResponse) => void,
  onError: (error: string) => void
): Promise<void> => {
  try {
    const paymentsClient = await initializeGooglePay();
    if (!paymentsClient) {
      throw new Error('Google Pay is not available in your region');
    }

    const paymentDataRequest = getPaymentDataRequest(order.amount, order.quantity);

    const paymentData = await paymentsClient.loadPaymentData(paymentDataRequest);

    const token = paymentData.paymentMethodData.tokenizationData.token;

    onSuccess({
      token,
      payment_method_id: order.id,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'PAYMENT_CANCELLED') {
      onError('Payment cancelled by user');
    } else {
      onError(error instanceof Error ? error.message : 'Failed to process Google Pay payment');
    }
  }
};

// ──────────────────────────────────────────────
// Verify Google Pay Payment
// ──────────────────────────────────────────────
export const verifyGooglePayment = async (
  request: GooglePayVerificationRequest
): Promise<{ success: boolean; message: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke('verify-googlepay-payment', {
      body: request,
    });

    if (error) throw error;

    return {
      success: data.success,
      message: data.message || 'Payment verified successfully',
    };
  } catch (err) {
    console.error('Payment verification failed:', err);
    throw err;
  }
};

// ──────────────────────────────────────────────
// Utility: Format Amount
// ──────────────────────────────────────────────
export const formatAmountToINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};
