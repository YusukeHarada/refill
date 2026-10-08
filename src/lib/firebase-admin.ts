import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

function loadServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is not set');
  }
  const parsed = JSON.parse(raw);
  return {
    ...parsed,
    // 環境変数経由で private_key の改行が "\n" という文字列に化けることがあるため戻す
    private_key: parsed.private_key?.replace(/\\n/g, '\n'),
  };
}

let app: App | undefined;

export function getFirebaseAdminApp(): App {
  if (app) return app;
  const existing = getApps();
  if (existing.length > 0) {
    app = existing[0];
    return app;
  }
  app = initializeApp({ credential: cert(loadServiceAccount()) });
  return app;
}

export function getAdminFirestore(): Firestore {
  return getFirestore(getFirebaseAdminApp());
}
