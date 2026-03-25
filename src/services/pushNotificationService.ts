import api from './api';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const subscribeToPush = async (): Promise<PushSubscription> => {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers are not supported in this browser.');
  }
  if (!('PushManager' in window)) {
    throw new Error('Push notifications are not supported in this browser.');
  }

  // navigator.serviceWorker.ready hangs forever if the SW failed to install.
  // Race it against a timeout so we surface a useful error instead of a frozen spinner.
  const registration = await Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error('Service worker is not ready. Try refreshing the page and clicking Send Test again.')),
        10000
      )
    ),
  ]);

  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;

  const { data } = await api.get<{ data: string }>('/push/vapid-public-key');
  console.log('[Push] Subscribing with VAPID key:', data.data);

  const subscribePromise = registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(data.data),
  });
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Push service timed out. Check your network connection and try again.')), 15000)
  );
  const subscription = await Promise.race([subscribePromise, timeoutPromise]);
  console.log('[Push] Subscription created:', subscription.endpoint);

  await api.post('/push/subscribe', subscription.toJSON());
  return subscription;
};

export const sendTestNotification = async (): Promise<void> => {
  await api.post('/push/test');
};
