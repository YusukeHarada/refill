# Refill - スマート在庫管理

日用品・サプリ・コンタクトなど定期消費アイテムの消費サイクルを可視化し、買い足しタイミングを予測するWebアプリ。

## 技術スタック

- **Next.js 14+** (React + TypeScript, App Router)
- **Tailwind CSS** — モダン・フラットデザイン
- **Firebase Firestore** — リアルタイムデータ同期
- **Firebase Authentication** — Google ログイン
- **Vercel** — ホスティング（GitHub連携で自動デプロイ）
- PWA対応（iPhone・Androidにインストール可能）

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Firebase プロジェクトの作成

1. [Firebase Console](https://console.firebase.google.com/) でプロジェクトを作成
2. Authentication → Google ログインを有効化
3. Firestore Database を作成（本番モードで開始）
4. `firestore.rules` の内容をFirestoreセキュリティルールに適用

### 3. 環境変数の設定

`.env.local.example` を `.env.local` にコピーして Firebase の設定値を入力：

```bash
cp .env.local.example .env.local
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 で確認できます。

## Vercelデプロイ

1. GitHubリポジトリをVercelに接続
2. 環境変数（`NEXT_PUBLIC_FIREBASE_*`）をVercelに設定
3. デプロイ完了

## 機能

### MVP（現在実装済み）

- **在庫管理**: アイテムの個数 + 消費サイクルを管理
- **プログレスバー**: 残り期間を色付きで可視化（緑→黄→赤）
- **ワンタップ更新**: 使い切ったら次を開封してサイクルをリセット
- **補充ボタン**: 買い足し時に在庫を +1
- **支出統計**: 日間・月間・年間コスト、カテゴリ別内訳
- **家族共有**: 招待コードで世帯メンバーと在庫を共有
- **Googleログイン**: Firebaseによる認証

### フェーズ2（予定）

- プッシュ通知（期限N日前）
- カレンダー連携
- 消費履歴・支出グラフ
- 予算シミュレーション
