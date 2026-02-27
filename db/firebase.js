import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import serviceAccount from '@/db/firebase-adminsdk.json';

initializeApp({
  credential: cert(serviceAccount)
});

export const db = getFirestore("asoandesdb")