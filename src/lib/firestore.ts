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
  Timestamp,
  runTransaction,
  getDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { StockItem, StockItemInput, Household, UserProfile } from '@/types';
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
  const household = { id: snap.docs[0].id, ...snap.docs[0].data() } as Household;

  if (household.members.includes(uid)) {
    await updateUserHousehold(uid, household.id);
    return household;
  }

  await updateDoc(docRef, { members: [...household.members, uid] });
  await updateUserHousehold(uid, household.id);
  return { ...household, members: [...household.members, uid] };
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
  const data = {
    ...input,
    householdId,
    lastUsedDate: now,
    registrationOrder,
    createdAt: now,
    updatedAt: now,
    createdBy: uid,
  };
  const ref = await addDoc(itemsRef(householdId), data);
  return ref.id;
}

export async function updateItem(
  householdId: string,
  itemId: string,
  input: Partial<StockItemInput>,
): Promise<void> {
  await updateDoc(doc(db, 'households', householdId, 'items', itemId), {
    ...input,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteItem(householdId: string, itemId: string): Promise<void> {
  await deleteDoc(doc(db, 'households', householdId, 'items', itemId));
}

export async function refillItem(householdId: string, item: StockItem): Promise<void> {
  const ref = doc(db, 'households', householdId, 'items', item.id);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const current = snap.data() as StockItem;
    tx.update(ref, {
      lastUsedDate: Timestamp.now(),
      stockQuantity: Math.max(0, current.stockQuantity - 1),
      updatedAt: Timestamp.now(),
    });
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
      stockQuantity: current.stockQuantity + count,
      updatedAt: Timestamp.now(),
    });
  });
}
