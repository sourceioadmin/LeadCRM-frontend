import api from './api';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export const subscribeToPush = async (): Promise<PushSubscription> => {
  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;

  const { data } = await api.get<{ data: string }>('/push/vapid-public-key');
  console.log('[Push] Subscribing with VAPID key:', data.data);
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(data.data),
  });
  console.log('[Push] Subscription created:', subscription.endpoint);

  await api.post('/push/subscribe', subscription.toJSON());
  return subscription;
};

export const sendTestNotification = async (): Promise<void> => {
  await api.post('/push/test');
};
