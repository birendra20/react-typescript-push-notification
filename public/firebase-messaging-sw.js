/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */
// required to setup background notification handler when browser is not in focus or in background and
// In order to receive the onMessage event,  app must define the Firebase messaging service worker
// self.importScripts("localforage.js");

importScripts(
  "https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.15.0/firebase-messaging-compat.js"
);

// Set Firebase configuration, once available
self.addEventListener("fetch", () => {
  try {
    const urlParams = new URLSearchParams(location.search);
    self.firebaseConfig = Object.fromEntries(urlParams);
  } catch (err) {
    console.error("Failed to add event listener", err);
  }
});
// "Default" Firebase configuration (prevents errors)
const defaultConfig = {
  apiKey: true,
  projectId: true,
  messagingSenderId: true,
  appId: true,
};

// Initialize Firebase app
firebase.initializeApp(self.firebaseConfig || defaultConfig);
let messaging;
try {
  messaging = firebase.messaging();
} catch (err) {
  console.error("Failed to initialize Firebase Messaging", err);
}

// To display background notifications
if (messaging) {
  try {
    messaging.onBackgroundMessage(async (payload) => {
      console.log("Received background message: ", payload);

      const messageData = JSON.parse(payload.data.message);

      if (self.clients && self.clients.length > 0) {
        self.clients[0].postMessage(messageData);
      }
      console.log("messageData", messageData);
      const uid = messageData.sender;
      const guid = messageData?.data?.entities?.receiver?.entity?.guid;
      const callType = messageData.type;
      const receiverType = messageData.receiverType;
      const sessionid = messageData?.data?.entities?.on?.entity?.sessionid;
      const myIcon =
        messageData?.data?.entities?.sender?.entity?.avatar ||
        messageData?.data?.entities?.by?.entity?.avatar;

      const notificationTitle = payload.notification.title;
      const notificationOptions = {
        body: payload.notification.body,
        data: JSON.stringify(messageData),
        icon: myIcon,
        actions: [
          {
            action: "reply",
            type: "text",
            title: "Reply",
            icon: myIcon,
          },
        ],
      };
      self.registration.showNotification(
        notificationTitle,
        notificationOptions
      );

      self.addEventListener("notificationclick", (event) => {
        event.notification.close(); // Close the notification

        // Define the relative URL path for your chat page
        let chatUrl = "/chats";

        if (
          messageData.category === "call" ||
          callType === "audio" ||
          callType === "video" ||
          sessionid
        ) {
          // Add query parameters to the chat URL if necessary
          chatUrl += `?uid=${uid}&callType=${callType}&receiverType=${receiverType}&sessionid=${sessionid}`;
        } else if (guid) {
          // Add query parameters to the chat URL if 'guid' is available
          chatUrl += `?guid=${guid}`;
        } else {
          // Add query parameters to the chat URL if 'uid' is available
          chatUrl += `?uid=${uid}`;
        }

        event.waitUntil(clients.openWindow(chatUrl));
      });
    });
  } catch (err) {
    console.log(err);
  }
}
