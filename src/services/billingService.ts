import api from './api';
import type {
  SubscriptionPlan,
  SubscriptionStatus,
  CreateSubscriptionResponse,
  PaymentHistoryEntry,
} from '../types/Billing';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const getPlans = async (): Promise<SubscriptionPlan[]> => {
  const res = await api.get<ApiResponse<SubscriptionPlan[]>>('/payment/plans');
  return res.data.data;
};

export const getSubscription = async (): Promise<SubscriptionStatus> => {
  const res = await api.get<ApiResponse<SubscriptionStatus>>('/payment/subscription');
  return res.data.data;
};

export const createSubscription = async (planId: number): Promise<CreateSubscriptionResponse> => {
  const res = await api.post<ApiResponse<CreateSubscriptionResponse>>('/payment/subscribe', { planId });
  return res.data.data;
};

export const cancelSubscription = async (): Promise<void> => {
  await api.post('/payment/cancel');
};

export const getPaymentHistory = async (): Promise<PaymentHistoryEntry[]> => {
  const res = await api.get<ApiResponse<PaymentHistoryEntry[]>>('/payment/history');
  return res.data.data;
};
