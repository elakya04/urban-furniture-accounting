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

    const options = {
      key: keyId,
      amount: String(amount),
      currency: currency || 'INR',
      name: 'Urban Furniture',
      description: `Payment for Invoice ${invoiceNumber || ''}`,
      order_id: orderId,
      prefill: {
        name: user?.name || customerName || '',
        email: user?.email || '',
        contact: user?.mobile || user?.phone || ''
      },
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

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (response) {
      reject(new Error(response?.error?.description || 'Payment failed'));
    });
    rzp.open();
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
