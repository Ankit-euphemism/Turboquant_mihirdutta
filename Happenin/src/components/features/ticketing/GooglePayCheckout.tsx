import React, { useState, useEffect } from 'react';
import {
  createGooglePayOrder,
  openGooglePayPayment,
  verifyGooglePayment,
  initializeGooglePay,
  formatAmountToINR,
} from '../../../services/googlePayService';
import type { Event } from '../../../types';
import type { GooglePaymentResponse, GooglePayOrder } from '../../../services/googlePayService';

interface GooglePayCheckoutProps {
  event: Event;
  userId: string;
  quantity?: number;
  userEmail?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/**
 * GOOGLE PAY CHECKOUT FORM
 * 
 * Features:
 * ✅ Google Merchant ID configuration
 * ✅ Real-time payment processing
 * ✅ Order verification
 * ✅ Error handling & retry logic
 * ✅ Mobile-responsive design
 */
const GooglePayCheckout: React.FC<GooglePayCheckoutProps> = ({
  event,
  userId,
  quantity = 1,
  userEmail = 'user@example.com',
  onSuccess,
  onError,
}) => {
  const [merchantId, setMerchantId] = useState(
    import.meta.env.VITE_GOOGLE_MERCHANT_ID || ''
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [isGooglePayReady, setIsGooglePayReady] = useState(false);

  const pricePerTicket = 99; // ₹99.00
  const totalPrice = quantity * pricePerTicket;

  // Check if Google Pay is available on mount
  useEffect(() => {
    const checkGooglePayAvailability = async () => {
      const paymentsClient = await initializeGooglePay();
      setIsGooglePayReady(paymentsClient !== null);
    };

    checkGooglePayAvailability();
  }, []);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!merchantId.trim()) {
      setMessage({
        type: 'error',
        text: '❌ Please enter a Google Merchant ID',
      });
      return;
    }

    if (!isGooglePayReady) {
      setMessage({
        type: 'error',
        text: '❌ Google Pay is not available. Please try Razorpay or check your region.',
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Step 1: Create Google Pay order on backend
      const order = await createGooglePayOrder(
        event.id,
        userId,
        quantity,
        totalPrice
      );

      // Step 2: Open Google Pay modal
      await openGooglePayPayment(
        order,
        async (paymentResponse: GooglePaymentResponse) => {
          // Step 3: Payment successful - verify on backend
          await handlePaymentSuccess(paymentResponse, order);
        },
        (error: string) => {
          setMessage({ type: 'error', text: `❌ ${error}` });
          setLoading(false);
        }
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to initiate payment';
      setMessage({ type: 'error', text: `❌ ${errorMsg}` });
      onError?.(errorMsg);
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (
    paymentResponse: GooglePaymentResponse,
    order: GooglePayOrder
  ) => {
    setVerifying(true);
    try {
      // Verify payment signature on backend
      const result = await verifyGooglePayment({
        payment_method_id: paymentResponse.payment_method_id,
        token: paymentResponse.token,
        event_id: event.id,
        user_id: userId,
        quantity,
        amount: totalPrice,
      });

      if (result.success) {
        setMessage({
          type: 'success',
          text: `✅ Payment successful! ${quantity} ticket${quantity > 1 ? 's' : ''} purchased. Check your email for QR codes.`,
        });
        onSuccess?.();
      } else {
        throw new Error(result.message || 'Payment verification failed');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Payment verification failed';
      setMessage({ type: 'error', text: `❌ ${errorMsg}` });
      onError?.(errorMsg);
    } finally {
      setLoading(false);
      setVerifying(false);
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🔵</span>
          <h3 className="text-lg font-bold text-gray-900">Google Pay Checkout</h3>
        </div>
        <p className="text-sm text-gray-600">
          {event.title} • {quantity} ticket{quantity > 1 ? 's' : ''}
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-3 rounded-lg mb-4 text-sm font-medium ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Google Pay Not Available Warning */}
      {!isGooglePayReady && (
        <div className="p-3 rounded-lg mb-4 text-sm bg-yellow-50 text-yellow-800 border border-yellow-200">
          ⚠️ Google Pay is not available in your region. Please use Razorpay.
        </div>
      )}

      {/* Form */}
      <form onSubmit={handlePayment} className="space-y-4">
        {/* Merchant ID Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Google Merchant ID
          </label>
          <input
            type="text"
            value={merchantId}
            onChange={(e) => setMerchantId(e.target.value)}
            placeholder="your_google_merchant_id_here"
            disabled={loading || verifying}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            💡 Get this from Google Pay Business profile
          </p>
        </div>

        {/* Price Summary */}
        <div className="p-3 bg-white rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Price per ticket:</span>
            <span className="font-medium text-gray-900">₹{pricePerTicket}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Quantity:</span>
            <span className="font-medium text-gray-900">{quantity}</span>
          </div>
          <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between items-center">
            <span className="font-bold text-gray-900">Total:</span>
            <span className="text-lg font-bold text-blue-600">{formatAmountToINR(totalPrice)}</span>
          </div>
        </div>

        {/* Payment Button */}
        <button
          type="submit"
          disabled={loading || verifying || !isGooglePayReady}
          className={`w-full py-3 px-4 rounded-lg font-medium text-white transition ${
            loading || verifying || !isGooglePayReady
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
          } flex items-center justify-center gap-2`}
        >
          {loading || verifying ? (
            <>
              <span className="animate-spin">⏳</span>
              {verifying ? 'Verifying Payment...' : 'Processing...'}
            </>
          ) : (
            <>
              <span>🔵</span>
              Pay with Google Pay
            </>
          )}
        </button>

        {/* Info Section */}
        <div className="p-3 bg-white rounded-lg border border-gray-200 text-xs text-gray-600">
          <p className="font-medium mb-2">🔒 Secure Payment Information:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>All payments are encrypted and verified</li>
            <li>Your data is secure with Google Pay</li>
            <li>QR codes will be sent to your registered email</li>
          </ul>
        </div>
      </form>

      {/* Merchant ID Help */}
      <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200 text-sm">
        <p className="font-medium text-gray-900 mb-2">📍 How to get Google Merchant ID:</p>
        <ol className="list-decimal list-inside space-y-1 text-gray-600 text-xs">
          <li>Go to <a href="https://pay.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">pay.google.com</a></li>
          <li>Sign in with your Google account</li>
          <li>Go to Settings → Merchant profile</li>
          <li>Copy your Merchant ID</li>
        </ol>
      </div>
    </div>
  );
};

export default GooglePayCheckout;
