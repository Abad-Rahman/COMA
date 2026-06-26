# ☁️ Supabase সেটআপ গাইড — চিত্রা ল্যাবরেটরীজ অ্যাপ
### (সম্পূর্ণ বাংলায়, একদম শূন্য থেকে)

---

## 📌 Supabase কী এবং কেন দরকার?

**Supabase** হলো একটি ফ্রি অনলাইন ডাটাবেস সার্ভিস। এটা দিয়ে তুমি তোমার ফোনের অ্যাপের ডেটা ইন্টারনেটে backup রাখতে পারবে।

**কেন লাগবে?**
- ফোন হারিয়ে গেলে বা নষ্ট হলেও ডেটা থাকবে
- একাধিক ডিভাইসে (ফোন + ল্যাপটপ) একই ডেটা দেখা যাবে
- ইন্টারনেট ছাড়া অ্যাপ আগের মতোই চলবে — Supabase শুধু backup এর জন্য

---

## 🔒 Security সম্পর্কে জানো

Supabase-এ দুই ধরনের "Key" আছে:

| Key | কী করে | কতটা সাবধান থাকতে হবে |
|-----|---------|----------------------|
| **Anon Key** (Public) | সাধারণ read/write | মোটামুটি নিরাপদ |
| **Service Role Key** | সবকিছু করতে পারে | **কখনো শেয়ার করবে না!** |

এই অ্যাপে শুধু **Anon Key** ব্যবহার হয়। কিন্তু এই key দিয়েও যাতে কেউ তোমার ডেটা না দেখতে পারে, সেজন্য **RLS (Row Level Security)** চালু রাখতে হবে। নিচে সেটা বলা আছে।

---

## 📋 ধাপে ধাপে সেটআপ

### ধাপ ১: Supabase অ্যাকাউন্ট তৈরি করো

1. ব্রাউজার খোলো এবং যাও: **https://supabase.com**
2. উপরে ডানদিকে **"Start your project"** বাটনে ক্লিক করো
3. **"Sign up with GitHub"** এ ক্লিক করো
   - যদি GitHub অ্যাকাউন্ট না থাকে, **https://github.com** এ গিয়ে আগে একটা ফ্রি অ্যাকাউন্ট বানাও
   - GitHub এ "Sign up" করো, email দিয়ে verify করো
4. GitHub দিয়ে sign in করার পর Supabase-এ ফিরে আসবে — account তৈরি হয়ে যাবে

---

### ধাপ ২: নতুন প্রজেক্ট বানাও

1. Supabase Dashboard এ আসার পর **"New project"** বাটন দেখবে — ক্লিক করো
2. একটা ফর্ম আসবে, এভাবে পূরণ করো:
   - **Organization**: নিজের নাম বা "Personal" থাকলেও চলবে
   - **Project name**: যেকোনো নাম দাও, যেমন `chitra-app`
   - **Database Password**: একটা শক্তিশালী password দাও এবং কোথাও **লিখে রাখো**
   - **Region**: **Southeast Asia (Singapore)** বেছে নাও — বাংলাদেশের সবচেয়ে কাছে
3. **"Create new project"** বাটনে ক্লিক করো
4. ৩-৫ মিনিট অপেক্ষা করো — project তৈরি হচ্ছে (একটা progress bar দেখাবে)

---

### ধাপ ৩: API Key কপি করো

প্রজেক্ট তৈরি হলে:

1. বাম দিকের মেনুতে ⚙️ **"Project Settings"** তে ক্লিক করো
2. তারপর **"API"** তে ক্লিক করো
3. দুটো জিনিস দেখবে — এগুলো কপি করে কোথাও রাখো:

```
Project URL:   https://xxxxxxxxxxxxxxxx.supabase.co
Anon Key:      eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....(অনেক লম্বা)
```

> ⚠️ সাবধান: "Service Role Key" কখনো কোথাও দেবে না — সেটা দিলে কেউ তোমার সব ডেটা মুছে দিতে পারবে।

---

### ধাপ ৪: Database টেবিল তৈরি করো (সবচেয়ে গুরুত্বপূর্ণ!)

এটা একবারই করতে হবে।

1. বাম দিকের মেনুতে **"SQL Editor"** তে ক্লিক করো
2. মাঝখানে একটা বড় text box দেখবে
3. নিচের SQL code টা **সম্পূর্ণ** কপি করো এবং সেই text box এ paste করো:

```sql
-- টেবিল তৈরি করো
create table if not exists sync_records (
  owner_id    text    not null,
  table_name  text    not null,
  record_id   text    not null,
  payload     jsonb   not null,
  updated_at  bigint  not null,
  primary key (owner_id, table_name, record_id)
);

-- Row Level Security চালু করো
alter table sync_records enable row level security;

-- Access policy তৈরি করো
create policy "sync_records_all"
  on sync_records
  for all
  using (true)
  with check (true);
```

4. উপরে **"Run"** বাটনে ক্লিক করো (অথবা Ctrl+Enter চাপো)
5. নিচে **"Success"** লেখা দেখলে বুঝবে হয়ে গেছে!

---

### ধাপ ৫: অ্যাপে কনফিগ বসাও

1. অ্যাপে উপরে **Settings** বাটনে ক্লিক করো
2. **"Sync / Backup"** ট্যাবে যাও
3. **"Supabase Configuration"** সেকশনে ক্লিক করো
4. দুটো ঘর পূরণ করো:
   - **Project URL**: ধাপ ৩ থেকে কপি করা URL
   - **Anon / Public Key**: ধাপ ৩ থেকে কপি করা Anon Key
5. **"Supabase কনফিগ সেভ করুন"** বাটনে ক্লিক করো
6. **"Sync Code"** এর জায়গায় একটা কোড দাও — যেমন `chitra-2026` — এবং সেভ করো
7. Sync **চালু** করো এবং **"এখনই Sync করুন"** চাপো

✅ "Sync সফল হয়েছে" দেখলে বুঝবে সব ঠিকঠাক!

---

## 🛡️ নিরাপত্তা টিপস

| করো | করো না |
|-----|---------|
| Sync Code গোপন রাখো | Anon Key সোশ্যাল মিডিয়ায় শেয়ার করো না |
| পাসওয়ার্ড লিখে রাখো নিরাপদ জায়গায় | Service Role Key কাউকে দিও না |
| একই Sync Code দুটো ডিভাইসে ব্যবহার করো | Sync Code অপরিচিত কাউকে দিও না |

---

## ❓ সমস্যা হলে কী করবে?

**Sync কাজ করছে না?**
- ইন্টারনেট সংযোগ আছে কিনা দেখো
- URL এবং Anon Key সঠিকভাবে বসানো আছে কিনা দেখো

**"not-configured" দেখাচ্ছে?**
- Settings > Sync > Supabase Configuration খুলে আবার URL ও Key বসাও এবং সেভ করো

**SQL Editor এ Error দেখাচ্ছে?**
- টেবিল আগে থেকে থাকতে পারে — `if not exists` দিয়ে আবার রান করো

---

## 📱 একাধিক ডিভাইসে ব্যবহার

উদাহরণ: ফোন + ল্যাপটপ দুটোতেই একই ডেটা চাই।

1. দুটো ডিভাইসেই **একই Project URL ও Anon Key** বসাও
2. দুটো ডিভাইসেই **একই Sync Code** বসাও
3. দুটোতেই Sync চালু করো
4. যেটাতে কিছু করবে, অন্যটাতে "Sync করুন" চাপলেই আপডেট দেখাবে

---

## 🎉 শেষ কথা

- সব অর্ডার ও কাস্টমার ডেটা Supabase-এ backup থাকবে
- ফোন হারালেও নতুন ফোনে একই URL/Key/SyncCode বসালে সব ফিরে পাবে
- ইন্টারনেট ছাড়াও অ্যাপ পুরোপুরি কাজ করবে
- Supabase ফ্রি প্ল্যানে ৫০০MB স্টোরেজ পাবে — এই অ্যাপের জন্য অনেক বেশি

---

*গাইড তৈরি: চিত্রা ল্যাবরেটরীজ অ্যাপ*
