# চিত্রা ল্যাবরেটরীজ - অর্ডার ম্যানেজমেন্ট অ্যাপ

## 📦 এই প্রজেক্টে কী আছে

- **Local-first ডাটাবেস** — সব ডেটা (অর্ডার, কাস্টমার, প্রোডাক্ট) সরাসরি আপনার ফোনের
  IndexedDB-তে সেভ হয়। ইন্টারনেট ছাড়াই অ্যাপ পুরোপুরি কাজ করবে।
- **Supabase Cloud Sync (ঐচ্ছিক)** — চাইলে Settings থেকে Supabase কানেক্ট করে
  ব্যাকআপ ও মাল্টি-ডিভাইস সিঙ্ক চালু করতে পারবেন।
- **PWA** — ব্রাউজারে খুলে "Add to Home Screen" করলেই অ্যাপের মতো কাজ করবে।
- **APK বানানোর সুবিধা** — Capacitor দিয়ে রিয়েল Android APK বানানো যাবে।

---

## ধাপ ১: আপনার কম্পিউটারে সেটআপ

প্রথমে আপনার কম্পিউটারে **Node.js** ইনস্টল থাকতে হবে (v18 বা তার পরের ভার্সন)।
না থাকলে এখান থেকে নামান: https://nodejs.org

তারপর এই প্রজেক্ট ফোল্ডারে গিয়ে টার্মিনাল/কমান্ড প্রম্পট খুলে চালান:

```bash
npm install
```

এটা সব প্রয়োজনীয় প্যাকেজ (React, Dexie, Supabase, Vite ইত্যাদি) ডাউনলোড করে নেবে।

---

## ধাপ ২: লোকালি টেস্ট করা (ব্রাউজারে)

```bash
npm run dev
```

এটা চালু হলে টার্মিনালে একটা লিংক দেখাবে, যেমন `http://localhost:5173`।
সেটা ব্রাউজারে খুললেই অ্যাপ দেখতে পাবেন।

**ফোন দিয়ে টেস্ট করতে চাইলে:** আপনার কম্পিউটার আর ফোন একই WiFi-তে থাকতে হবে।
টার্মিনালে যে লোকাল IP address (যেমন `http://192.168.1.5:5173`) দেখাবে,
সেটা ফোনের ব্রাউজারে খুলুন।

---

## ধাপ ৩: PWA হিসেবে ইনস্টল করা (সবচেয়ে সহজ পথ)

1. `npm run build` চালান — এটা `dist` ফোল্ডারে প্রোডাকশন ভার্সন বানাবে।
2. `npm run preview` চালান — এটা production build টেস্ট করার জন্য সার্ভার চালু করবে।
3. ফোনের ক্রোম ব্রাউজারে অ্যাপের লিংক খুলুন।
4. মেনু থেকে **"Add to Home Screen"** বা **"Install App"** চাপুন।
5. ব্যস! এখন আপনার ফোনের হোম স্ক্রিনে আইকন দেখাবে, অ্যাপের মতোই খুলবে।

> **নোট:** PWA সত্যিকারের কাজের জন্য (ফোনে স্থায়ীভাবে রাখার জন্য) অ্যাপটা
> ইন্টারনেটে হোস্ট করতে হবে (যেমন Vercel, Netlify - দুটোই ফ্রি)। নিচে
> ধাপে ধাপে দেখানো আছে।

---

## ধাপ ৪: ইন্টারনেটে হোস্ট করা (Vercel দিয়ে, ফ্রি)

1. https://vercel.com -এ গিয়ে ফ্রি অ্যাকাউন্ট খুলুন (GitHub দিয়ে লগইন করা সহজ)
2. এই প্রজেক্ট ফোল্ডারটা একটা GitHub রিপোজিটরিতে আপলোড করুন
3. Vercel-এ "New Project" চেপে সেই রিপো সিলেক্ট করুন
4. Vercel নিজে থেকেই বুঝে নেবে এটা Vite প্রজেক্ট — শুধু "Deploy" চাপুন
5. কিছুক্ষণের মধ্যে একটা লিংক পাবেন (যেমন `chitra-orders.vercel.app`)
6. এই লিংক ফোনে খুলে "Add to Home Screen" করুন — এখন সবসময়ের জন্য কাজ করবে

---

## ধাপ ৫: Supabase Sync চালু করা (ঐচ্ছিক, ব্যাকআপের জন্য)

### Supabase প্রজেক্ট বানানো:

1. https://supabase.com -এ যান, GitHub বা ইমেইল দিয়ে ফ্রি অ্যাকাউন্ট খুলুন
2. **"New Project"** চাপুন, একটা নাম ও পাসওয়ার্ড দিন, কাছের একটা region সিলেক্ট করুন
   (যেমন `ap-southeast-1` Asia এর জন্য), **"Create new project"** চাপুন
3. কিছুক্ষণ অপেক্ষা করুন, প্রজেক্ট তৈরি হয়ে যাবে

### Sync টেবিল বানানো:

1. বাম পাশের মেনু থেকে **"SQL Editor"** এ যান
2. **"New query"** চাপুন, নিচের SQL কপি-পেস্ট করে **"Run"** চাপুন:

```sql
create table sync_records (
  owner_id text not null,
  table_name text not null,
  record_id text not null,
  payload jsonb not null,
  updated_at bigint not null,
  primary key (owner_id, table_name, record_id)
);

-- RLS এনাবল করা জরুরি, নাহলে anon key দিয়ে যে কেউ অন্যের owner_id এর
-- ডেটাও পড়তে/লিখতে পারবে। এই অ্যাপে real auth না থাকায় Sync Code-ই
-- একমাত্র "সিক্রেট" — তাই এটা গোপন রাখুন, কাউকে শেয়ার করবেন না।
alter table sync_records enable row level security;
create policy "sync_records_all" on sync_records
  for all using (true) with check (true);
```

### API কী খুঁজে বের করা:

1. বাম পাশের মেনু থেকে **"Project Settings" → "API"** তে যান
2. সেখানে **"Project URL"** এবং **"anon / public"** key দেখাবে — এগুলোই আমাদের লাগবে

### অ্যাপে বসানো:

1. Chitra Order Manager অ্যাপ খুলুন
2. **Settings → ☁️ Sync / Backup** ট্যাবে যান
3. **"Supabase Configuration"** এ ক্লিক করে খুলুন
4. Supabase থেকে কপি করা **Project URL** আর **Anon / Public Key** বসান
5. **"Supabase কনফিগ সেভ করুন"** চাপুন
6. এবার উপরে **"Sync"** টগল বাটনে চাপুন — এটা চালু হলে স্বয়ংক্রিয়ভাবে sync
   শুরু হবে

### একাধিক ডিভাইসে sync করতে চাইলে:

একই **Sync Code** দুটো ডিভাইসে বসান (Settings → Sync/Backup → Sync Code)।
যেমন আপনার দোকানের নাম + বছর: `chitra-shop-2026`। এই কোড দিয়েই দুই ডিভাইসের
ডেটা একসাথে মিলে যাবে।

---

## ধাপ ৬: Android APK বানানো

এই ধাপের জন্য আপনার কম্পিউটারে **Android Studio** ইনস্টল থাকা লাগবে।
(https://developer.android.com/studio থেকে ফ্রি নামানো যায়)

```bash
# প্রথমবার Capacitor Android প্রজেক্ট তৈরি করতে
npx cap add android

# কোড পরিবর্তন করার পর প্রতিবার বিল্ড করে Android এ sync করতে
npm run build
npx cap sync android

# Android Studio তে প্রজেক্ট খুলতে (এখান থেকেই APK বানানো যাবে)
npx cap open android
```

Android Studio খুললে উপরের মেনু থেকে **Build → Build Bundle(s) / APK(s) → Build APK(s)**
চাপুন। কিছুক্ষণ পর `android/app/build/outputs/apk/debug/app-debug.apk`
ফাইলে আপনার APK পেয়ে যাবেন — এটা যেকোনো Android ফোনে ইনস্টল করা যাবে।

> Google Play Store-এ পাবলিশ করতে চাইলে "release" বিল্ড বানিয়ে সাইন করতে
> হবে — সেটা একটা আলাদা ধাপ, দরকার হলে পরে সাহায্য করতে পারি।

---

## প্রজেক্ট স্ট্রাকচার

```
src/
  db/                  ← ডাটাবেস লেয়ার
    database.js        ← Dexie (IndexedDB) স্কিমা
    ordersRepo.js       ← অর্ডার সেভ/লোড/ডিলিট ফাংশন
    customersRepo.js    ← কাস্টমার সেভ/লোড/ডিলিট ফাংশন
    settingsRepo.js      ← প্রোডাক্ট/কুরিয়ার লিস্ট
    supabaseConfig.js     ← Supabase ইনিশিয়ালাইজেশন
    sync.js               ← Cloud sync ইঞ্জিন (push/pull লজিক)
    useSync.js             ← React hook, ব্যাকগ্রাউন্ডে অটো-সিঙ্ক চালায়
  components/            ← সব UI কম্পোনেন্ট (OrderForm, CustomerProfile ইত্যাদি)
  utils/                  ← হেল্পার ফাংশন, লোগো ডেটা, ইনভয়েস জেনারেটর
  App.jsx                  ← মূল অ্যাপ, সব কিছু একসাথে জোড়া দেয়
  main.jsx                  ← React entry point
```

---

## কোনো সমস্যা হলে

- **"npm install" এ এরর** → Node.js ভার্সন চেক করুন (`node -v`), v18+ লাগবে
- **Sync কাজ করছে না** → Settings → Sync/Backup এ গিয়ে Supabase config ঠিকভাবে
  বসানো হয়েছে কিনা চেক করুন, এবং Sync টগল চালু আছে কিনা দেখুন
- **ডেটা হারিয়ে গেছে মনে হচ্ছে** → চিন্তা নেই, IndexedDB ব্রাউজার আনইনস্টল না
  করলে ডেটা থেকেই যায়। Supabase Sync চালু থাকলে cloud-এও ব্যাকআপ আছে।
