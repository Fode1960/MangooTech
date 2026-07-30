import webpush from 'web-push';

const VAPID_KEYS = {
  publicKey: 'BEszMwB7h83nh_ULNDyvIfOtA7qxnAu6G5cf3XFeWntIjEnlPinLCjoQg_1sjlLZKerhUaf7WF5OnER3oCKgwX0',
  privateKey: 'ma_Ap3w41D3Efn9BYdcmg5X3pny-id04gCP0ycgj2Fw'
};
webpush.setVapidDetails('mailto:contact@mangootech.com', VAPID_KEYS.publicKey, VAPID_KEYS.privateKey);

const sub = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/dXD2YJ1ROSI:APA91bHwvouX3ba6ki8bpM2Mm9A4coc5FU-7tSKM-glbEwYcGqHEb8NMYWb8CvxBEkDAjxYIBrgLS6paXtnQj3XBPPaR40OFvUtrqxlHHYv_m2zwotWC_7-nlgY8xA68sX5NB_q534ZE',
  keys: {
    p256dh: 'BKM88dbE9jziHjmOc6GbzU2GoyYzAVnE_umyym2j7-e2nZbymHw218yQibhZ_zngQjJXJWcXZemYS3VCSlHcTqA',
    auth: 'W_9tTYvX8LyFLiLlxwREEA'
  }
};

const payload = {
  title: 'Test',
  body: 'Hello',
  icon: '',
  badge: ''
};

console.log('[TestPush] Envoi push simple...');
try {
  await webpush.sendNotification(sub, JSON.stringify(payload));
  console.log(`[TestPush] SUCCES ! Regardez l'écran.`);
} catch (err) {
  console.error(`[TestPush] ECHEC:`, err.statusCode, err.message);
}
