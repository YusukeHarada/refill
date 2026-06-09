@AGENTS.md

# Refill プロジェクト ガイドライン

## プロジェクト概要

日用品・タスクの消費サイクルを管理するPWA。Firebase で家族間リアルタイム共有。

**主要技術:** Next.js 16 / React 19 / TypeScript / Tailwind CSS v4 / Firebase (Auth + Firestore) / Vitest

---

## 開発ワークフロー

機能開発は必ず以下の順序で行うこと。詳細は `/feature` を参照。

1. `main` から feature ブランチを作成
2. 実装
3. `npm test` でテストをパスさせる
4. コミット & プッシュ
5. PR を発行してユーザーのレビューを待つ

**PR は絶対に自分でマージしない。ユーザーがレビュー・マージする。**

---

## Firestore ルール（重要）

サブコレクションには親のルールが**引き継がれない**。個別に `match` ブロックが必要。

```javascript
// NG: items のルールは history に適用されない
match /items/{itemId} { allow read, write: if ...; }

// OK: 明示的に書く
match /items/{itemId} { allow read, write: if ...; }
match /items/{itemId}/history/{historyId} { allow read, write: if ...; }
```

ルール変更後は Firebase Console または `firebase deploy --only firestore:rules` でデプロイが必要。

---

## Firestore 実装パターン

**複数ドキュメントの同時書き込みは必ずトランザクションを使う**

```typescript
await runTransaction(db, async (tx) => {
  const snap = await tx.get(itemDocRef);
  tx.update(itemDocRef, { ... });
  tx.set(newHistoryRef, { ... });  // auto-ID: doc(collection(...))
});
```

---

## コードスタイル

- コメントは原則書かない。WHY が非自明な時だけ一行
- 不要な抽象化・将来のための設計はしない
- エラーハンドリングは境界（ユーザー入力・外部API）のみ
- UIテキストは日本語

---

## テスト

```bash
npm test           # ユニットテスト（必ずコミット前に実行）
npm run test:watch # ウォッチモード
```

テスト対象: `src/lib/utils.ts`（コスト計算・日付計算）。UIの変更はテストで検証できないため、実際に `npm run dev` で動作確認する。

---

## Git / コミット

- コミットメッセージは「何をしたか」より「なぜしたか」
- PR タイトルは 70 文字以内
- 回答・コミットメッセージは日本語でよい
