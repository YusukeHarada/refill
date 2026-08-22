import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  runTransaction,
  getDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { StockItem, StockItemInput, Household, UserProfile } from '@/types';

function historyRef(householdId: string, itemId: string) {
  return collection(db, 'households', householdId, 'items', itemId, 'history');
}
import { generateInviteCode } from './utils';

// ─── User ──────────────────────────────────────────────────────────────────

export async function getOrCreateUserProfile(
  uid: string,
  displayName: string,
  email: string,
): Promise<UserProfile> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data() as UserProfile;

  const profile: UserProfile = { uid, displayName, email };
  await setDoc(ref, profile);
  return profile;
}

export async function updateUserHousehold(uid: string, householdId: string): Promise<void> {
  await setDoc(doc(db, 'users', uid), { householdId }, { merge: true });
}

// ─── Household ─────────────────────────────────────────────────────────────

export async function createHousehold(uid: string, name: string): Promise<Household> {
  const household: Omit<Household, 'id'> = {
    name,
    members: [uid],
    inviteCode: generateInviteCode(),
  };
  const ref = await addDoc(collection(db, 'households'), household);
  const created = { id: ref.id, ...household };
  await updateUserHousehold(uid, ref.id);
  return created;
}

export async function joinHousehold(uid: string, inviteCode: string): Promise<Household> {
  const q = query(collection(db, 'households'), where('inviteCode', '==', inviteCode.toUpperCase()));
  const snap = await getDocs(q);
  if (snap.empty) throw new Error('招待コードが見つかりません');

  const docRef = snap.docs[0].ref;
  const userRef = doc(db, 'users', uid);
  let result: Household | undefined;

  await runTransaction(db, async (tx) => {
    const householdSnap = await tx.get(docRef);
    if (!householdSnap.exists()) throw new Error('世帯が見つかりません');
    const household = { id: householdSnap.id, ...householdSnap.data() } as Household;

    if (household.members.includes(uid)) {
      tx.set(userRef, { householdId: household.id }, { merge: true });
      result = household;
    } else {
      const newMembers = [...household.members, uid];
      tx.update(docRef, { members: newMembers });
      tx.set(userRef, { householdId: household.id }, { merge: true });
      result = { ...household, members: newMembers };
    }
  });

  return result!;
}

export async function getHousehold(householdId: string): Promise<Household | null> {
  const snap = await getDoc(doc(db, 'households', householdId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Household;
}

export async function regenerateInviteCode(householdId: string): Promise<string> {
  const newCode = generateInviteCode();
  await updateDoc(doc(db, 'households', householdId), { inviteCode: newCode });
  return newCode;
}

// ─── Items ─────────────────────────────────────────────────────────────────

// Firestore does not accept `undefined` — strip those keys before writing
function omitUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

function itemsRef(householdId: string) {
  return collection(db, 'households', householdId, 'items');
}

export async function getNextRegistrationOrder(householdId: string): Promise<number> {
  const q = query(itemsRef(householdId), orderBy('registrationOrder', 'desc'));
  const snap = await getDocs(q);
  if (snap.empty) return 0;
  return (snap.docs[0].data().registrationOrder ?? -1) + 1;
}

export async function addItem(
  householdId: string,
  uid: string,
  input: StockItemInput,
): Promise<string> {
  const registrationOrder = await getNextRegistrationOrder(householdId);
  const now = Timestamp.now();
  const data = omitUndefined({
    ...input,
    householdId,
    lastUsedDate: now,
    registrationOrder,
    createdAt: now,
    updatedAt: now,
    createdBy: uid,
  });
  const ref = await addDoc(itemsRef(householdId), data);
  return ref.id;
}

export async function updateItem(
  householdId: string,
  itemId: string,
  input: Partial<StockItemInput>,
): Promise<void> {
  await updateDoc(doc(db, 'households', householdId, 'items', itemId),
    omitUndefined({ ...input, updatedAt: Timestamp.now() }),
  );
}

export async function deleteItem(householdId: string, itemId: string): Promise<void> {
  await deleteDoc(doc(db, 'households', householdId, 'items', itemId));
}

export async function refillItem(householdId: string, item: StockItem, uid: string): Promise<void> {
  const itemDocRef = doc(db, 'households', householdId, 'items', item.id);
  const newHistoryRef = doc(historyRef(householdId, item.id));
  const now = Timestamp.now();

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(itemDocRef);
    if (!snap.exists()) return;
    const current = snap.data() as StockItem;
    tx.update(itemDocRef, {
      lastUsedDate: now,
      stockQuantity: Math.max(0, (current.stockQuantity ?? 0) - 1),
      updatedAt: now,
    });
    tx.set(newHistoryRef, { executedAt: now, recordedBy: uid });
  });
}

export async function updateLastUsedDate(
  householdId: string,
  itemId: string,
  date: Date,
  uid: string,
): Promise<void> {
  const itemDocRef = doc(db, 'households', householdId, 'items', itemId);
  const executedAt = Timestamp.fromDate(date);

  // 最新の履歴も書き換えないと、修正した実施日が履歴に残らない
  const latest = await getDocs(
    query(historyRef(householdId, itemId), orderBy('executedAt', 'desc'), limit(1)),
  );
  const latestHistoryRef = latest.empty
    ? doc(historyRef(householdId, itemId))
    : latest.docs[0].ref;

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(itemDocRef);
    if (!snap.exists()) return;
    tx.update(itemDocRef, { lastUsedDate: executedAt, updatedAt: Timestamp.now() });
    if (latest.empty) {
      tx.set(latestHistoryRef, { executedAt, recordedBy: uid });
    } else {
      tx.update(latestHistoryRef, { executedAt });
    }
  });
}

export async function deleteHistoryEntry(
  householdId: string,
  itemId: string,
  entryId: string,
): Promise<void> {
  const itemDocRef = doc(db, 'households', householdId, 'items', itemId);
  const entryRef = doc(historyRef(householdId, itemId), entryId);

  // 最新の履歴を消したら、item の実施日を一つ前の履歴まで巻き戻す
  const recent = await getDocs(
    query(historyRef(householdId, itemId), orderBy('executedAt', 'desc'), limit(2)),
  );
  const isLatest = recent.docs[0]?.id === entryId;
  const previous = isLatest ? recent.docs[1] : undefined;

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(itemDocRef);
    if (!snap.exists()) return;
    tx.delete(entryRef);
    if (previous) {
      tx.update(itemDocRef, {
        lastUsedDate: previous.data().executedAt,
        updatedAt: Timestamp.now(),
      });
    }
  });
}

export async function restockItem(
  householdId: string,
  itemId: string,
  count: number,
): Promise<void> {
  const ref = doc(db, 'households', householdId, 'items', itemId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const current = snap.data() as StockItem;
    tx.update(ref, {
      stockQuantity: (current.stockQuantity ?? 0) + count,
      updatedAt: Timestamp.now(),
    });
  });
}
