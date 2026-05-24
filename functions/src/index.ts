import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const onOrderStatusChanged = functions.region('europe-west1').firestore
  .document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    const newValue = change.after.data();
    const previousValue = change.before.data();

    // Check if status changed
    if (newValue.status === previousValue.status) {
      return null;
    }

    const businessId = newValue.businessId;
    
    // Find the owner of this business
    const businessDoc = await admin.firestore().collection('businesses').doc(businessId).get();
    if (!businessDoc.exists) return null;
    
    const ownerId = businessDoc.data()?.ownerId;
    if (!ownerId) return null;

    // Get the owner's push token
    const userDoc = await admin.firestore().collection('users').doc(ownerId).get();
    const pushToken = userDoc.data()?.pushToken;

    if (!pushToken) {
      console.log(`No push token found for user ${ownerId}`);
      return null;
    }

    // Send push notification
    const payload = {
      notification: {
        title: 'Order Status Updated',
        body: `Order ${newValue.title || newValue.garmentType} is now ${newValue.status}!`,
      }
    };

    try {
      await admin.messaging().send({
        token: pushToken,
        ...payload
      });
      console.log('Push notification sent successfully');
    } catch (error) {
      console.error('Error sending push notification:', error);
    }

    return null;
  });
