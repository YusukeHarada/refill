# Firebase 入門

## Firebase とは

Firebase は Google が提供するバックエンドサービスです。このプロジェクトでは 2 つの機能を使っています：

| サービス | 役割 |
|---|---|
| Firebase Authentication | ユーザーのログイン認証（Google アカウント） |
| Cloud Firestore | NoSQL データベース（データの保存・リアルタイム同期） |

「バックエンドを自分で作らずに済む」のが最大のメリットです。C で言えば、malloc/free を自分で実装しなくて済むようなものです。

---

## Firestore の概念 — NoSQL vs RDB

Firestore は NoSQL データベースです。MySQL など SQL データベースとの違いを理解することが重要です。

| | SQL（RDB） | Firestore（NoSQL） |
|---|---|---|
| 構造単位 | テーブル → 行（Row） | コレクション → ドキュメント |
| 型の強制 | スキーマ（列定義）で固定 | 柔軟（ドキュメントごとに異なるフィールドも可） |
| クエリ | SQL（JOIN も自由） | 制限あり（JOIN 不可、インデックスが必要） |
| リアルタイム | なし | onSnapshot でリアルタイム更新 |

**Firestore の構造：**

```
コレクション（テーブルに相当）
  └── ドキュメント（行に相当）= JSON のようなオブジェクト
        └── サブコレクション（ネストしたテーブル）
              └── ドキュメント
```

**このプロジェクトのデータ構造：**

```
users/
  {userId}/              ← ドキュメントID = Firebase Auth の UID
    uid: "abc123"
    displayName: "山田太郎"
    email: "yamada@example.com"
    householdId: "xyz789"

households/
  {householdId}/
    name: "山田家"
    members: ["uid1", "uid2"]   ← 配列もフィールドに持てる
    inviteCode: "ABC123"
    
    items/               ← サブコレクション
      {itemId}/
        name: "シャンプー"
        category: "日用品"
        cycleDays: 30
        price: 800
        stockQuantity: 2
        lastUsedDate: Timestamp
        
        history/         ← さらにネストしたサブコレクション
          {historyId}/
            executedAt: Timestamp
            recordedBy: "uid1"
```

---

## Firebase の初期化 (`src/lib/firebase.ts`)

```typescript
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // ...
};

function getFirebaseApp() {
  if (!firebaseConfig.apiKey) return null;  // 環境変数がなければスキップ
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
  //                         ↑既に初期化済み？  ↑初めて初期化
}

const app = getFirebaseApp();

export const auth = app ? getAuth(app) : (null as unknown as Auth);
export const db   = app ? getFirestore(app) : (null as unknown as Firestore);
```

- `NEXT_PUBLIC_` プレフィックス → ブラウザ側に公開される環境変数（Next.js の規約）
- `getApps().length ? getApp() : initializeApp(...)` → 二重初期化防止（シングルトンパターン）
- `auth` と `db` を export して他のファイルから使う

---

## 認証（Authentication）

### Google ログイン

```typescript
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

// Google ログイン
async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
  // ポップアップウィンドウが開き、Googleアカウントを選ぶ
  // 成功すると onAuthStateChanged が自動的に発火する
}

// ログアウト
async function signOut() {
  await signOut(auth);
}
```

### 認証状態の監視（Observer パターン）

ログイン・ログアウトを「イベント」として監視します。Java の EventListener に相当します。

```typescript
// 認証状態が変わるたびに呼ばれるコールバックを登録
const unsubscribe = onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('ログイン中:', user.uid, user.email);
  } else {
    console.log('ログアウト');
  }
});

// 監視を解除（コンポーネント消滅時）
unsubscribe();
```

**このプロジェクトでの実例** (`src/contexts/AuthContext.tsx`):

```tsx
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Firestore からユーザープロフィールを取得（なければ作成）
        const p = await getOrCreateUserProfile(
          firebaseUser.uid,
          firebaseUser.displayName ?? '',
          firebaseUser.email ?? '',
        );
        setProfile(p);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;  // コンポーネント消滅時に監視解除
  }, []);

  // ...
}

// どのコンポーネントからも useAuth() で認証情報を取得できる
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

---

## Firestore CRUD 操作

### ドキュメントの参照（パスを指定）

```typescript
import { doc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// 特定ドキュメントへの参照
const userRef = doc(db, 'users', userId);
// → users/{userId} を指す

// サブコレクションのドキュメント
const itemRef = doc(db, 'households', householdId, 'items', itemId);
// → households/{householdId}/items/{itemId} を指す

// コレクション全体への参照
const itemsRef = collection(db, 'households', householdId, 'items');
```

### ドキュメントの読み取り（1回）

```typescript
import { getDoc } from 'firebase/firestore';

const snap = await getDoc(userRef);
if (snap.exists()) {
  const data = snap.data() as UserProfile;  // データを取得
  console.log(data.displayName);
}
```

**このプロジェクトでの実例** (`src/lib/firestore.ts`):

```typescript
export async function getOrCreateUserProfile(uid, displayName, email) {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data() as UserProfile;  // 既存なら返す

  const profile: UserProfile = { uid, displayName, email };
  await setDoc(ref, profile);  // 新規作成
  return profile;
}
```

### ドキュメントの書き込み

```typescript
import { setDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';

// setDoc: IDを指定して作成・上書き
await setDoc(doc(db, 'users', uid), { displayName: '山田太郎', email: '...' });

// addDoc: IDを自動生成して追加（INSERT に相当）
const ref = await addDoc(collection(db, 'households', householdId, 'items'), {
  name: 'シャンプー',
  cycleDays: 30,
});
console.log(ref.id);  // 自動生成されたID

// updateDoc: 一部フィールドのみ更新（UPDATE に相当）
await updateDoc(itemRef, { stockQuantity: 2, updatedAt: Timestamp.now() });

// deleteDoc: 削除（DELETE に相当）
await deleteDoc(itemRef);
```

**このプロジェクトでの実例** (`src/lib/firestore.ts`):

```typescript
export async function createHousehold(uid: string, name: string): Promise<Household> {
  const household: Omit<Household, 'id'> = {
    name,
    members: [uid],
    inviteCode: generateInviteCode(),
  };
  const ref = await addDoc(collection(db, 'households'), household);
  // ref.id に自動生成IDが入る

  await setDoc(doc(db, 'users', uid), { householdId: ref.id }, { merge: true });
  // merge: true → 既存フィールドを消さずに householdId だけ追加・更新

  return { id: ref.id, ...household };
}
```

### クエリ（条件検索）

```typescript
import { query, where, orderBy, getDocs } from 'firebase/firestore';

// 招待コードで世帯を検索
const q = query(
  collection(db, 'households'),
  where('inviteCode', '==', inviteCode.toUpperCase())
);
const snap = await getDocs(q);
if (snap.empty) throw new Error('招待コードが見つかりません');

const household = { id: snap.docs[0].id, ...snap.docs[0].data() };
```

**注意：** Firestore はクエリが制限されています。
- `AND` 条件は複数の `where()` を連鎖させる
- `OR` は制限あり
- `JOIN` は**できない**（別途 `get()` で取得する必要がある）

---

## リアルタイムリスナー — `onSnapshot`

Firestore の最大の特徴は、データが変わると**自動的に通知**される点です。WebSocket のようなものです。

```typescript
import { onSnapshot } from 'firebase/firestore';

const unsub = onSnapshot(q, (snap) => {
  // データが変わるたびにここが呼ばれる
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  setItems(items);
});

// 監視をやめる
unsub();
```

**このプロジェクトでの実例** (`src/hooks/useItems.ts`):

```typescript
export function useItems(householdId?: string, sortOrder: SortOrder = 'deadline') {
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!householdId) { setItems([]); setLoading(false); return; }

    const q = query(
      collection(db, 'households', householdId, 'items'),
      orderBy('registrationOrder', 'asc'),
    );

    // onSnapshot でリアルタイム監視
    const unsub = onSnapshot(q, (snap) => {
      const raw = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        type: d.data().type ?? 'item',  // 古いドキュメントの互換性対応
      } as StockItem));
      setItems(sortItems(raw, sortOrder));
      setLoading(false);
    });

    return unsub;  // コンポーネント消滅時に監視解除（必須）
  }, [householdId, sortOrder]);

  return { items, loading };
}
```

これにより、家族の誰かがアイテムを追加・更新すると、他の家族の画面にも**自動的に反映**されます。

---

## トランザクション — 複数ドキュメントのアトミック操作

複数のドキュメントを同時に更新するときは、**必ずトランザクションを使います**。DBのトランザクション（BEGIN/COMMIT/ROLLBACK）と同じ概念です。

```typescript
import { runTransaction } from 'firebase/firestore';

await runTransaction(db, async (tx) => {
  // 1. まず読み取り（tx.get を使う）
  const snap = await tx.get(itemRef);
  if (!snap.exists()) throw new Error('アイテムが見つかりません');
  const current = snap.data() as StockItem;

  // 2. 書き込み（tx.update / tx.set）
  tx.update(itemRef, {
    lastUsedDate: now,
    stockQuantity: Math.max(0, current.stockQuantity - 1),
  });
  tx.set(newHistoryRef, { executedAt: now, recordedBy: uid });
  // ↑ 両方が成功するか、どちらも実行されないかのどちらか
});
```

**なぜトランザクションが必要か：**

```
NG（競合が起きる可能性）:
  ユーザーAが在庫数を読む → 在庫数: 2
  ユーザーBが在庫数を読む → 在庫数: 2
  ユーザーAが 2-1=1 に更新
  ユーザーBが 2-1=1 に更新  ← 実際は 0 になるべきだった！

OK（トランザクション使用）:
  ユーザーAのトランザクションが先にロック
  ユーザーBのトランザクションは待機 → 再実行される
```

**このプロジェクトでの実例** (`src/lib/firestore.ts`):

```typescript
export async function joinHousehold(uid: string, inviteCode: string) {
  // ...招待コードで世帯を検索...

  await runTransaction(db, async (tx) => {
    const householdSnap = await tx.get(docRef);  // 読み取り
    if (!householdSnap.exists()) throw new Error('世帯が見つかりません');
    const household = { id: householdSnap.id, ...householdSnap.data() } as Household;

    const newMembers = [...household.members, uid];
    tx.update(docRef, { members: newMembers });               // 世帯のメンバーを更新
    tx.set(userRef, { householdId: household.id }, { merge: true }); // ユーザープロフィールを更新
    // ↑ 両方が成功するか、どちらも実行されないか
  });
}
```

---

## Firestore セキュリティルール

Firebase ではデータベースへのアクセスをサーバーサイドのルールで制御します。
APIサーバーを書かなくても、ルールで「誰が何を読み書きできるか」を定義できます。

**このプロジェクトのルール** (`firestore.rules`):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // 自分のプロフィールだけ読み書きできる
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /households/{householdId} {
      // 認証済みユーザーは世帯を読める（招待コード検索のため）
      allow read: if request.auth != null;

      // 作成: 自分がメンバーリストに含まれている場合のみ
      allow create: if request.auth != null
        && request.auth.uid in request.resource.data.members;

      // 更新: 既存メンバー、または招待で参加する場合
      allow update: if request.auth != null && (
        request.auth.uid in resource.data.members || ...
      );

      // サブコレクション: 世帯メンバーだけが読み書きできる
      match /items/{itemId} {
        allow read, write: if request.auth != null
          && request.auth.uid in
             get(/databases/$(database)/documents/households/$(householdId)).data.members;
        //   ↑ 世帯ドキュメントを参照して、メンバーリストを確認する
      }

      // 履歴も同様
      match /items/{itemId}/history/{historyId} {
        allow read, write: if request.auth != null
          && request.auth.uid in
             get(/databases/$(database)/documents/households/$(householdId)).data.members;
      }
    }
  }
}
```

**重要：サブコレクションにはルールが引き継がれない**

```javascript
// NG: items のルールは history に適用されない
match /items/{itemId} { allow read, write: if ...; }

// OK: history にも明示的にルールを書く
match /items/{itemId} { allow read, write: if ...; }
match /items/{itemId}/history/{historyId} { allow read, write: if ...; }
```

---

## `Timestamp` — Firebase の日付型

Firestore は独自の `Timestamp` 型を使います。JavaScript の `Date` とは別物です。

```typescript
import { Timestamp } from 'firebase/firestore';

// 現在時刻の Timestamp
const now = Timestamp.now();

// Timestamp → JavaScript の Date に変換
const date: Date = timestamp.toDate();

// JavaScript の Date → Timestamp に変換
const ts = Timestamp.fromDate(new Date());
```

**このプロジェクトでの実例** (`src/lib/utils.ts`):

```typescript
export function getElapsedDays(lastUsedDate: Timestamp): number {
  return Math.max(0, getDaysDiff(lastUsedDate.toDate(), new Date()));
  //                              ↑ Timestamp → Date に変換してから計算
}
```

---

## まとめ

```
Firebase Authentication = ログイン管理（Google アカウント対応）
Firestore               = NoSQL DB（コレクション > ドキュメント > サブコレクション）
onAuthStateChanged      = ログイン状態の監視（Observer パターン）
getDoc / setDoc         = 1回の読み書き
onSnapshot              = リアルタイム監視（自動更新）
runTransaction          = 複数ドキュメントのアトミック操作
セキュリティルール       = APIサーバーなしでアクセス制御
```

次章 → [05-tailwind.md](./05-tailwind.md)
