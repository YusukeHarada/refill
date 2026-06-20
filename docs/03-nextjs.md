# Next.js 入門

## Next.js とは

Next.js は React の**フレームワーク**です。React だけでは「どうやってページを切り替えるか」「どうやってサーバーで処理するか」を自分で決める必要がありますが、Next.js がその仕組みを提供します。

```
React    = UI の部品を作るライブラリ
Next.js  = React アプリ全体の骨格（ルーティング・SSR・ビルドなど）
```

---

## App Router — ファイル構造がそのままURLになる

Next.js 13 以降の「App Router」では、`src/app/` フォルダ内のファイル構造がそのままURLになります。

```
src/app/
├── page.tsx              → https://example.com/          （トップページ）
├── layout.tsx            → 全ページ共通のラッパー
├── (app)/                → グループ（URLには現れない）
│   ├── layout.tsx        → (app) グループ内の共通ラッパー
│   ├── home/
│   │   └── page.tsx      → https://example.com/home
│   ├── statistics/
│   │   └── page.tsx      → https://example.com/statistics
│   └── settings/
│       └── page.tsx      → https://example.com/settings
└── (auth)/
    └── login/
        └── page.tsx      → https://example.com/login
```

**重要なファイル名：**

| ファイル名 | 役割 |
|---|---|
| `page.tsx` | そのURLのページ本体 |
| `layout.tsx` | 子ページを囲むラッパー（ナビバーなど） |

---

## グループ `(app)` と `(auth)` — URLに影響しない分類

`(括弧)` で囲んだフォルダはURLに含まれません。ページを**論理的に分類**するためだけに使います。

```
src/app/(app)/home/page.tsx  → URL は /home（(app) は含まれない）
src/app/(auth)/login/page.tsx → URL は /login
```

このプロジェクトでは：
- `(app)` グループ → ログイン必須のページ（独自の layout でガード）
- `(auth)` グループ → 未ログインでもアクセスできるページ

---

## layout.tsx — 共通ラッパー

`layout.tsx` は子ページを `children` として受け取り、共通UIで包みます。

**ルートレイアウト** (`src/app/layout.tsx`):

```tsx
export const metadata: Metadata = {
  title: 'Refill - スマート在庫管理',
  description: '日用品の消費サイクルを可視化...',
  manifest: '/manifest.json',  // PWA 設定
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={notoSansJP.variable}>
      <body>
        <AuthProvider>{children}</AuthProvider>  {/* 全ページで認証コンテキストを使えるようにする */}
      </body>
    </html>
  );
}
```

**アプリレイアウト（認証ガード + ナビバー）** (`src/app/(app)/layout.tsx`):

```tsx
'use client';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // 未ログインならログインページへリダイレクト
  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  if (loading || !user) return null;  // 確認中は何も表示しない

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto">
      <main className="flex-1 overflow-hidden">{children}</main>

      {/* 下部ナビゲーションバー */}
      <nav className="flex-shrink-0 bg-white dark:bg-zinc-900 border-t">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href}>
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
```

レイアウトは**入れ子**になります：

```
RootLayout（html/body/AuthProvider）
  └── AppLayout（ナビバー・認証ガード）
       └── HomePage（ページ本体）
```

---

## 'use client' vs Server Component

Next.js には 2 種類のコンポーネントがあります：

| | Server Component（デフォルト） | Client Component |
|---|---|---|
| 宣言 | 不要 | ファイル先頭に `'use client'` |
| 実行場所 | サーバー（ビルド時 or リクエスト時） | ブラウザ |
| `useState` | 使えない | 使える |
| `useEffect` | 使えない | 使える |
| イベント (`onClick`) | 使えない | 使える |
| Firebase SDK | 使えない（ブラウザ専用API） | 使える |
| 用途 | 静的コンテンツ・メタデータ | インタラクティブUI |

**このプロジェクトでの実例**:

```tsx
// src/app/layout.tsx — Server Component（'use client' なし）
// metadata を export できる（これはサーバーサイドの機能）
export const metadata: Metadata = {
  title: 'Refill - スマート在庫管理',
};
export default function RootLayout({ children }) { ... }
```

```tsx
// src/app/(app)/home/page.tsx — Client Component
'use client';  // ← これを宣言

export default function HomePage() {
  const [sortOrder, setSortOrder] = useState<SortOrder>('deadline');  // useState 使用
  const { profile } = useAuth();  // カスタムフック使用
  ...
}
```

```tsx
// src/app/(app)/layout.tsx — Client Component
'use client';

export default function AppLayout({ children }) {
  const { user, loading } = useAuth();  // フックを使うので Client
  const router = useRouter();
  ...
}
```

**ルール：** `useState`, `useEffect`, `onClick` などを使うなら `'use client'`。そうでなければ Server Component のままでよい。

---

## `metadata` — ページのタイトル・OGP設定

Server Component のみで使えます。

```tsx
// src/app/layout.tsx
export const metadata: Metadata = {
  title: 'Refill - スマート在庫管理',
  description: '日用品の消費サイクルを可視化し、買い足しタイミングを予測するアプリ',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,        // iOS でホーム画面追加（PWA）を有効化
    statusBarStyle: 'default',
    title: 'Refill',
  },
};

export const viewport: Viewport = {
  themeColor: '#4f46e5',   // ブラウザのテーマカラー
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,         // ピンチズーム無効（モバイルアプリ的な動作）
};
```

---

## `Link` コンポーネント — ページ遷移

`<a href="...">` の代わりに Next.js の `<Link>` を使います。ページ全体をリロードせず、必要な部分だけ更新します（SPA的な遷移）。

```tsx
import Link from 'next/link';

// src/app/(app)/layout.tsx
<Link href="/home">ホーム</Link>
<Link href="/statistics">統計</Link>
```

---

## `useRouter` / `usePathname` — プログラムからの遷移・現在URL取得

```tsx
import { useRouter, usePathname } from 'next/navigation';

const router = useRouter();
const pathname = usePathname();  // 現在のURL（例: '/home'）

// ログインページにリダイレクト
router.replace('/login');  // 履歴に残らず置き換え
router.push('/home');      // 履歴に追加
```

**このプロジェクトでの実例** (`src/app/(app)/layout.tsx`):

```tsx
// 未ログインならリダイレクト
useEffect(() => {
  if (!loading && !user) router.replace('/login');
}, [user, loading, router]);

// アクティブなナビアイテムのスタイル分岐
const active = pathname === href;
<Link className={active ? 'text-indigo-600' : 'text-zinc-400'}>
```

---

## フォルダ構造まとめ

```
src/
├── app/                   # Next.js ページ（App Router）
│   ├── layout.tsx         # ルートレイアウト（全ページ共通）
│   ├── page.tsx           # / トップページ
│   ├── globals.css        # グローバルCSS（Tailwind import）
│   ├── (app)/             # 認証必須ページグループ
│   │   ├── layout.tsx     # ナビバー + 認証ガード
│   │   ├── home/page.tsx
│   │   ├── statistics/page.tsx
│   │   └── settings/page.tsx
│   └── (auth)/
│       └── login/page.tsx
├── components/            # 再利用可能なUIコンポーネント
│   ├── ui/                # ボタン・カードなど汎用パーツ
│   ├── home/              # ホームページ専用コンポーネント
│   └── forms/             # フォームコンポーネント
├── hooks/                 # カスタムフック
├── contexts/              # React Context（グローバル状態）
├── lib/                   # ユーティリティ・Firebase操作
└── types/                 # TypeScript 型定義
```

---

## まとめ

```
page.tsx    = URLに対応するページ本体
layout.tsx  = ページを包む共通ラッパー（ネストする）
(グループ)  = URLに影響しない分類フォルダ
'use client' = ブラウザで動くコンポーネントの宣言
Link        = ページ遷移（<a>の代わり）
useRouter   = プログラムからの遷移
```

次章 → [04-firebase.md](./04-firebase.md)
