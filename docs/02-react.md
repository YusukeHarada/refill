# React 入門

## React とは

React は「UI を関数で書く」ライブラリです。

従来の Web 開発では HTML/CSS/JavaScript を別々に書いていましたが、React では **コンポーネント**（UI の部品）を TypeScript の関数として定義します。

```
従来:
  HTML ファイル → 構造
  CSS ファイル  → 見た目
  JS ファイル   → 動き

React:
  コンポーネント（.tsx）→ 構造 + 動き（+ Tailwind で見た目）
```

---

## JSX — JavaScript の中に HTML を書く

`.tsx` ファイルでは、TypeScript の中に HTML タグを直接書けます。これを **JSX** といいます。

```tsx
// 普通の TypeScript 関数
function greet(name: string): string {
  return "こんにちは " + name;
}

// React コンポーネント（JSX を返す関数）
function Greeting({ name }: { name: string }) {
  return <p>こんにちは {name}</p>;
  //     ↑HTML タグ  ↑JS式（{}で埋め込む）
}
```

JSX のルール：
- `{}` の中に JavaScript の式を書ける
- `class` は `className` と書く（`class` は JS の予約語）
- タグは必ず閉じる（`<br />` のように自己閉じも可）
- コンポーネントは**大文字**で始める（`<Button>` vs `<button>`）

---

## Props — 親から子への引数渡し

Props は関数の引数です。C の構造体ポインタ渡しに近い感覚です。

```tsx
// 親コンポーネントが子に値を渡す
function Parent() {
  return <ChildButton label="保存する" disabled={false} />;
}

// 子コンポーネントが受け取る
interface ChildButtonProps {
  label: string;
  disabled: boolean;
}

function ChildButton({ label, disabled }: ChildButtonProps) {
  return <button disabled={disabled}>{label}</button>;
}
```

**このプロジェクトでの実例** (`src/components/ui/Button.tsx`):

```tsx
// Props の型定義（HTMLの<button>要素の属性も継承）
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button ref={ref} className={cn(/* クラス名 */)} {...props}>
        {children}
      </button>
    );
  },
);
```

- `extends React.ButtonHTMLAttributes<HTMLButtonElement>` → HTML の `<button>` が持つ `onClick`, `type`, `disabled` などをすべて引き継ぐ
- `...props` → 残りの Props をそのまま `<button>` に渡す（C の可変長引数に相当）
- `children` → `<Button>テキスト</Button>` の「テキスト」部分
- `forwardRef` → 親が DOM 要素への参照（ポインタ）を受け取れるようにする

---

## useState — ローカル状態（インスタンス変数に相当）

React コンポーネントの「記憶」です。Java のインスタンス変数に近いですが、値を変えると**自動的に再レンダリング**されます。

```tsx
// [現在の値, 値を変える関数] = useState(初期値)
const [count, setCount] = useState<number>(0);
const [name, setName] = useState<string>('');
const [loading, setLoading] = useState<boolean>(true);
```

C で書くとしたら：

```c
// C のグローバル変数 + UI再描画を手動で呼ぶ感覚
int count = 0;

void increment() {
  count++;
  redraw_ui();  // React では自動でやってくれる
}
```

**このプロジェクトでの実例** (`src/app/(app)/home/page.tsx`):

```tsx
export default function HomePage() {
  const [sortOrder, setSortOrder] = useState<SortOrder>('deadline');
  const [filterCategory, setFilterCategory] = useState<Category | undefined>();
  const [formState, setFormState] = useState<{ open: boolean; item?: StockItem }>({ open: false });
  const [historyItem, setHistoryItem] = useState<StockItem | null>(null);

  // ...

  // ボタンクリック → setFormState でフォームを開く
  <button onClick={() => setFormState({ open: true })}>
    <Plus />
  </button>
```

`setFormState({ open: true })` を呼ぶと React が再レンダリングし、UI が更新されます。

---

## useEffect — 副作用（ライフサイクル）

コンポーネントが**画面に現れたとき**や**値が変わったとき**に処理を実行します。

```tsx
useEffect(() => {
  // 実行したい処理（副作用）

  return () => {
    // クリーンアップ（コンポーネントが画面から消えるとき）
  };
}, [依存する値のリスト]);
```

| 依存リスト | いつ実行されるか |
|---|---|
| `[]` | マウント時（画面に現れたとき）1回だけ |
| `[value]` | マウント時 + `value` が変わるたび |
| なし | 毎レンダリング後 |

**このプロジェクトでの実例** (`src/contexts/AuthContext.tsx`):

```tsx
useEffect(() => {
  // Firebase の認証状態を監視（ログイン/ログアウトを検知）
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    setUser(firebaseUser);
    if (firebaseUser) {
      const p = await getOrCreateUserProfile(/* ... */);
      setProfile(p);
    } else {
      setProfile(null);
    }
    setLoading(false);
  });

  return unsubscribe;  // コンポーネント消滅時にリスナーを解除
}, []);               // [] = マウント時に1回だけ実行
```

`return unsubscribe` のクリーンアップは、C で言えばデストラクタでリソースを解放する処理です。

---

## 条件付きレンダリング

```tsx
// if 文の代わりに三項演算子や &&
{loading ? <Spinner /> : <Content />}

// 条件が true のときだけ表示（&& の短絡評価）
{error && <p className="text-red-500">{error}</p>}

// undefined のとき何も表示しない
{item.memo && <p>{item.memo}</p>}
```

**このプロジェクトでの実例** (`src/app/(app)/home/page.tsx`):

```tsx
// 世帯未設定 → ガイドメッセージを表示
if (!householdId) {
  return (
    <div className="flex flex-col items-center justify-center">
      <p className="text-zinc-500 text-sm">設定から世帯を作成してください</p>
    </div>
  );
}

// ロード中 → スピナー、完了 → リスト
{loading ? (
  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
) : (
  <StockItemList items={items} ... />
)}
```

---

## リストレンダリング — `.map()` で繰り返し

C の `for` ループの代わりに配列の `.map()` を使います。

```tsx
// C: for(int i=0; i<n; i++) { render(items[i]); }
// React:
{items.map((item) => (
  <StockItemCard key={item.id} item={item} />
))}
```

- `key` は**必須**。React がどの要素が変わったかを判断するために使う（DBの主キーに相当）

**このプロジェクトでの実例** (`src/app/(app)/layout.tsx`):

```tsx
const NAV_ITEMS = [
  { href: '/home', icon: Home, label: 'ホーム' },
  { href: '/statistics', icon: BarChart3, label: '統計' },
  { href: '/settings', icon: Settings, label: '設定' },
];

{NAV_ITEMS.map(({ href, icon: Icon, label }) => (
  <Link key={href} href={href}>
    <Icon className="w-5 h-5" />
    <span>{label}</span>
  </Link>
))}
```

---

## イベントハンドラ — ユーザー操作の処理

```tsx
// クリック
<button onClick={() => setFormState({ open: true })}>追加</button>

// フォーム入力（コントロールされた入力）
<input
  value={name}               // React が値を管理
  onChange={(e) => setName(e.target.value)}  // 入力のたびに state 更新
/>

// フォーム送信
<form onSubmit={handleSubmit}>
  ...
</form>

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();  // フォームのデフォルト動作（ページリロード）を止める
  await onSave({ ... });
}
```

「コントロールされた入力」は、`value` で React が値を管理し、`onChange` で更新します。双方向バインディングです。

---

## コンポーネントの親子関係とコールバック

React では**データは親から子へ** Props で流れ、**イベントは子から親へ**コールバックで流れます。

```
HomePage（親）
  ↓ items, onRefill Props を渡す
  StockItemList（子）
    ↓ item, onRefill Props を渡す
    StockItemCard（孫）
      ユーザーが「使用開始」ボタンを押す
      ↑ onRefill(item) を呼ぶ（コールバック）
    ↑ onRefill を呼ぶ
  ↑ handleRefill が実行される
HomePage（親）が Firebase に書き込む
```

**このプロジェクトでの実例**:

```tsx
// 親 (HomePage) が関数を定義して子に渡す
async function handleRefill(item: StockItem) {
  await refillItem(householdId, item, profile.uid);
}

<StockItemList
  items={items}
  onRefill={handleRefill}   // 関数を Props として渡す
  onDelete={handleDelete}
/>

// 孫 (StockItemCard) がコールバックを呼ぶ
<Button onClick={() => onRefill(item)}>使用開始</Button>
```

---

## カスタムフック — ロジックの再利用

`use` で始まる関数。State と Effect をまとめて再利用可能にしたものです。

**このプロジェクトでの実例** (`src/hooks/useItems.ts`):

```tsx
// フックを使う側（コンポーネント）
const { items, loading } = useItems(householdId, sortOrder, filterCategory);

// フック本体
export function useItems(householdId?: string, sortOrder: SortOrder = 'deadline') {
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!householdId) { setItems([]); setLoading(false); return; }
    
    const q = query(collection(db, 'households', householdId, 'items'), ...);
    const unsub = onSnapshot(q, (snap) => {
      const raw = snap.docs.map((d) => ({ id: d.id, ...d.data() } as StockItem));
      setItems(sortItems(raw, sortOrder));
      setLoading(false);
    });

    return unsub;  // クリーンアップ
  }, [householdId, sortOrder]);

  return { items, loading };  // 使う側に渡す
}
```

Java で言えば、サービスクラスをコンポーネントから呼ぶ感覚ですが、State と Effect を一緒に持てる点が異なります。

---

## まとめ

```
コンポーネント = UI の部品（関数）
Props         = 親から子への引数
useState      = コンポーネントの記憶（変えると再描画）
useEffect     = 副作用（マウント時・値変化時に実行）
JSX           = HTML を JS の中に書く記法
カスタムフック = ロジックの再利用単位
```

次章 → [03-nextjs.md](./03-nextjs.md)
