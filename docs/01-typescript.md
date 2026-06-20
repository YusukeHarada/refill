# TypeScript 入門

## TypeScript とは

TypeScript は JavaScript に「型」を追加した言語です。
ブラウザや Node.js は JavaScript しか実行できないため、コンパイル時に JavaScript へ変換されます。

C/Java との対比：

| 概念 | C | Java | TypeScript |
|---|---|---|---|
| 整数型 | `int x = 1;` | `int x = 1;` | `const x: number = 1;` |
| 文字列型 | `char* s` | `String s` | `const s: string = "hello"` |
| 構造体/クラス | `struct Item` | `class Item` | `interface Item` |
| 列挙型 | `enum Color` | `enum Color` | `type Color = 'red' \| 'blue'` |
| コンパイル | `gcc` | `javac` | `tsc`（→ JS を生成） |

---

## 変数と型注釈

```typescript
// C: int x = 42;
const x: number = 42;

// C: char* name = "シャンプー";
const name: string = "シャンプー";

// C: _Bool flag = 1;
const loading: boolean = true;

// 型推論（型注釈を省略しても型が決まる）
const days = 30;  // TypeScript が number と推論する
```

TypeScript は多くの場合、右辺から型を**推論**するので注釈を省略できます。

---

## ユニオン型（C の enum に近い）

C の `enum` は整数値ですが、TypeScript のユニオン型は文字列や他の型の「いずれか」を表します。

```typescript
// C: enum ItemType { ITEM, TASK };
// TypeScript:
type ItemType = 'item' | 'task';

// C: enum StatusColor { GREEN, YELLOW, RED };
type StatusColor = 'green' | 'yellow' | 'red';

// 使うと型安全に絞り込まれる
function getLabel(type: ItemType): string {
  if (type === 'item') return 'モノ（消耗品）';
  return 'コト（作業）';  // 'task' しかありえない
}
```

**このプロジェクトでの実例** (`src/types/index.ts`):

```typescript
export type ItemType = 'item' | 'task';

export type Category =
  | '日用品'
  | '食品'
  | 'ハウスワーク'
  | '定期メンテナンス'
  | 'その他';

export type SortOrder = 'deadline' | 'category' | 'registrationOrder';

export type StatusColor = 'green' | 'yellow' | 'red';
```

---

## interface（Java の interface に近いが「データの形」を定義する）

Java の interface はメソッドの契約を定義しますが、TypeScript の `interface` はオブジェクトの**データ構造**の契約を定義します（C の `struct` に近い感覚）。

```typescript
// C の struct に近い感覚:
// struct StockItem { char* name; int cycleDays; double price; };
interface StockItem {
  id: string;
  name: string;
  cycleDays: number;
  price: number;
}
```

**このプロジェクトでの実例** (`src/types/index.ts`):

```typescript
export interface StockItem {
  id: string;           // Firestore ドキュメントID
  householdId: string;  // 所属する世帯ID
  name: string;         // アイテム名（例: "シャンプー"）
  category: Category;   // カテゴリ（ユニオン型を使用）
  type: ItemType;       // 'item' か 'task'
  price: number;        // 価格
  cycleDays: number;    // 消費サイクル（日数）
  stockQuantity: number;// 在庫数
  lastUsedDate: Timestamp; // 最終使用日（Firebase の型）
  purchaseLocation?: string; // 購入場所（省略可能）
  memo?: string;             // メモ（省略可能）
  registrationOrder: number; // 登録順（ソート用）
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;    // 作成したユーザーID
}
```

### `?` はオプショナル（省略可能）

```typescript
// purchaseLocation?: string
// → このフィールドは存在しないこともある

const item: StockItem = {
  id: "abc123",
  name: "シャンプー",
  // purchaseLocation は書かなくてもよい
  ...
};
```

C の構造体との違いは、フィールドを「持たない」ことが型として表現できる点です。

---

## Record 型（C の連想配列 / Java の Map に近い）

```typescript
// Java: Map<String, String[]> map = new HashMap<>();
// TypeScript:
type Record<K, V> = { [key in K]: V };

// このプロジェクトでの実例 (src/types/index.ts):
export const CATEGORIES_BY_TYPE: Record<ItemType, Category[]> = {
  item: ['日用品', '食品', 'その他'],
  task: ['ハウスワーク', '定期メンテナンス', 'その他'],
};

// 使い方: CATEGORIES_BY_TYPE['item'] → ['日用品', '食品', 'その他']
```

---

## `as const`（値を変更不可にする）

```typescript
// 配列の中身を変更できない定数として宣言
export const CYCLE_TEMPLATES = [
  { label: '1週間', days: 7 },
  { label: '1ヶ月', days: 30 },
  { label: '1年', days: 365 },
] as const;
```

---

## `??` ヌル合体演算子（C にはない概念）

JavaScript/TypeScript では変数が `null` または `undefined`（「値なし」）になりえます。

```typescript
// もし null/undefined なら右側の値を使う
const name = firebaseUser.displayName ?? '';
// C で書くとしたら: name = (firebaseUser.displayName != NULL) ? firebaseUser.displayName : "";

const type = data.type ?? 'item';  // type フィールドがなければ 'item'
```

---

## 型の `as` キャスト

```typescript
// C: (StockItem*)ptr
// TypeScript:
const item = snap.data() as StockItem;
```

Firebase から取得したデータは型が不明なので、`as` で「この型として扱う」と明示します。

---

## 関数の型注釈

```typescript
// 引数と戻り値に型をつける
// C: int getDaysDiff(time_t from, time_t to)
function getDaysDiff(from: Date, to: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((to.getTime() - from.getTime()) / msPerDay);
}

// Promise（非同期処理の型）
// C: void* を返すスレッドに相当するが、より安全
async function addItem(householdId: string, uid: string): Promise<string> {
  // ...非同期処理...
  return ref.id;
}
```

---

## Omit（interface の一部フィールドを除く）

```typescript
// StockItem から 'id' フィールドを除いた型
type HouseholdWithoutId = Omit<Household, 'id'>;
// → id を持たない Household（DB に保存する前の状態）

// 実例 (src/lib/firestore.ts):
const household: Omit<Household, 'id'> = {
  name,
  members: [uid],
  inviteCode: generateInviteCode(),
};
```

---

## まとめ

TypeScript で「難しい」と感じやすいポイント：

1. **`null` と `undefined` が別物** — C の NULL ポインタに相当するが 2 種類ある
2. **型は実行時には消える** — コンパイル後は JavaScript になるので、型チェックは開発時のみ
3. **`any` 型は逃げ道だが使わない** — `any` にすると型チェックが無効になる（このプロジェクトは `strict: true`）

次章 → [02-react.md](./02-react.md)
