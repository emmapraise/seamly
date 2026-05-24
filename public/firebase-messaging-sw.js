importScripts('https://www.gstatic.com/firebasejs/10.11.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.11.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDNyFMGbg-Pu2OO558owCD52ilIW7fefII",
  authDomain: "arcseams.firebaseapp.com",
  projectId: "arcseams",
  storageBucket: "arcseams.firebasestorage.app",
  messagingSenderId: "1058915050687",
  appId: "1:1058915050687:web:071b7671e78472a9e5920a"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'Seamly Notification';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new message.',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
