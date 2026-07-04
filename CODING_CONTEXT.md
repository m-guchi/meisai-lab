# 📋 meisai-lab バイブコーディングコンテキスト

> **このドキュメントを Claude Code の `@context` で参照してください**  
> コピペして Claude Code のプロンプトボックスに貼り付けるか、ファイルとして参照させてください。

---

## 🎯 プロジェクト概要

**プロジェクト名:** meisai-lab（給与・賞与管理アプリケーション）  
**フェーズ:** Phase 1 MVP  
**ターゲット:** 個人ユーザーの給与・賞与管理・可視化  
**認証:** Google OAuth (NextAuth.js v5)  
**デプロイ先:** VPS (Ubuntu 24.04 LTS, メモリ 1GB, ポート 3107)

---

## 🏗️ 技術スタック（VPS標準準拠）

```
Frontend:      Next.js 16.x (App Router) + React 19.x + TypeScript 5.x
UI:            Tailwind CSS v4 + shadcn/ui (Radix UI)
ORM:           Prisma 6-7.x
Database:      MariaDB 10.11
Auth:          NextAuth.js v5 (Auth.js)
Charts:        Recharts
Form:          React Hook Form + Zod
Date:          date-fns
Process:       PM2 (本番ポート: 3107)
```

---

## 📊 Prisma データモデル（確定版）

### User
```prisma
model User {
  id        String    @id @default(cuid())
  email     String    @unique
  name      String?
  image     String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  salaries      Salary[]
  bonuses       Bonus[]
  items         Item[]
  taxSettings   TaxSetting[]
  deductions    Deduction[]
}
```

### Salary（給与明細）
```prisma
model Salary {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  salaryDate    DateTime              // 支給日
  grossSalary   Decimal  @db.Decimal(10, 2)  // 支給額
  netSalary     Decimal  @db.Decimal(10, 2)  // 手取額
  data          Json     // { "baseGrossSalary": 300000, "overtime": 50000, "healthInsurance": -12000, ... }
  memo          String?  @db.Text
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?  // soft delete

  @@unique([userId, salaryDate])
  @@index([userId, salaryDate])
  @@index([userId, deletedAt])
}
```

### Bonus（賞与明細）
```prisma
model Bonus {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  bonusType     String   // "夏季" / "冬季" / "特別"
  bonusDate     DateTime
  amount        Decimal  @db.Decimal(10, 2)
  data          Json
  memo          String?  @db.Text
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?

  @@unique([userId, bonusDate, bonusType])
  @@index([userId, bonusDate])
}
```

### Item（ユーザーカスタム項目）
```prisma
model Item {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  itemName      String   // "基本給", "残業手当" など
  itemType      String   // "earning" / "deduction"
  displayOrder  Int      @default(0)
  isActive      Boolean  @default(true)
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([userId, itemName])
}
```

### TaxSetting（税率・料率設定）
```prisma
model TaxSetting {
  id                      String   @id @default(cuid())
  userId                  String
  user                    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  year                    Int      // 2024, 2025 等
  healthInsuranceRate     Decimal  @default(9.15) @db.Decimal(5, 2)
  pensionRate             Decimal  @default(9.15) @db.Decimal(5, 2)
  incomeRateTaxFormula    String?  @db.Text  // Phase 2以降
  
  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt

  @@unique([userId, year])
}
```

### Deduction（その他控除）
```prisma
model Deduction {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  deductionType   String   // "life_insurance" / "furusato_nozei" / "other"
  amount          Decimal  @db.Decimal(10, 2)
  year            Int
  note            String?  @db.Text
  
  createdAt       DateTime @default(now())

  @@index([userId, year])
}
```

---

## 🌐 Route Handlers（API エンドポイント）

### 給与（Salary）
```
GET    /api/salaries                      全給与取得（年度・月フィルタ可）
POST   /api/salaries                      給与作成
PUT    /api/salaries/[id]                給与更新
DELETE /api/salaries/[id]                給与削除（soft delete）
GET    /api/salaries/[id]                給与詳細
```

### 賞与（Bonus）
```
GET    /api/bonuses
POST   /api/bonuses
PUT    /api/bonuses/[id]
DELETE /api/bonuses/[id]
```

### 項目（Item）
```
GET    /api/items
POST   /api/items
PUT    /api/items/[id]
DELETE /api/items/[id]
```

### 税金設定（TaxSetting）
```
GET    /api/tax-settings?year=2024
POST   /api/tax-settings
PUT    /api/tax-settings/[id]
```

---

## 📱 ページ構成

### 保護されたルート（認証必須）
```
/dashboard                 ダッシュボード（グラフ・集計表示）
/salaries                  給与一覧
/salaries/new              給与新規登録
/salaries/[id]/edit        給与編集
/bonuses                   賞与管理
/items                     項目管理
/settings                  設定（税率、プロフィール）
```

### 保護なしルート
```
/                          ランディングページ（ログインボタン）
/api/auth/...              NextAuth 自動ハンドラ
```

---

## 🔐 認証フロー

### 初期セットアップ（src/auth.ts）
```typescript
import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { db } from '@/lib/db'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30日
  },
  pages: {
    signIn: '/auth/signin',
  },
})
```

### Route Handler での認証確認
```typescript
import { auth } from '@/auth'

export async function GET(req: Request) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  // ... userId でデータ取得
}
```

---

## 🧮 計算ロジック（lib/calculations.ts）

### 残業代計算
```typescript
export function calculateOvertime(input: {
  baseSalary: number        // 月給
  overtimeHours: number     // 残業時間
  workingHours?: number     // 所定労働時間（デフォルト: 160）
}): { hourlyRate: number; overtimeAmount: number } {
  const { baseSalary, overtimeHours, workingHours = 160 } = input
  const hourlyRate = baseSalary / workingHours
  const overtimeAmount = hourlyRate * overtimeHours

  return {
    hourlyRate: Math.round(hourlyRate),
    overtimeAmount: Math.round(overtimeAmount * 100) / 100,
  }
}
```

### 社会保険料計算
```typescript
export function calculateInsurance(input: {
  grossSalary: number
  healthInsuranceRate?: number  // デフォルト: 9.15
  pensionRate?: number          // デフォルト: 9.15
}): { healthInsurance: number; pension: number; total: number } {
  const {
    grossSalary,
    healthInsuranceRate = 9.15,
    pensionRate = 9.15,
  } = input

  const healthInsurance = Math.round((grossSalary * healthInsuranceRate) / 100)
  const pension = Math.round((grossSalary * pensionRate) / 100)

  return {
    healthInsurance,
    pension,
    total: healthInsurance + pension,
  }
}
```

---

## 🎨 UI コンポーネント（Phase 1）

### SalaryForm（給与入力フォーム）

**用途:** /salaries/new, /salaries/[id]/edit

**入力項目:**
- 支給日（必須、日付ピッカー）
- 基本給（必須、数値）
- 残業時間（オプション、自動計算: 時給・残業代）
- 健康保険料（オプション、自動計算可）
- 厚生年金保険料（オプション、自動計算可）
- 所得税（オプション）
- 住民税（オプション）
- その他控除（オプション）
- メモ（オプション）

**フロー:**
1. React Hook Form + Zod でバリデーション
2. エラー → UI に表示
3. 成功 → POST /api/salaries (新規) または PUT /api/salaries/[id] (編集)
4. 完了 → /salaries にリダイレクト

**必須:** React Hook Form, Zod, shadcn/ui (Input, Button, Select)

---

### SalaryList（給与一覧）

**用途:** /salaries

**表示形式:**
- **PC:** テーブル形式（日付、支給額、控除額、手取額、操作ボタン）
- **モバイル:** カード形式（各行がカード）

**操作:**
- 新規登録ボタン → /salaries/new
- 編集ボタン → /salaries/[id]/edit
- 削除ボタン → 確認ダイアログ → DELETE /api/salaries/[id]

**機能:**
- 月別フィルタ
- ソート（日付、金額）
- ページネーション（オプション）

---

### SalaryTrendChart（支給額推移グラフ）

**用途:** /dashboard

**グラフ型:** Recharts LineChart

**データ:**
- X軸: 月（MM-DD 形式）
- Y軸: 金額
- 折れ線: 支給額、手取額

**レスポンシブ:**
- モバイル: 幅 95vw - 32px, 高さ 300px
- PC: 幅 100%, 高さ 400px

**ライブラリ:** Recharts

---

### DeductionChart（控除内訳グラフ）

**用途:** /dashboard

**グラフ型:** Recharts BarChart または PieChart

**データ:**
- 健康保険、厚生年金、所得税、住民税、その他

**色分け:**
- 健康保険: blue-500
- 厚生年金: green-500
- 所得税: amber-500
- 住民税: red-500

---

### ItemManager（項目管理）

**用途:** /items

**機能:**
- 項目リスト表示（ドラッグで並び替え可能）
- 項目追加ボタン
- 項目編集（名前、種別）
- 項目削除
- アクティブ/非アクティブ切り替え

---

## 🗂️ ディレクトリ構造

```
meisai-lab/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── api/
│   │   │   ├── salaries/
│   │   │   │   ├── route.ts           (GET, POST)
│   │   │   │   └── [id]/route.ts      (GET, PUT, DELETE)
│   │   │   ├── bonuses/route.ts
│   │   │   ├── items/route.ts
│   │   │   └── tax-settings/route.ts
│   │   ├── dashboard/page.tsx
│   │   ├── salaries/
│   │   │   ├── page.tsx               (一覧)
│   │   │   ├── new/page.tsx           (新規)
│   │   │   └── [id]/
│   │   │       └── edit/page.tsx      (編集)
│   │   ├── bonuses/page.tsx
│   │   ├── items/page.tsx
│   │   ├── settings/page.tsx
│   │   └── (auth)/
│   │       ├── signin/page.tsx
│   │       └── error/page.tsx
│   ├── components/
│   │   ├── SalaryForm.tsx
│   │   ├── SalaryList.tsx
│   │   ├── Charts/
│   │   │   ├── SalaryTrendChart.tsx
│   │   │   └── DeductionChart.tsx
│   │   ├── ItemManager.tsx
│   │   ├── Navigation.tsx
│   │   └── ui/                        (shadcn/ui)
│   ├── lib/
│   │   ├── db.ts
│   │   ├── auth.ts
│   │   ├── calculations.ts
│   │   ├── utils.ts
│   │   └── validators.ts              (Zod スキーマ)
│   ├── types/
│   │   └── index.ts
│   ├── styles/
│   │   └── globals.css
│   ├── middleware.ts
│   └── auth.ts
├── prisma/
│   └── schema.prisma
├── public/
├── .cursor/
│   └── rules/                         (シンボリックリンク)
├── .github/workflows/
│   ├── ci.yml
│   └── deploy.yml
├── deploy/
│   └── ecosystem.config.js
├── .env.example
├── .env.tpl
├── package.json
└── tsconfig.json
```

---

## ✅ Phase 1 実装チェックリスト

### セットアップ
- [ ] Next.js 16 + TypeScript + Tailwind CSS 初期化
- [ ] shadcn/ui をセットアップ
- [ ] Prisma スキーマ作成・`npm run db:setup`
- [ ] NextAuth v5 Google OAuth 実装
- [ ] ミドルウェア（認証保護）作成

### API エンドポイント実装
- [ ] GET /api/salaries（一覧・フィルタ）
- [ ] POST /api/salaries（作成）
- [ ] PUT /api/salaries/[id]（更新）
- [ ] DELETE /api/salaries/[id]（削除）
- [ ] GET/POST/PUT /api/items
- [ ] GET/POST/PUT /api/tax-settings

### UI コンポーネント実装
- [ ] SalaryForm（React Hook Form + Zod）
- [ ] SalaryList（テーブル + モバイル対応）
- [ ] SalaryTrendChart（Recharts LineChart）
- [ ] DeductionChart（Recharts BarChart）
- [ ] ItemManager（ドラッグ並び替え）
- [ ] Navigation（ナビゲーション）

### ページ実装
- [ ] /dashboard（ダッシュボード）
- [ ] /salaries（一覧）
- [ ] /salaries/new（新規）
- [ ] /salaries/[id]/edit（編集）
- [ ] /items（項目管理）
- [ ] /settings（設定）
- [ ] /auth/signin（サインイン）

### テスト・最適化
- [ ] モバイルレスポンシブ確認
- [ ] フォームバリデーション
- [ ] エラーハンドリング
- [ ] ローディング状態

### デプロイ準備
- [ ] GitHub Actions CI/CD 設定
- [ ] 1Password 設定
- [ ] VPS 設定（/apps/meisai-lab 作成）
- [ ] Apache VirtualHost 設定
- [ ] PM2 ecosystem.config.js

---

## 🔒 バリデーション（Zod スキーマ例）

### CreateSalarySchema
```typescript
import { z } from 'zod'

export const CreateSalarySchema = z.object({
  salaryDate: z.string().datetime('無効な日付形式'),
  grossSalary: z.number().positive('支給額は0より大きい数値が必須'),
  netSalary: z.number().nonnegative('手取額は0以上が必須'),
  data: z.record(z.any()).optional(),
  memo: z.string().optional(),
})

export type CreateSalary = z.infer<typeof CreateSalarySchema>
```

---

## 🎯 Cursor プロンプト例

### 全体実装指示

```
# meisai-lab Phase 1 MVP 実装指示

## 仕様
- アプリ: 給与・賞与管理・可視化
- 認証: Google OAuth (NextAuth.js v5)
- DB: Prisma + MariaDB
- UI: Next.js + React + Tailwind + shadcn/ui

## 実装順序
1. Prisma スキーマ確認・DB マイグレーション
2. NextAuth v5 Google OAuth セットアップ
3. Route Handlers (API)
4. UI コンポーネント
5. ページ実装

## 必須事項
- モバイル優先レスポンシブデザイン
- Zod バリデーション
- ユーザーごとのデータ隔離（userId）
- エラーハンドリング完備

## 参考
[バイブコーディングコンテキスト](./CODING_CONTEXT.md)
```

### SalaryForm 実装指示

```
## SalaryForm コンポーネント実装

### 要件
- React Hook Form + Zod バリデーション
- 入力項目: 支給日、支給額、基本給、残業時間、各種控除、メモ
- 残業時間から時給・残業代を自動計算
- 健康保険料・厚生年金を自動計算（手動上書き可）

### 機能
- 支給日: DatePicker（必須、過去日付のみ）
- 支給額: NumberInput（必須、正数）
- 残業手当: 自動計算フィールド
  - 基本給 ÷ 160 = 時給
  - 時給 × 残業時間 = 残業代
- 健康保険料: 自動計算 (支給額 × 9.15%) または 手動入力
- 厚生年金: 同上
- その他: 手動入力
- メモ: TextArea

### UI
- Tailwind CSS + shadcn/ui
- モバイルフレンドリー（px-4 py-2 等）
- ボタン: 保存 / キャンセル

### フロー
1. フォーム入力 → Hook Form 取得
2. Zod バリデーション
3. エラー → UI に赤表示
4. 成功 → POST /api/salaries (新規) または PUT /api/salaries/[id]
5. 完了 → toast 通知 + /salaries へリダイレクト
```

---

## 📚 参考資料

- [Next.js 16 App Router](https://nextjs.org/docs/app)
- [NextAuth.js v5](https://authjs.dev/)
- [Prisma ORM](https://www.prisma.io/docs/)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)
- [Recharts](https://recharts.org/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS v4](https://tailwindcss.com/)

---

**作成日:** 2026-07-04  
**バージョン:** 1.0  
**対象:** Phase 1 MVP
