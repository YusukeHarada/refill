# Refill — 技術スタック

## 概要

日用品・タスクの消費サイクルを管理するPWAアプリ。家族間でリアルタイム共有できる在庫管理ツール。

---

## フロントエンド

| 技術 | バージョン | 用途 |
|---|---|---|
| **Next.js** | 16.2.7 | App Router、SSR/SSG、PWAホスト |
| **React** | 19.2.4 | UIコンポーネント |
| **TypeScript** | ^5 | 型安全性 |
| **Tailwind CSS** | ^4 | スタイリング（ユーティリティファースト） |
| **next-themes** | ^0.4.6 | ダークモード切り替え |
| **lucide-react** | ^1.17.0 | アイコン |

### UIコンポーネント基盤

| 技術 | 用途 |
|---|---|
| **Radix UI** | アクセシブルなヘッドレスコンポーネント（Dialog, Select, Tabs 等） |
| **class-variance-authority** | バリアント管理（Button の `variant`/`size` 等） |
| **clsx + tailwind-merge** | 条件付きクラス結合 |

### PWA

| 技術 | 用途 |
|---|---|
| **next-pwa** | ^5.6.0 | Service Worker 生成、オフラインキャッシュ |

---

## バックエンド / インフラ

| 技術 | バージョン | 用途 |
|---|---|---|
| **Firebase Authentication** | ^12.14.0 | Googleログイン |
| **Cloud Firestore** | ^12.14.0 | リアルタイムDB、`onSnapshot` 購読 |
| **Vercel** | — | ホスティング（GitHub連携で自動デプロイ） |

---

## テスト

| 技術 | バージョン | 用途 |
|---|---|---|
| **Vitest** | ^4.1.8 | ユニットテスト（`npm test`） |
| **@vitest/coverage-v8** | ^4.1.8 | カバレッジレポート |

テスト対象: `src/lib/utils.ts`（コスト計算・日付計算関数）

---

## Firestoreデータ構造

```
/users/{userId}
  displayName: string
  email: string
  householdId: string

/households/{householdId}
  name: string
  members: string[]       # userId の配列
  inviteCode: string      # 6桁招待コード

/households/{householdId}/items/{itemId}
  name: string
  category: '日用品' | '食品' | 'ハウスワーク' | '定期メンテナンス' | 'その他'
  type: 'item' | 'task'
  price: number
  cycleDays: number
  stockQuantity: number
  lastUsedDate: Timestamp
  purchaseLocation?: string
  memo?: string
  registrationOrder: number
  createdAt: Timestamp
  updatedAt: Timestamp
  createdBy: string

/households/{householdId}/items/{itemId}/history/{historyId}
  executedAt: Timestamp
  recordedBy: string      # userId
```

---

## 主要ファイル構成

```
src/
├── app/
│   ├── (auth)/login/          # Googleログイン画面
│   └── (app)/
│       ├── layout.tsx         # 認証ガード + BottomNav
│       ├── home/page.tsx      # アイテム一覧（メイン画面）
│       ├── statistics/page.tsx
│       └── settings/page.tsx
├── components/
│   ├── home/
│   │   ├── StockItemCard.tsx
│   │   ├── StockItemList.tsx
│   │   ├── ItemHistoryModal.tsx   # 実施履歴モーダル
│   │   ├── DateCorrectionModal.tsx # 日付修正モーダル
│   │   └── ProgressBar.tsx
│   └── forms/
│       ├── ItemForm.tsx
│       └── CyclePicker.tsx
├── hooks/
│   ├── useItems.ts            # onSnapshot でアイテムリスト購読
│   ├── useItemHistory.ts      # onSnapshot で履歴購読
│   ├── useHousehold.ts
│   └── useAuth.ts
├── lib/
│   ├── firebase.ts            # Firebase 初期化
│   ├── firestore.ts           # Firestore CRUD ヘルパー
│   └── utils.ts               # コスト計算・日付計算
├── types/index.ts
└── contexts/AuthContext.tsx
firestore.rules                # Firestoreセキュリティルール
```

---

## セキュリティルール方針

- `/users/{userId}`: 本人のみ読み書き
- `/households/{householdId}`: `members` 配列に含まれるユーザーのみ
- `/items/{itemId}` および `/items/{itemId}/history/{historyId}`: 親 household の `members` チェック（サブコレクションは個別 `match` ブロックが必要）

---

## 開発コマンド

```bash
npm run dev          # 開発サーバー起動 (localhost:3000)
npm test             # ユニットテスト実行
npm run test:watch   # ウォッチモード
npm run test:coverage
npm run build        # 本番ビルド
npm run lint         # ESLint
```

---

## 環境変数

`.env.local` に以下を設定（Firebase Console > プロジェクト設定 > アプリ から取得）:

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```
