# meisai-lab 残タスク・未確定事項まとめ

作成日: 2026-07-05

---

## 1. すぐ着手できるもの（方針決め待ち）

- [ ] **フォントファイルの軽量化**（保留中・後回しでOKとのこと）
  M PLUS Rounded 1c をセルフホスト中（`src/app/fonts/*.ttf`）。4ウェイト合計約13MBあり初回読み込みが重い。
  対応案: ①文字サブセット化 ②WOFF2変換 ③ウェイト数を減らす（例: 400/700のみ）④このまま進める
- [x] ~~Item（カスタム項目）と給与登録フォームの連携~~ → 完了（オプションA: 既存の固定フィールドは維持しつつ、`/items` で登録したアクティブな項目を給与登録フォームに追加表示する形で実装）
- [ ] **Deduction モデルが未使用**
  Prisma スキーマに `Deduction`（生命保険料控除・ふるさと納税など、年単位の控除）が定義されているが、API・UIとも一切実装していない（CODING_CONTEXT.md のAPI一覧にもそもそも含まれていなかった）。年末調整・確定申告用の控除を別管理したいか、`Salary.data` の「その他控除」で十分か、方針を決める必要がある。
- [x] ~~賞与の編集機能がない~~ → 完了（`/bonuses` に編集ダイアログを追加）
- [ ] **ローディング状態・エラーバウンダリ未実装**
  CODING_CONTEXT.md のPhase1チェックリストにある「ローディング状態」「エラーハンドリング」について、`loading.tsx` / `error.tsx` などのUI側の作り込みはまだ（APIの401/400やtoast通知のみ）。

## 2. 新機能の検討（元の計画には無かったもの）

- [ ] **給与明細の読み取り（OCR）機能**
  CODING_CONTEXT.md には記載なし＝Phase 1の対象外。紙・PDFの明細から自動入力したい場合はPhase 2として別途設計が必要（画像アップロード、OCR API選定、読み取り結果の確認・修正UIなど）。
- [ ] **既存スプレッドシートからの一括インポート**
  ユーザーが管理していた明細の表を取り込みたい場合、①CSV/Excelインポート機能を作る、②一度きりのデータ移行スクリプトを書く、のどちらが適切か要相談。表のフォーマット（列構成）を共有いただければ検討可能。

## 3. Git操作（指示待ち）

- [ ] 現在 `develop` ブランチだが、アプリ全体が**未コミット**。`git commit` の実行指示待ち
- [ ] リモートへの push、`main` へのPR作成・マージも同様に指示待ち

## 4. 外部サービスの手動設定（私は実行不可）

- [ ] **1Password**: `apps/meisai-lab` アイテム作成（本番用 `auth-secret` / `google-client-id` / `google-client-secret` / `auth-url` / `target-dir` / `port` / `db-name` / `ci-webhook-url`）
- [ ] **GitHub**: `OP_SERVICE_ACCOUNT_TOKEN` シークレット登録、`develop` をデフォルトブランチ化、`main` の Branch protection 設定
- [ ] **VPS**: `/apps/meisai-lab` ディレクトリ作成、PM2登録、Apache vhost設置、certbot、DNSレコード（`meisai-lab.gucchii.com`）登録
- [ ] **Google Cloud（本番用）**: 開発用とは別にプロジェクト/OAuthクライアントを作成し、リダイレクトURI `https://meisai-lab.gucchii.com/api/auth/callback/google` を登録 → 発行値を1Passwordへ保存
- [ ] **Signaly**: アプリ用通知チャンネル作成、webhook URLを1Passwordの `ci-webhook-url` に登録
- [ ] **m-guchi/docs**: ポート一覧表に `3106` を追記登録

## 5. 未実施の動作確認（任意）

- [ ] 給与・賞与の新規登録／編集／削除、項目のドラッグ並び替え、税率設定の保存など一通りのCRUD実地確認（トップ・ログインは確認済み）
- [ ] モバイル実機での各ページ（`/bonuses` `/items` `/settings` など）の表示崩れチェック
