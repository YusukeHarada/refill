# Tailwind CSS 入門

## Tailwind CSS とは

Tailwind CSS は「**ユーティリティクラス**」を組み合わせてスタイリングする CSS フレームワークです。

従来の CSS との違い：

```html
<!-- 従来の CSS -->
<!-- styles.css に書く -->
.card {
  background-color: white;
  border-radius: 1rem;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

<!-- HTML で使う -->
<div class="card">...</div>
```

```html
<!-- Tailwind CSS -->
<!-- CSS ファイルは書かず、クラス名で直接スタイルを指定 -->
<div class="bg-white rounded-2xl p-4 shadow-sm">...</div>
```

Tailwind のメリット：
- CSS ファイルと HTML を行き来しなくていい
- 命名に悩まなくていい（`.card` とか `.wrapper` とか）
- 使ったクラスだけが最終的な CSS に含まれる（ファイルサイズ小）

---

## 基本的なクラス命名規則

Tailwind のクラス名は `プロパティ-値` の形式です。

### 余白（Spacing）

```
p-{n}   → padding（内側の余白）
m-{n}   → margin（外側の余白）
px-{n}  → padding-left + padding-right
py-{n}  → padding-top + padding-bottom
pt-{n}  → padding-top のみ
```

| クラス | CSS | ピクセル換算 |
|---|---|---|
| `p-1` | `padding: 0.25rem` | 4px |
| `p-2` | `padding: 0.5rem` | 8px |
| `p-4` | `padding: 1rem` | 16px |
| `p-6` | `padding: 1.5rem` | 24px |

### 色（Colors）

Tailwind は色を `色名-数値` で表します（数値が大きいほど暗い）：

```
bg-white         → 背景: 白
bg-zinc-100      → 背景: ごく薄いグレー
bg-zinc-900      → 背景: ほぼ黒
bg-indigo-600    → 背景: インディゴ（紫系）
text-zinc-500    → 文字色: 中間グレー
text-white       → 文字色: 白
border-zinc-100  → 枠線: 薄いグレー
```

### サイズ

```
w-{n}       → width（幅）
h-{n}       → height（高さ）
w-full      → width: 100%
h-screen    → height: 100vh（画面全体の高さ）
max-w-lg    → max-width: 32rem（最大幅）
```

### テキスト

```
text-xs     → font-size: 0.75rem（極小）
text-sm     → font-size: 0.875rem（小）
text-base   → font-size: 1rem（標準）
text-xl     → font-size: 1.25rem（大）
font-medium → font-weight: 500
font-semibold → font-weight: 600
font-bold   → font-weight: 700
truncate    → overflow: hidden; text-overflow: ellipsis（省略表示）
```

### 角丸（Border Radius）

```
rounded      → border-radius: 0.25rem
rounded-lg   → border-radius: 0.5rem
rounded-xl   → border-radius: 0.75rem
rounded-2xl  → border-radius: 1rem
rounded-full → border-radius: 9999px（完全な丸）
```

### Flexbox・レイアウト

```
flex              → display: flex
flex-col          → flex-direction: column
flex-1            → flex: 1（余った空間を埋める）
items-center      → align-items: center（縦方向中央）
justify-between   → justify-content: space-between
gap-2             → gap: 0.5rem（子要素間の間隔）
grid              → display: grid
grid-cols-2       → grid-template-columns: repeat(2, 1fr)
```

---

## このプロジェクトでの実例

### Button コンポーネント (`src/components/ui/Button.tsx`)

```tsx
<button
  className={cn(
    // 全バリアント共通のスタイル
    'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50',
    //  ↑横並び中央寄せ  ↑要素間に隙間  ↑角丸   ↑太字   ↑transition効果 ↑クリック時縮小 ↑disabled時半透明

    // variant による色の分岐
    {
      'bg-indigo-600 text-white hover:bg-indigo-700': variant === 'primary',
      //  ↑インディゴ背景   ↑白文字   ↑ホバー時暗く
      'bg-zinc-100 text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-800': variant === 'secondary',
      'text-zinc-600 hover:bg-zinc-100': variant === 'ghost',
      'bg-red-500 text-white hover:bg-red-600': variant === 'danger',
    },

    // size による大きさの分岐
    {
      'h-8 px-3 text-sm': size === 'sm',
      'h-10 px-4 text-sm': size === 'md',
      'h-12 px-6 text-base': size === 'lg',
      'h-9 w-9 p-0': size === 'icon',
    },
  )}
>
```

### ホームページのカード (`src/app/(app)/home/page.tsx`)

```tsx
{/* ヘッダー部分 */}
<div className="px-4 pt-safe-top pt-4 pb-2 flex items-center justify-between">
  <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">在庫管理</h1>
  <button className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm hover:bg-indigo-700 active:scale-95 transition-all">
    <Plus className="w-5 h-5 text-white" />
  </button>
</div>
```

### ナビゲーションバー (`src/app/(app)/layout.tsx`)

```tsx
<nav className="flex-shrink-0 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
  <div className="flex">
    <Link
      className={cn(
        'flex-1 flex flex-col items-center gap-0.5 py-3 transition-colors',
        active
          ? 'text-indigo-600'                               // アクティブ: 紫
          : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300',  // 非アクティブ: グレー
      )}
    >
      <Icon className="w-5 h-5" />
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  </div>
</nav>
```

---

## ダークモード

`dark:` プレフィックスをつけると、OS がダークモードのときだけ適用されます。

```tsx
// light: 白背景 / dark: ほぼ黒背景
<div className="bg-white dark:bg-zinc-900">

// light: 黒文字 / dark: 白文字
<p className="text-zinc-900 dark:text-zinc-100">

// light: 薄いグレー枠線 / dark: 暗いグレー枠線
<div className="border border-zinc-100 dark:border-zinc-800">
```

ダークモードは `globals.css` で CSS 変数を切り替えることで制御：

```css
/* src/app/globals.css */
:root {
  --background: #f5f5f7;   /* ライトモード */
  --foreground: #171717;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;  /* ダークモード */
    --foreground: #ededed;
  }
}
```

---

## レスポンシブデザイン

`md:` `lg:` プレフィックスで、画面サイズによってスタイルを変えられます（このプロジェクトではほぼ使っていませんが基本知識として）。

```tsx
<div className="w-full md:w-1/2 lg:w-1/3">
// モバイル: 全幅 / タブレット: 半分 / PC: 1/3
```

---

## 疑似クラス（インタラクション）

```tsx
hover:bg-indigo-700    // マウスオーバー時
active:scale-95        // クリック中（95%に縮小）
disabled:opacity-50    // disabled 属性がついているとき
focus:outline-none     // フォーカス時
```

---

## `cn()` — 動的クラス合成ユーティリティ

React では条件によってクラスを変えることが多いです。`cn()` はクラス名を安全に合成するユーティリティです。

**なぜ必要か：**

```tsx
// NG: 文字列結合は壊れやすい
<div className={'bg-white ' + (isActive ? 'text-indigo-600' : 'text-zinc-400')}>

// NG: 同じプロパティのクラスが競合する
// 'bg-white bg-zinc-900' → どちらが適用されるか不定
```

```tsx
// OK: cn() を使う
import { cn } from '@/lib/utils';

<div className={cn(
  'bg-white rounded-2xl p-4',          // 常に適用
  isActive && 'text-indigo-600',       // true のときだけ追加
  !isActive && 'text-zinc-400',
  className,                           // 外から渡されたクラス
)}>
```

**実装** (`src/lib/utils.ts`):

```typescript
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
  // clsx: 条件付きクラスを処理
  // twMerge: 競合するTailwindクラスを正しくマージ（後の方が優先）
}
```

---

## `transition-all` と `animate-spin`

```tsx
// スムーズなトランジション（CSS transition の省略）
<button className="transition-all active:scale-95">

// アニメーション（スピナー）
<div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
// ↑幅・高さ  ↑枠線2px  ↑インディゴ枠線  ↑上だけ透明（ドーナツ状）↑丸  ↑回転アニメ
```

---

## よく詰まるポイント

### 1. クラスを動的に生成してはいけない

```tsx
// NG: クラス名を文字列結合で動的生成 → ビルド時に消える
const color = 'indigo';
<div className={`bg-${color}-600`}>  // bg-indigo-600 が CSS に含まれない！

// OK: クラス名を完全な文字列で書く
const className = isActive ? 'bg-indigo-600' : 'bg-zinc-100';
<div className={className}>
```

理由：Tailwind はビルド時にソースコードを静的解析してクラス名を収集します。動的生成された文字列は検出されません。

### 2. 単位の感覚を掴む

Tailwind の数値は `0.25rem` 単位です（`p-1` = 4px、`p-4` = 16px）。「4の倍数ルール」と覚えると楽です。

### 3. `flex-1` の動作

```tsx
<div className="flex flex-col h-screen">  // 縦方向に flex、画面全体の高さ
  <header className="h-14">...</header>     // 固定高さ
  <main className="flex-1 overflow-hidden"> // 残りの空間をすべて占有
    ...
  </main>
  <nav className="flex-shrink-0">...</nav>  // 縮小しない
</div>
```

`flex-1` = 「余った空間を全部使う」。`overflow-hidden` とセットで使うことが多いです。

---

## まとめ

```
bg-{color}     → 背景色
text-{color}   → 文字色
p-{n} / m-{n}  → 余白
rounded-{size} → 角丸
flex / grid    → レイアウト
dark:          → ダークモード
hover: / active: → インタラクション
cn()           → 動的クラス合成
```

Tailwind は最初は「クラスが多すぎる」と感じますが、よく使うものは限られています。
コードを読みながら「これは何px？」と都度調べる習慣をつけると自然と覚えられます。
