import axios from "axios";

const url = "https://api.chapa.co/v1/transaction/initialize";

interface Customer {
  full_name: string;
  email: string;
  phone: string;
}

interface Order {
  customer: Customer;
}

interface Payment {
  amount_paid: number;
  order: Order;
  transaction_id: string;
}

interface PaymentResponse {
  status: string;
  message: string;
  data?: any;
}

export async function initializePayment(
  user: any,
  amount: number,
  transaction_id: string,
  APIKEY: string
): Promise<PaymentResponse> {
  const nameParts = user?.full_name?.split(" ");
  const firstName = nameParts && nameParts?.length > 0 ? nameParts[0] : "";
  const lastName = nameParts && nameParts.length > 1 ? nameParts[1] : "";

  const payload = {
    amount: amount.toFixed(2).toString(),
    currency: "ETB",
    email: user.email,
    first_name: firstName,
    last_name: lastName,
    phone_number: user.phone,
    tx_ref: transaction_id,
    callback_url: `https://alpha.feed-intel.com/api/v1/payment-check/${transaction_id}/verify/`,
    customization: {
      title: "Your Payment",
    },
  };

  try {
    const response = await axios.post<PaymentResponse>(url, payload, {
      headers: {
        Authorization: `Bearer ${APIKEY}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error: any) {
    return {
      status: "error",
      message: error.response?.data?.message || "An error occurred",
    };
  }
}
