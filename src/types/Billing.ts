export interface SubscriptionPlan {
  planId: number;
  name: string;
  maxLeads: number;
  maxUsers: number;
  priceInPaise: number;
  razorpayPlanId: string | null;
}

export interface SubscriptionStatus {
  planId: number;
  planName: string;
  status: string; // 'active' | 'created' | 'halted' | 'cancelled' | 'completed' | 'pending'
  maxLeads: number;
  maxUsers: number;
  currentPeriodEnd: string | null;
}

export interface CreateSubscriptionResponse {
  razorpaySubscriptionId: string;
  shortUrl: string;
  razorpayKeyId: string;
}

export interface PaymentHistoryEntry {
  razorpayPaymentId: string;
  razorpayInvoiceId: string | null;
  amountInPaise: number;
  currency: string;
  status: string;
  paidAt: string;
}
