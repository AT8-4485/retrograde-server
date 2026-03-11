import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { config } from '../utils/config';

let expo: Expo | null = null;

if (config.EXPO_ACCESS_TOKEN) {
  expo = new Expo({ accessToken: config.EXPO_ACCESS_TOKEN });
} else {
  console.warn('⚠️ EXPO_ACCESS_TOKEN is missing. Push notifications will be simulated.');
}

/**
 * Helper to queue and send push notifications via Expo.
 */
export const sendPushNotification = async (
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> => {
  if (!tokens || tokens.length === 0) return;

  const messages: ExpoPushMessage[] = [];
  
  for (const pushToken of tokens) {
    if (!Expo.isExpoPushToken(pushToken)) {
      console.warn(`Push token ${pushToken} is not a valid Expo push token`);
      continue;
    }

    messages.push({
      to: pushToken,
      sound: 'default',
      title,
      body,
      data,
    });
  }

  if (messages.length === 0) return;

  if (!expo) {
    console.log(`[SIMULATED PUSH] Title: "${title}", Body: "${body}", Targets: ${messages.length}`);
    return;
  }

  // The Expo push service accepts batches of notifications so
  // that you don't need to send 1000 requests to send 1000 notifications.
  // We recommend you batch your notifications to reduce the number of requests
  const chunks = expo.chunkPushNotifications(messages);
  
  // Note: we're intentionally not awaiting the entire chunked array sequence
  // to avoid blocking the caller if there's a large blast, but for a simple
  // scale, doing them asynchronously in the background is fine.
  (async () => {
    for (const chunk of chunks) {
      try {
        await expo!.sendPushNotificationsAsync(chunk);
      } catch (error) {
        console.error('Error sending push notification chunk', error);
      }
    }
  })();
};
