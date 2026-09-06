const API_BASE_URL = '/api';

/**
 * Creates a Razorpay order on the backend
 */
export async function createRazorpayOrder(paymentData) {
  const token = localStorage.getItem('uf_token');
  const response = await fetch(`${API_BASE_URL}/payment/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(paymentData)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Order creation failed');
  }

  return await response.json();
}

/**
 * Opens the Razorpay Standard Checkout popup modal
 */
export function openRazorpayCheckout({ keyId, orderId, amount, currency, invoiceNumber, customerName, user }) {
  return new Promise((resolve, reject) => {
    if (typeof window.Razorpay === 'undefined') {
      return reject(new Error('Razorpay SDK failed to load. Please check your internet connection.'));
    }

    if (!orderId) {
      return reject(new Error('Razorpay Order ID is required to open checkout.'));
    }

    // Build sanitized prefill object: only include valid, non-empty fields
    const prefill = {};
    const cleanName = (user?.name || customerName || '').trim();
    if (cleanName) {
      prefill.name = cleanName;
    }

    const rawEmail = (user?.email || '').trim();
    if (rawEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
      prefill.email = rawEmail;
    }

    const rawContact = String(user?.mobile || user?.phone || '').replace(/\D/g, '');
    if (rawContact.length === 10) {
      prefill.contact = rawContact;
    } else if (rawContact.length === 12 && rawContact.startsWith('91')) {
      prefill.contact = rawContact.slice(2);
    }

    const options = {
      key: keyId,
      order_id: orderId,
      name: 'Urban Furniture',
      description: invoiceNumber ? `Payment for Invoice ${invoiceNumber}` : 'Urban Furniture Payment',
      theme: { color: '#d97706' }, // Urban Furniture amber theme
      handler: function (response) {
        resolve(response);
      },
      modal: {
        ondismiss: function () {
          reject(new Error('Payment cancelled by user'));
        }
      }
    };

    if (Object.keys(prefill).length > 0) {
      options.prefill = prefill;
    }

    try {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        console.warn('[RAZORPAY PAYMENT FAILED EVENT]:', response?.error);
        reject(new Error(response?.error?.description || 'Payment failed'));
      });
      rzp.open();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Verifies the payment signature on the backend and settles the invoice
 */
export async function verifyRazorpayPayment(paymentData) {
  const token = localStorage.getItem('uf_token');
  const response = await fetch(`${API_BASE_URL}/payment/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(paymentData)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Payment verification failed');
  }
  return await response.json();
}
