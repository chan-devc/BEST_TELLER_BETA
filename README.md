# BCEL Best Teller — ລາງວັນ Teller ດີເດັ່ນ

ລະບົບຈັດອັນດັບ Teller ດີເດັ່ນ ຂອງ ທະນາຄານການຄ້າຕ່າງປະເທດລາວ (BCEL)  
**Next.js 14 · TypeScript · File-based (no runtime DB)**

---

## ພາບລວມ (Overview)

ລະບົບນີ້ອ່ານຂໍ້ມູນຄະແນນ Teller ຈາກໄຟລ໌ Excel (`.xlsx`) ແລະ ສະແດງຜົນໃນໜ້າເວັບ public ໂດຍບໍ່ຕ້ອງເຊື່ອມຕໍ່ database ໃນ runtime.

---

## ໂຄງສ້າງໂປຣເຈັກ (Project Structure)

```
├── app/
│   ├── page.tsx                          # ໜ້າ public ຫຼັກ (/ route)
│   ├── rank-teller/page.tsx              # ໜ້າ rank teller (/rank-teller)
│   ├── layout.tsx                        # Root layout
│   ├── globals.css                       # Global styles
│   ├── public-page.css                   # Styles ສຳລັບໜ້າ public
│   └── api/
│       └── public/
│           └── rank-teller/route.ts      # API: ອ່ານ XLSX ແລະ ສົ່ງຂໍ້ມູນ JSON
│
├── components/
│   └── PublicRankTellerPage.tsx          # Component ຫຼັກ (UI ທັງໝົດ)
│
├── file/
│   ├── 03.2026v1.xlsx                    # ຂໍ້ມູນຄະແນນ ເດືອນ 03/2026
│   ├── 04.2026v1.xlsx                    # ຂໍ້ມູນຄະແນນ ເດືອນ 04/2026
│   └── finger_codes.json                 # Mapping: user_code → finger_code (photo ID)
│
├── lib/
│   ├── db.ts                             # PostgreSQL client (ໃຊ້ສຳລັບ scripts ເທົ່ານັ້ນ)
│   ├── auth.ts                           # JWT auth helpers
│   ├── format.ts                         # ຟັງຊັ່ນຈັດຮູບແບບຕົວເລກ
│   └── types.ts                          # TypeScript types
│
└── scripts/
    └── seed.ts / migrate.ts / ...        # DB utility scripts (ບໍ່ໃຊ້ໃນ runtime)
```

---

## ແຫຼ່ງຂໍ້ມູນ (Data Sources)

| ໄຟລ໌ | ຈຸດປະສົງ |
|------|---------|
| `file/MM.YYYYvN.xlsx` | ຂໍ້ມູນຄະແນນ Teller ລາຍເດືອນ — ອ່ານດ້ວຍ SheetJS |
| `file/finger_codes.json` | Export ຈາກ `master_teller` table — `{ "BCEL0021": "00797", ... }` |

### ໂຄງສ້າງ Excel (Column Map)

ຂໍ້ມູນເລີ່ມທີ່ **Row 4** (index 3), Column ທີ່ສຳຄັນ:

| Column | Index | Field |
|--------|-------|-------|
| A | 0 | No. |
| B | 1 | User ID |
| C | 2 | ຊື່-ນາມສະກຸນ |
| D | 3 | ຕຳແໜ່ງ |
| E | 4 | ລະດັບ |
| G | 6 | ຂະແໜງ (Sector) |
| H | 7 | ສາຂາ/ພາກສ່ວນ (Department) |
| I | 8 | ວັນເຮັດວຽກ |
| J | 9 | ທຸລະກຳ/ມື້ → ຄະແນນທຸລະກຳ |
| K | 10 | ຄ່າສະເລ່ຍ ຄະແນນລວມ |
| U | 20 | **ຄະແນນລວມ (Final Score)** |

### ການຕັ້ງຊື່ໄຟລ໌ Excel

```
MM.YYYYvN.xlsx
│   │     └── version (v1, v2, ...)
│   └────── ປີ (YYYY)
└────────── ເດືອນ (MM)
```

ຕົວຢ່າງ: `04.2026v1.xlsx` = ເດືອນ 04 ປີ 2026 ສະບັບ 1

---

## ການຕິດຕັ້ງ (Setup)

### Prerequisites

- Node.js 18+
- npm

### ຕິດຕັ້ງ

```bash
npm install
```

### ເພີ່ມໄຟລ໌ຂໍ້ມູນ

1. ວາງໄຟລ໌ Excel ໃນໂຟລເດີ `file/` ຕາມຮູບແບບ `MM.YYYYvN.xlsx`
2. ວາງໄຟລ໌ `finger_codes.json` ໃນໂຟລເດີ `file/`

### Development

```bash
npm run dev
# http://localhost:3000
```

### Production

```bash
npm run build
npm run start
```

---

## ການສ້າງ finger_codes.json

Export ຄັ້ງດຽວຈາກ PostgreSQL container (PowerShell):

```powershell
# 1. Query ຈາກ DB
docker exec my-postgres psql -U postgres -d bcel_db -c `
  "SELECT user_code, finger_code FROM master_teller WHERE finger_code IS NOT NULL" `
  --csv -t > raw.csv

# 2. ແປງເປັນ JSON UTF-8 (ບໍ່ມີ BOM)
$rows = Import-Csv raw.csv -Header user_code,finger_code
$map  = @{}
foreach ($r in $rows) { $map[$r.user_code] = $r.finger_code }
$json = $map | ConvertTo-Json -Compress
[System.IO.File]::WriteAllText("file\finger_codes.json", $json, [System.Text.UTF8Encoding]::new($false))
```

> **ສຳຄັນ:** ຕ້ອງໃຊ້ `UTF8Encoding($false)` — PowerShell 5.1 ຂຽນ BOM ໂດຍ default ເຮັດໃຫ້ `JSON.parse` ລົ້ມເຫຼວ

---

## API Endpoint

### `GET /api/public/rank-teller`

| Parameter | Type | Default | ຄຳອະທິບາຍ |
|-----------|------|---------|-----------|
| `rankId` | number | `1` | ລຳດັບ Sheet (1-based) |
| `issueDate` | string | ລ່າສຸດ | ຮູບແບບ `YYYY-MM` ເຊັ່ນ `2026-04` |
| `search` | string | `""` | ຄົ້ນຫາຊື່ ຫຼື User ID |

**Response:**

```json
{
  "rows": [{ "no": 1, "user_id": "BCEL0021", "fullname": "...", "total_score": 145.5, ... }],
  "ranks": [
    { "id": 1, "group_name": "Rank All Teller", "dept_count": 22, "dept_name": "ສຳນັກງານໃຫ່ຍ" }
  ],
  "approved_period": "2026-04",
  "issue_dates": ["2026-04", "2026-03"],
  "not_announced": false
}
```

---

## ໜ້າ Public (Features)

- **ຈັດອັນດັບລວມ** — ຮຽງຕາມ `total_score` DESC, reassign No. ລ/ດ ໃໝ່
- **Podium Top 5** — ຈັດຮຽງ 4th | 2nd | 1st | 3rd | 5th, ສຳລັບຄະແນນ ≥ 100 ເທົ່ານັ້ນ
- **Medal Icons** — 🥇🥈🥉 ສຳລັບ rank 1–3, AwardBadge ສຳລັບ rank 4–5 (ຄະແນນ ≥ 100)
- **ຈັດອັນດັບ ແຍກສາຂາ** — ເລືອກ Sheet/ສາຂາ ແລ້ວ filter ພາຍໃນ
- **ຮູບພະນັກງານ** — ດຶງຈາກ `http://10.0.2.140:8687/api/employee/img?eid={finger_code}`
- **ຄົ້ນຫາ** — ຄົ້ນຫາຕາມຊື່ ຫຼື User ID (debounced)
- **Modal ລາຍລະອຽດ** — ກົດເບິ່ງ score breakdown ລາຍບຸກຄົນ
- **ເລືອກເດືອນ** — ປ່ຽນ period ຈາກ issue_dates ທີ່ມີ

---

## ລາຍຊື່ສາຂາ (Branch Codes)

| Code | ສາຂາ |
|------|------|
| 010-HQV | ສຳນັກງານໃຫ່ຍ |
| 019-PHB | ສາຂາໂພນໂຮງ |
| 020-KHM | ສາຂາຄຳມ່ວນ |
| 030-SVN | ສາຂາສະຫວັນນະເຂດ |
| 040-CPS | ສາຂາຈຳປາສັກ |
| 050-LPB | ສາຂາຫຼວງພະບາງ |
| 060-ODX | ສາຂາອຸດົມໄຊ |
| 070-LNT | ສາຂາຫຼວງນໍ້າທາ |
| 080-ATP | ສາຂາອັດຕະປື |
| 090-VTC | ສາຂານະຄອນຫຼວງວຽງຈັນ |
| 110-BOK | ສາຂາບໍ່ແກ້ວ |
| 120-XYL | ສາຂາໄຊຍະບູລີ |
| 130-XKH | ສາຂາຊຽງຂວາງ |
| 140-VVB | ສາຂາວັງວຽງ |
| 150-BLX | ສາຂາບໍລິຄຳໄຊ |
| 160-DDB | ສາຂາດົງໂດກ |
| 170-HPB | ສາຂາຫົວພັນ |
| 180-PSL | ສາຂາຜົ້ງສາລີ |
| 190-SEK | ສາຂາເຊກອງ |
| 200-SLV | ສາຂາສາລະວັນ |
| 210-XSB | ສາຂາໄຊສົມບູນ |
| 220-SST | ສາຂາໄຊເສດຖາ |

---

## Tech Stack

| ເຕັກໂນໂລຈີ | ຈຸດປະສົງ |
|------------|---------|
| Next.js 14 (App Router) | Framework |
| TypeScript | Language |
| SheetJS (`xlsx`) | ອ່ານໄຟລ໌ Excel ໃນ runtime |
| React 18 | UI |
| Tailwind CSS | Utility styles |
| `jose` | JWT (admin auth) |
| `bcryptjs` | Password hashing |
| `pg` | PostgreSQL (scripts only, ບໍ່ໃຊ້ໃນ runtime) |
