/**
 * BCEL Best Teller Award 2026 — Database Seed Script
 * Run: npx ts-node scripts/seed.ts
 * Or:  node -r ts-node/register scripts/seed.ts
 */

import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load .env.local manually (dotenv not installed)
const envPath = path.resolve(__dirname, '../.env.local')
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (key && !(key in process.env)) process.env[key] = val
  }
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

// ──────────────────────────────────────────────────────────
//  USERS
// ──────────────────────────────────────────────────────────
const USERS = [
  { username: 'superadmin', password: 'bcel@SA2026', display_name: 'ທ.ສົມສັກ ລັດຖະການ', role: 'superadmin', color: '#D63030' },
  { username: 'editor1',    password: 'bcel@Ed2026', display_name: 'ນ.ມາລາ ສຸວັນທອນ',   role: 'editor',     color: '#C99A00' },
  { username: 'editor2',    password: 'bcel@Ed2026', display_name: 'ທ.ກິດຕິ ພົງສີ',      role: 'editor',     color: '#22C97A' },
]

// ──────────────────────────────────────────────────────────
//  CATEGORIES
// ──────────────────────────────────────────────────────────
const CATEGORIES = [
  { sheet_key: '1.1.Top_Unit18b',       cat: '18b',  type: 'Unit',      label: 'ໜ່ວຍບໍລິການ (18 ສາຂາ)',        emoji: '🏢', sort_order: 1  },
  { sheet_key: '1.2.Top_Service18b',    cat: '18b',  type: 'Service',   label: 'ຂະແໜງບໍລິການ (18 ສາຂາ)',       emoji: '💼', sort_order: 2  },
  { sheet_key: '1.3.Top_Cash18b',       cat: '18b',  type: 'Cash',      label: 'ຄັງເງີນສົດ (18 ສາຂາ)',         emoji: '💰', sort_order: 3  },
  { sheet_key: '2.1.Top_Unit3VTE',      cat: 'VTE',  type: 'Unit',      label: 'ໜ່ວຍບໍລິການ (3 ສາຂາ VTE)',     emoji: '🏢', sort_order: 4  },
  { sheet_key: '2.2.Top_Service3VTE',   cat: 'VTE',  type: 'Service',   label: 'ຂະແໜງບໍລິການ (VTE)',           emoji: '💼', sort_order: 5  },
  { sheet_key: '3.3.Top_Cash3VTE',      cat: 'VTE',  type: 'Cash',      label: 'ຄັງເງີນສົດ (VTE)',             emoji: '💰', sort_order: 6  },
  { sheet_key: '4.1.Top_Cash HQV',      cat: 'HQV',  type: 'Cash',      label: 'ຄັງເງີນສົດ (ສຳນັກງານໃຫຍ່)',   emoji: '🏦', sort_order: 7  },
  { sheet_key: '5.1.Top_Clearing OPC',  cat: 'OPC',  type: 'Clearing',  label: 'Clearing OPC',                  emoji: '📋', sort_order: 8  },
  { sheet_key: '5.2.Top_Product OPC',   cat: 'OPC',  type: 'Product',   label: 'Product OPC',                   emoji: '📦', sort_order: 9  },
  { sheet_key: '5.3.Top_Aftersale OPC', cat: 'OPC',  type: 'Aftersale', label: 'Aftersale OPC',                 emoji: '🔧', sort_order: 10 },
  { sheet_key: '5.4.Top_Deposit OPC',   cat: 'OPC',  type: 'Deposit',   label: 'Deposit OPC',                   emoji: '🏧', sort_order: 11 },
  { sheet_key: '5.5.Top_Open N Ac OPC', cat: 'OPC',  type: 'OpenAcc',   label: 'Open Account OPC',              emoji: '📝', sort_order: 12 },
  { sheet_key: '5.6.Top_Transfer',      cat: 'OPC',  type: 'Transfer',  label: 'Transfer OPC',                  emoji: '🔄', sort_order: 13 },
]

// ──────────────────────────────────────────────────────────
//  TELLER DATA (extracted from bcel-admin.html EXCEL const)
// ──────────────────────────────────────────────────────────
type TellerRow = { rank: number; user: string; name: string; unit: string; branch: string; score: number; position?: string }

const TELLER_DATA: Record<string, TellerRow[]> = {
  '1.1.Top_Unit18b': [
    { rank: 1,  user: 'BCEL2359', name: 'ນາງ ມະນີວອນ ສຸກດາວົງ',          unit: 'ໜ່ວຍບໍລິການ ເມືອງຍົມມະລາດ',           branch: 'ສາຂາ ຄຳມ່ວນ',              score: 90.57 },
    { rank: 2,  user: 'BCEL0021', name: 'ທ້າວ ສົມສະນຸກ ຊ່ຽນສະຫວັນ',     unit: 'ໜ່ວຍບໍລິການ ຊາຍແດນລາວບາວ',          branch: 'ສາຂາ ສະຫວັນນະເຂດ',         score: 90.00 },
    { rank: 3,  user: 'BCEL2464', name: 'ນາງ ລົດຈະນາ ອິນທິສານ',          unit: 'ໜ່ວຍບໍລິການ ຫີນບູນ',                branch: 'ສາຂາ ຄຳມ່ວນ',              score: 85.82 },
    { rank: 4,  user: 'BCEL2308', name: 'ທ້າວ ສຸກສະຫວັນ ມະນີວົງ',       unit: 'ໜ່ວຍບໍລິການ ຫຼັກ 35',               branch: 'ສາຂາ ສະຫວັນນະເຂດ',         score: 83.74 },
    { rank: 5,  user: 'BCEL0456', name: 'ທ້າວ ສີສະໝຸດ ສີວິໄລ',          unit: 'ໜ່ວຍບໍລິການ ຕະຫຼາດໃໝ່ປາກເຊ',       branch: 'ສາຂາ ຈຳປາສັກ',             score: 81.79 },
    { rank: 6,  user: 'BCEL1256', name: 'ນາງ ພຸດສະດີ ສິດທິອຸດົມ',       unit: 'ໜ່ວຍບໍລິການ ຫຼັກ 20',               branch: 'ສາຂາ ບໍລິຄຳໄຊ',            score: 81.31 },
    { rank: 7,  user: 'BCEL2338', name: 'ນາງ ໄກເພັດ ລາດຊະວົງ',          unit: 'ໜ່ວຍບໍລິການ ຫຼັກ 8',                branch: 'ສາຂາ ຈຳປາສັກ',             score: 78.83 },
    { rank: 8,  user: 'BCEL0395', name: 'ນາງ ພູໄລວັນ ມີທອງ',            unit: 'ໜ່ວຍບໍລິການ ອາດສະພັງທອງ',           branch: 'ສາຂາ ສະຫວັນນະເຂດ',         score: 77.99 },
    { rank: 9,  user: 'BCEL1443', name: 'ນາງ ສຸກສາຄອນ ພັນທະວົງ',        unit: 'ໜ່ວຍບໍລິການ ຕະຫຼາດນ້ຳຫງຳ',          branch: 'ສາຂາ ຊຽງຂວາງ',             score: 76.47 },
    { rank: 10, user: 'BCEL2330', name: 'ນາງ ປຸກີ ແກ້ວວົງປະເສີດ',       unit: 'ໜ່ວຍບໍລິການ ເມືອງຕົ້ນເຜິ້ງ',        branch: 'ສາຂາ ບໍ່ແກ້ວ',             score: 75.94 },
    { rank: 11, user: 'BCEL0524', name: 'ນາງ ວິພິດາ ສີຫານາດ',           unit: 'ໜ່ວຍບໍລິການ ນາວຽງຄຳ',               branch: 'ສາຂາ ຫຼວງພະບາງ',           score: 75.57 },
    { rank: 12, user: 'BCEL0339', name: 'ນາງ ວັນນິມົນ ແພງສົມບັດ',       unit: 'ໜ່ວຍບໍລິການ ເມືອງໜອງບົກ',           branch: 'ສາຂາ ຄຳມ່ວນ',              score: 75.08 },
    { rank: 13, user: 'BCEL1925', name: 'ທ້າວ ສຸບິນ ນາມມະວົງ',          unit: 'ໜ່ວຍບໍລິການ ຫ້ວຍຊາຍ',               branch: 'ສາຂາ ບໍ່ແກ້ວ',             score: 74.83 },
    { rank: 14, user: 'BCEL1460', name: 'ນາງ ເພັດອາລຸນ ອູ້ມທອງສີ',      unit: 'ໜ່ວຍບໍລິການ ທຸລະຄົມ',               branch: 'ສາຂາ ໂພນໂຮງ',              score: 74.78 },
    { rank: 15, user: 'BCEL0394', name: 'ນາງ ທິບພາວັນ ສໍລະເສີນ',        unit: 'ໜ່ວຍບໍລິການ ເມືອງໄກສອນ ພົມວິຫານ',   branch: 'ສາຂາ ສະຫວັນນະເຂດ',         score: 74.39 },
    { rank: 16, user: 'BCEL2474', name: 'ນາງ ທິບພາວັນ ພັນພົງສີ',        unit: 'ໜ່ວຍບໍລິການ ກາສີ',                  branch: 'ສາຂາ ວັງວຽງ',              score: 74.13 },
    { rank: 17, user: 'BCEL1890', name: 'ທ້າວ ຂັນທະສັກ ພູວັນໂນ',        unit: 'ໜ່ວຍບໍລິການ ຕະຫຼາດໃໝ່ປາກເຊ',       branch: 'ສາຂາ ຈຳປາສັກ',             score: 73.89 },
    { rank: 18, user: 'BCEL1790', name: 'ນາງ ອຳໄພ ຈັນທະລັງສີ',          unit: 'ໜ່ວຍບໍລິການ ເມືອງຮຸນ',              branch: 'ສາຂາ ອຸດົມໄຊ',             score: 73.17 },
    { rank: 19, user: 'BCEL2307', name: 'ທ້າວ ບຸນຄ້ຳ ເພັດກົງຈັກ',        unit: 'ໜ່ວຍບໍລິການ ເມືອງວິລະບຸລີ',        branch: 'ສາຂາ ສະຫວັນນະເຂດ',         score: 70.69 },
    { rank: 20, user: 'BCEL1147', name: 'ນາງ ລັດສະໝີ ລາດຊະວົງ',         unit: 'ໜ່ວຍບໍລິການ ດົງດຳດວນ',              branch: 'ສາຂາ ສະຫວັນນະເຂດ',         score: 70.57 },
  ],
  '1.2.Top_Service18b': [
    { rank: 1,  user: 'BCEL1829', name: 'ນາງ ຂັນແກ້ວ ມິ່ງບຸບຜາ',        unit: 'ຂະແໜງ ບໍລິການ', branch: 'ສາຂາ ອຸດົມໄຊ',             score: 99.00 },
    { rank: 2,  user: 'BCEL2377', name: 'ທ້າວ ໂອເລ່ ຈູມມະລີ',           unit: 'ຂະແໜງ ບໍລິການ', branch: 'ສາຂາ ຊຽງຂວາງ',             score: 79.19 },
    { rank: 3,  user: 'BCEL1820', name: 'ນາງ ຈັນສະມຸດ ລໍສະຫວັນ',        unit: 'ຂະແໜງ ບໍລິການ', branch: 'ສາຂາ ອຸດົມໄຊ',             score: 71.34 },
    { rank: 4,  user: 'BCEL0415', name: 'ນາງ ສຸກສະດາ ໂຄດສຸວັນ',         unit: 'ຂະແໜງ ບໍລິການ', branch: 'ສາຂາ ສະຫວັນນະເຂດ',         score: 63.25 },
    { rank: 5,  user: 'BCEL1163', name: 'ນາງ ລັດສະໝີ ຊາພັກດີ',          unit: 'ຂະແໜງ ບໍລິການ', branch: 'ສາຂາ ຈຳປາສັກ',             score: 57.99 },
    { rank: 6,  user: 'BCEL1896', name: 'ນາງ ທັນມະນີ ວາລະກອນ',          unit: 'ຂະແໜງ ບໍລິການ', branch: 'ສາຂາ ຈຳປາສັກ',             score: 57.12 },
    { rank: 7,  user: 'BCEL1822', name: 'ນາງ ດວງສຸດາ ວົງຈັນທະລັງສີ',    unit: 'ຂະແໜງ ບໍລິການ', branch: 'ສາຂາ ຄຳມ່ວນ',              score: 52.40 },
    { rank: 8,  user: 'BCEL1196', name: 'ນາງ ສຸລິນທອນ ສົມປະສົງ',         unit: 'ຂະແໜງ ບໍລິການ', branch: 'ສາຂາ ບໍ່ແກ້ວ',             score: 51.98 },
    { rank: 9,  user: 'BCEL1641', name: 'ນາງ ຈິນດາລັດ ພົມມະນີລາດ',      unit: 'ຂະແໜງ ບໍລິການ', branch: 'ສາຂາ ຄຳມ່ວນ',              score: 51.71 },
    { rank: 10, user: 'BCEL1639', name: 'ນາງ ອາລີຊາ ວົງຈັນທະລັງສີ',     unit: 'ຂະແໜງ ບໍລິການ', branch: 'ສາຂາ ຄຳມ່ວນ',              score: 50.47 },
    { rank: 11, user: 'BCEL1268', name: 'ນາງ ພອນທິບ ທຳມະວົງ',           unit: 'ຂະແໜງ ບໍລິການ', branch: 'ສາຂາ ຊຽງຂວາງ',             score: 50.02 },
    { rank: 12, user: 'BCEL2378', name: 'ນາງ ຕຸກຕາ ມາລິຍາ',             unit: 'ຂະແໜງ ບໍລິການ', branch: 'ສາຂາ ຊຽງຂວາງ',             score: 48.47 },
    { rank: 13, user: 'BCEL2201', name: 'ນາງ ອາດີໃສ ອຳນາດແກ້ວ',         unit: 'ຂະແໜງ ບໍລິການ', branch: 'ສາຂາ ສະຫວັນນະເຂດ',         score: 48.11 },
    { rank: 14, user: 'BCEL2352', name: 'ນາງ ສົມພິດ ພົມພິມພາ',           unit: 'ຂະແໜງ ບໍລິການ', branch: 'ສາຂາ ບໍລິຄຳໄຊ',            score: 47.17 },
    { rank: 15, user: 'BCEL0901', name: 'ນາງ ມະນີຈັນ ມຽນມະນີ',           unit: 'ຂະແໜງ ບໍລິການ', branch: 'ສາຂາ ຄຳມ່ວນ',              score: 47.05 },
    { rank: 16, user: 'BCEL1216', name: 'ນາງ ເອລະວັນ ມະນີວົງສາ',        unit: 'ຂະແໜງ ບໍລິການ', branch: 'ສາຂາ ຄຳມ່ວນ',              score: 46.42 },
    { rank: 17, user: 'BCEL1202', name: 'ທ້າວ ຈັນທະຄອນ ເລື່ອງພັນໄຊ',    unit: 'ຂະແໜງ ບໍລິການ', branch: 'ສາຂາ ໂພນໂຮງ',              score: 45.64 },
    { rank: 18, user: 'BCEL1911', name: 'ນາງ ເກສອນ ວົງສີແກ້ວ',           unit: 'ຂະແໜງ ບໍລິການ', branch: 'ສາຂາ ຄຳມ່ວນ',              score: 45.57 },
    { rank: 19, user: 'BCEL1751', name: 'ນາງ ສຸດາລັດ ສຸດທະວິໄລ',         unit: 'ຂະແໜງ ບໍລິການ', branch: 'ສາຂາ ບໍ່ແກ້ວ',             score: 45.53 },
    { rank: 20, user: 'BCEL0900', name: 'ນາງ ສຸກສະຫວາດ ສຸດທິວົງ',        unit: 'ຂະແໜງ ບໍລິການ', branch: 'ສາຂາ ໄຊຍະບູລີ',            score: 57.02 },
  ],
  '1.3.Top_Cash18b': [
    { rank: 1,  user: 'BCEL2354', name: 'ທ້າວ ພູມສັກດາ ຈັນຊົມພູ',         unit: 'ຂະແໜງ ຄັງເງີນສົດ', branch: 'ສາຂາ ຄຳມ່ວນ',              score: 92.00 },
    { rank: 2,  user: 'BCEL0411', name: 'ທ້າວ ເພັດສະໝອນ ຊາພູວົງ',         unit: 'ຂະແໜງ ຄັງເງີນສົດ', branch: 'ສາຂາ ສະຫວັນນະເຂດ',         score: 89.49 },
    { rank: 3,  user: 'BCEL0754', name: 'ນາງ ສຸດທິດາ ພັນທະສິດ',           unit: 'ຂະແໜງ ຄັງເງີນສົດ', branch: 'ສາຂາ ຫຼວງພະບາງ',           score: 89.27 },
    { rank: 4,  user: 'BCEL0818', name: 'ນາງ ໄພລົດ ລັດຕະນະ',              unit: 'ຂະແໜງ ຄັງເງີນສົດ', branch: 'ສາຂາ ວັງວຽງ',              score: 77.99 },
    { rank: 5,  user: 'BCEL2331', name: 'ທ້າວ ອານຸສັກ ໄຊຍະຈັກ',           unit: 'ຂະແໜງ ຄັງເງີນສົດ', branch: 'ສາຂາ ບໍ່ແກ້ວ',             score: 75.32 },
    { rank: 6,  user: 'BCEL2370', name: 'ນາງ ໂບຊັນ ຫຼວງໂຄດ',              unit: 'ຂະແໜງ ຄັງເງີນສົດ', branch: 'ສາຂາ ວັງວຽງ',              score: 72.35 },
    { rank: 7,  user: 'BCEL1332', name: 'ທ້າວ ແສງທະວີ ຄຳພູສອນ',            unit: 'ຂະແໜງ ຄັງເງີນສົດ', branch: 'ສາຂາ ສະຫວັນນະເຂດ',         score: 70.81 },
    { rank: 8,  user: 'BCEL1054', name: 'ນາງ ສົມທາ ປັນສະຫວັດ',            unit: 'ຂະແໜງ ຄັງເງີນສົດ', branch: 'ສາຂາ ຫຼວງພະບາງ',           score: 68.95 },
    { rank: 9,  user: 'BCEL0859', name: 'ນາງ ສຸກທິດາ ສິດລາກອນ',           unit: 'ຂະແໜງ ຄັງເງີນສົດ', branch: 'ສາຂາ ບໍລິຄຳໄຊ',            score: 68.95 },
    { rank: 10, user: 'BCEL1214', name: 'ນາງ ມາລິນີ ອຸດທິວົງ',            unit: 'ຂະແໜງ ຄັງເງີນສົດ', branch: 'ສາຂາ ຄຳມ່ວນ',              score: 67.50 },
    { rank: 11, user: 'BCEL2170', name: 'ທ້າວ ຄອນສິນ ເພັດສີຄາມ',          unit: 'ຂະແໜງ ຄັງເງີນສົດ', branch: 'ສາຂາ ຫຼວງນ້ຳທາ',           score: 50.05 },
    { rank: 12, user: 'BCEL2225', name: 'ນາງ ເຈນນີ ອ່ອນແກ້ວ',             unit: 'ຂະແໜງ ຄັງເງີນສົດ', branch: 'ສາຂາ ຫຼວງນ້ຳທາ',           score: 47.00 },
    { rank: 13, user: 'BCEL2494', name: 'ນາງ ປະລິນຍາ ເພັດສົມພອນ',         unit: 'ຂະແໜງ ຄັງເງີນສົດ', branch: 'ສາຂາ ສາລະວັນ',             score: 46.82 },
    { rank: 14, user: 'BCEL2230', name: 'ທ້າວ ລັດສະໝີ ຊຸມພົນພັກດີ',       unit: 'ຂະແໜງ ຄັງເງີນສົດ', branch: 'ສາຂາ ໂພນໂຮງ',              score: 46.23 },
    { rank: 15, user: 'BCEL2220', name: 'ທ້າວ ສຸກປານີ ລັດຖະຈັກ',           unit: 'ຂະແໜງ ຄັງເງີນສົດ', branch: 'ສາຂາ ຄຳມ່ວນ',              score: 45.29 },
    { rank: 16, user: 'BCEL1152', name: 'ທ້າວ ເຕັງລໍ່ ຢົວະຈົງ',            unit: 'ຂະແໜງ ຄັງເງີນສົດ', branch: 'ສາຂາ ຊຽງຂວາງ',             score: 43.94 },
    { rank: 17, user: 'BCEL2094', name: 'ທ້າວ ສົມຈິດ ອິນທະວົງ',           unit: 'ຂະແໜງ ຄັງເງີນສົດ', branch: 'ສາຂາ ອຸດົມໄຊ',             score: 43.58 },
    { rank: 18, user: 'BCEL0965', name: 'ນາງ ຫັດສະດີ ບົວທິພັນ',           unit: 'ຂະແໜງ ຄັງເງີນສົດ', branch: 'ສາຂາ ຈຳປາສັກ',             score: 43.26 },
    { rank: 19, user: 'BCEL1193', name: 'ນາງ ອານິຕາ ມູນປັນຍາ',            unit: 'ຂະແໜງ ຄັງເງີນສົດ', branch: 'ສາຂາ ຫົວພັນ',              score: 42.77 },
    { rank: 20, user: 'BCEL0747', name: 'ນາງ ສຸກອຳພອນ ໄຊຍະລາດ',           unit: 'ຂະແໜງ ຄັງເງີນສົດ', branch: 'ສາຂາ ໄຊຍະບູລີ',            score: 41.85 },
  ],
  '2.1.Top_Unit3VTE': [
    { rank: 1,  user: 'BCEL2206', name: 'ທ້າວ ແທນມະນີ ວົງຄຳຊາວ',         unit: 'ໜ່ວຍບໍລິການ ສູນການຄ້າສາກົນ',  branch: 'ສາຂາ ນະຄອນຫຼວງວຽງຈັນ', score: 90.50 },
    { rank: 2,  user: 'BCEL2219', name: 'ທ້າວ ຄຳຊະນະ ຈິດຕະວົງ',           unit: 'ໜ່ວຍບໍລິການ ຕະຫຼາດເຊົ້າ',     branch: 'ສາຂາ ນະຄອນຫຼວງວຽງຈັນ', score: 90.48 },
    { rank: 3,  user: 'BCEL1365', name: 'ນາງ ວິລະພອນ ຂຸນທິສານ',           unit: 'ໜ່ວຍບໍລິການ ສີໄຄ',            branch: 'ສາຂາ ນະຄອນຫຼວງວຽງຈັນ', score: 73.33 },
    { rank: 4,  user: 'BCEL2246', name: 'ທ້າວ ທະວີໄຊ ທຳມະວົງສາ',          unit: 'ໜ່ວຍບໍລິການ ດົງຈອງ',          branch: 'ສາຂາ ດົງໂດກ',           score: 63.16 },
    { rank: 5,  user: 'BCEL1675', name: 'ທ້າວ ອານິສົງ ພຽນບຸຜາ',           unit: 'ໜ່ວຍບໍລິການ ດອນໜູນ',          branch: 'ສາຂາ ດົງໂດກ',           score: 59.31 },
    { rank: 6,  user: 'BCEL2118', name: 'ທ້າວ ຄຳປານ ເພື່ອພົມ',            unit: 'ໜ່ວຍບໍລິການ ສີໄຄ',            branch: 'ສາຂາ ນະຄອນຫຼວງວຽງຈັນ', score: 59.26 },
    { rank: 7,  user: 'BCEL0665', name: 'ທ້າວ ພູນຮຽງ ພົງທະວີໄຊ',          unit: 'ໜ່ວຍບໍລິການ ໂພນພະເນົາ',       branch: 'ສາຂາ ໄຊເສດຖາ',          score: 58.17 },
    { rank: 8,  user: 'BCEL1453', name: 'ນາງ ພຸດທະສອນ ວິມອນແກ້ວ',         unit: 'ໜ່ວຍບໍລິການ ໜອງດ້ວງ',         branch: 'ສາຂາ ນະຄອນຫຼວງວຽງຈັນ', score: 56.42 },
    { rank: 9,  user: 'BCEL1371', name: 'ທ້າວ ສຸກສະຫວັນ ຫຼວງວິຈິດ',        unit: 'ໜ່ວຍບໍລິການ ຕະຫຼາດກົກໂພ',    branch: 'ສາຂາ ນະຄອນຫຼວງວຽງຈັນ', score: 55.57 },
    { rank: 10, user: 'BCEL0666', name: 'ທ້າວ ດາວເລືອງ ສີທຳມະວົງ',         unit: 'ໜ່ວຍບໍລິການ ຕະຫຼາດກົກໂພ',    branch: 'ສາຂາ ນະຄອນຫຼວງວຽງຈັນ', score: 55.35 },
    { rank: 11, user: 'BCEL1155', name: 'ທ້າວ ວິລະສິດ ວິໄລແສງ',           unit: 'ໜ່ວຍບໍລິການ ສະພານທອງ',        branch: 'ສາຂາ ໄຊເສດຖາ',          score: 55.30 },
    { rank: 12, user: 'BCEL0696', name: 'ທ້າວ ສົມຫວັງ ເພັງສຸກຂີ',          unit: 'ໜ່ວຍບໍລິການ ໜອງດ້ວງ',         branch: 'ສາຂາ ນະຄອນຫຼວງວຽງຈັນ', score: 55.07 },
    { rank: 13, user: 'BCEL1363', name: 'ທ້າວ ອານົງສັກ ປັນຍາຄົມ',          unit: 'ໜ່ວຍບໍລິການ ໄອເຕັກ',          branch: 'ສາຂາ ໄຊເສດຖາ',          score: 52.85 },
    { rank: 14, user: 'BCEL1137', name: 'ທ້າວ ພົງພານິດ ສຸວັນນະສານ',        unit: 'ໜ່ວຍບໍລິການ ຈອມເພັດ',         branch: 'ສາຂາ ໄຊເສດຖາ',          score: 52.59 },
    { rank: 15, user: 'BCEL1778', name: 'ທ້າວ ສິດທິເດດ ສີຫາລາດ',           unit: 'ໜ່ວຍບໍລິການ ຮ່ອງແກ',          branch: 'ສາຂາ ໄຊເສດຖາ',          score: 51.95 },
    { rank: 16, user: 'BCEL2078', name: 'ທ້າວ ສຸກັນເທວາ ທຳມະຈັກ',          unit: 'ໜ່ວຍບໍລິການ ໜອງໜ່ຽງ',         branch: 'ສາຂາ ດົງໂດກ',           score: 51.33 },
    { rank: 17, user: 'BCEL2187', name: 'ທ້າວ ວັນນາ ພອນສະຫວ່າງ',           unit: 'ໜ່ວຍບໍລິການ ທ່ານາແລ້ງ',       branch: 'ສາຂາ ໄຊເສດຖາ',          score: 49.60 },
    { rank: 18, user: 'BCEL2251', name: 'ທ້າວ ສະເຫຼີມພົນ ໂພທິສານ',         unit: 'ໜ່ວຍບໍລິການ ສະພານທອງ',        branch: 'ສາຂາ ໄຊເສດຖາ',          score: 49.08 },
    { rank: 19, user: 'BCEL1720', name: 'ທ້າວ ສຸວັນທອນ ຫອມສົມບັດ',         unit: 'ໜ່ວຍບໍລິການ ບ້ານໄຮ່ ປາກງື່ມ', branch: 'ສາຂາ ດົງໂດກ',           score: 48.41 },
    { rank: 20, user: 'BCEL1263', name: 'ທ້າວ ຄັດທະນາມ ວົງພູທອນ',          unit: 'ໜ່ວຍບໍລິການ ຂົວມິດຕະພາບ',     branch: 'ສາຂາ ໄຊເສດຖາ',          score: 48.04 },
  ],
  '2.2.Top_Service3VTE': [
    { rank: 1,  user: 'BCEL1511', name: 'ນາງ ດວງມະລາ ກາວັນ',              unit: 'ຂະແໜງ ບໍລິການ', branch: 'ສາຂາ ໄຊເສດຖາ',          score: 88.00 },
    { rank: 2,  user: 'BCEL1114', name: 'ນາງ ຈັນນັນດາ ຈັນທະວົງ',           unit: 'ຂະແໜງ ບໍລິການ', branch: 'ສາຂາ ນະຄອນຫຼວງວຽງຈັນ', score: 87.40 },
    { rank: 3,  user: 'BCEL1801', name: 'ນາງ ໂອທອງ ແສງປະເສີດ',             unit: 'ຂະແໜງ ບໍລິການ', branch: 'ສາຂາ ນະຄອນຫຼວງວຽງຈັນ', score: 79.13 },
    { rank: 4,  user: 'BCEL1254', name: 'ນາງ ອຸລາ ຈັນທະລັງສີ',             unit: 'ຂະແໜງ ບໍລິການ', branch: 'ສາຂາ ດົງໂດກ',           score: 79.04 },
    { rank: 5,  user: 'BCEL0334', name: 'ນາງ ພອນທິບ ຫາໄຣຊາຍ',             unit: 'ຂະແໜງ ບໍລິການ', branch: 'ສາຂາ ນະຄອນຫຼວງວຽງຈັນ', score: 77.68 },
    { rank: 6,  user: 'BCEL2115', name: 'ທ້າວ ສະປ່າຍ ໄຊບຸນມີ',             unit: 'ຂະແໜງ ບໍລິການ', branch: 'ສາຂາ ໄຊເສດຖາ',          score: 76.06 },
    { rank: 7,  user: 'BCEL1642', name: 'ນາງ ວັນສະນິດ ພົງສະຫວັດ',          unit: 'ຂະແໜງ ບໍລິການ', branch: 'ສາຂາ ດົງໂດກ',           score: 73.21 },
    { rank: 8,  user: 'BCEL2042', name: 'ນາງ ນິດຕະຍາ ໂພຊະລາດ',             unit: 'ຂະແໜງ ບໍລິການ', branch: 'ສາຂາ ນະຄອນຫຼວງວຽງຈັນ', score: 72.21 },
    { rank: 9,  user: 'BCEL1053', name: 'ນາງ ສອນພະຈັນ ພົມມະລືຊາ',          unit: 'ຂະແໜງ ບໍລິການ', branch: 'ສາຂາ ໄຊເສດຖາ',          score: 71.57 },
    { rank: 10, user: 'BCEL2416', name: 'ນາງ ສຸດສະດາ ແກ່ນຈັນດີ',           unit: 'ຂະແໜງ ບໍລິການ', branch: 'ສາຂາ ດົງໂດກ',           score: 69.82 },
    { rank: 11, user: 'BCEL1041', name: 'ທ້າວ ອາຟົກ ລຽງສະກຸນ',             unit: 'ຂະແໜງ ບໍລິການ', branch: 'ສາຂາ ດົງໂດກ',           score: 66.63 },
    { rank: 12, user: 'BCEL2436', name: 'ນາງ ສຸກມີນາ ຟີຈິດຕະວົງ',          unit: 'ຂະແໜງ ບໍລິການ', branch: 'ສາຂາ ດົງໂດກ',           score: 64.61 },
    { rank: 13, user: 'BCEL1294', name: 'ນາງ ແສງດາວອນ ພົມທິລາດ',            unit: 'ຂະແໜງ ບໍລິການ', branch: 'ສາຂາ ໄຊເສດຖາ',          score: 61.62 },
    { rank: 14, user: 'BCEL0898', name: 'ນາງ ມີນາ ເພັງດາລາຈັນ',             unit: 'ຂະແໜງ ບໍລິການ', branch: 'ສາຂາ ດົງໂດກ',           score: 60.69 },
    { rank: 15, user: 'BCEL0250', name: 'ນາງ ພອນວັນ ຫອມສົມບັດ',             unit: 'ຂະແໜງ ບໍລິການ', branch: 'ສາຂາ ໄຊເສດຖາ',          score: 60.47 },
    { rank: 16, user: 'BCEL2038', name: 'ນາງ ວຽງໄຊ ເຄນສົມບັດ',              unit: 'ຂະແໜງ ບໍລິການ', branch: 'ສາຂາ ໄຊເສດຖາ',          score: 59.78 },
    { rank: 17, user: 'BCEL0579', name: 'ນາງ ບິດາລັກ ພົມມະໄຊສີ',            unit: 'ຂະແໜງ ບໍລິການ', branch: 'ສາຂາ ນະຄອນຫຼວງວຽງຈັນ', score: 58.93 },
    { rank: 18, user: 'BCEL2020', name: 'ນາງ ລັດຕະນະພອນ ຫຼວງສຸວັນນະວົງ',  unit: 'ຂະແໜງ ບໍລິການ', branch: 'ສາຂາ ນະຄອນຫຼວງວຽງຈັນ', score: 58.53 },
    { rank: 19, user: 'BCEL0257', name: 'ນາງ ນິລາວັນ ສາຍລ້ອງພາ',            unit: 'ຂະແໜງ ບໍລິການ', branch: 'ສາຂາ ດົງໂດກ',           score: 58.09 },
    { rank: 20, user: 'BCEL0705', name: 'ນາງ ທິບພະວັນ ສີນໍລະເພັດ',          unit: 'ຂະແໜງ ບໍລິການ', branch: 'ສາຂາ ນະຄອນຫຼວງວຽງຈັນ', score: 57.21 },
  ],
  '3.3.Top_Cash3VTE': [
    { rank: 1,  user: 'BCEL0683', name: 'ນາງ ລິນ ໄຊລືຢ່າງ',               unit: 'ຂະແໜງ ຄັງເງີນສົດ', branch: 'ສາຂາ ນະຄອນຫຼວງວຽງຈັນ', score: 100.00 },
    { rank: 2,  user: 'BCEL1121', name: 'ນາງ ວິໄລພອນ ພົມມະຈິດ',            unit: 'ຂະແໜງ ຄັງເງີນສົດ', branch: 'ສາຂາ ນະຄອນຫຼວງວຽງຈັນ', score: 91.03 },
    { rank: 3,  user: 'BCEL2116', name: 'ທ້າວ ອາລຸນ ມິ່ງມາໄລພອນ',          unit: 'ຂະແໜງ ຄັງເງີນສົດ', branch: 'ສາຂາ ດົງໂດກ',           score: 81.32 },
    { rank: 4,  user: 'BCEL1865', name: 'ທ້າວ ສຸລິຍົງ ຈັນທະລາສອນ',         unit: 'ຂະແໜງ ຄັງເງີນສົດ', branch: 'ສາຂາ ດົງໂດກ',           score: 79.86 },
    { rank: 5,  user: 'BCEL0664', name: 'ທ້າວ ວົງທະຫວັດ ແສງດາລາ',          unit: 'ຂະແໜງ ຄັງເງີນສົດ', branch: 'ສາຂາ ໄຊເສດຖາ',          score: 72.29 },
    { rank: 6,  user: 'BCEL0676', name: 'ນາງ ທິບພະເກສອນ ພົງວິຈິດ',         unit: 'ຂະແໜງ ຄັງເງີນສົດ', branch: 'ສາຂາ ນະຄອນຫຼວງວຽງຈັນ', score: 64.46 },
    { rank: 7,  user: 'BCEL0330', name: 'ທ້າວ ສົມລັດ ພັນທະວົງ',             unit: 'ຂະແໜງ ຄັງເງີນສົດ', branch: 'ສາຂາ ໄຊເສດຖາ',          score: 63.08 },
    { rank: 8,  user: 'BCEL0702', name: 'ທ້າວ ບຸນໂກ້ ພັນທະວົງ',             unit: 'ຂະແໜງ ຄັງເງີນສົດ', branch: 'ສາຂາ ດົງໂດກ',           score: 59.80 },
    { rank: 9,  user: 'BCEL0983', name: 'ນາງ ຈິດປະສົງ ເຂັມມມະນີວົງ',        unit: 'ຂະແໜງ ຄັງເງີນສົດ', branch: 'ສາຂາ ໄຊເສດຖາ',          score: 47.01 },
    { rank: 10, user: 'BCEL1139', name: 'ທ້າວ ບຸນມີ ດວງພະຈັນ',              unit: 'ຂະແໜງ ຄັງເງີນສົດ', branch: 'ສາຂາ ນະຄອນຫຼວງວຽງຈັນ', score: 40.01 },
    { rank: 11, user: 'BCEL2144', name: 'ທ້າວ ສອນວິສິດ ຈັນທະວົງ',           unit: 'ຂະແໜງ ຄັງເງີນສົດ', branch: 'ສາຂາ ໄຊເສດຖາ',          score: 36.52 },
    { rank: 12, user: 'BCEL1602', name: 'ທ້າວ ແສງສຸລິຍາ ສີວິໄຊ',           unit: 'ຂະແໜງ ຄັງເງີນສົດ', branch: 'ສາຂາ ນະຄອນຫຼວງວຽງຈັນ', score: 20.43 },
    { rank: 13, user: 'BCEL1735', name: 'ທ້າວ ທິບພະຈັນ ບຸນນະວົງ',           unit: 'ຂະແໜງ ຄັງເງີນສົດ', branch: 'ສາຂາ ນະຄອນຫຼວງວຽງຈັນ', score: 19.00 },
    { rank: 14, user: 'BCEL1636', name: 'ທ້າວ ບຸນປອນ ສີຈັນທະປະເສີດ',       unit: 'ຂະແໜງ ຄັງເງີນສົດ', branch: 'ສາຂາ ນະຄອນຫຼວງວຽງຈັນ', score: 18.00 },
    { rank: 15, user: 'BCEL1273', name: 'ທ້າວ ລັກກີ້ ພັນທະດີ',              unit: 'ຂະແໜງ ຄັງເງີນສົດ', branch: 'ສາຂາ ດົງໂດກ',           score: 17.89 },
    { rank: 16, user: 'BCEL0828', name: 'ທ້າວ ອາທິດ ແກ້ວມີເພັດ',            unit: 'ຂະແໜງ ຄັງເງີນສົດ', branch: 'ສາຂາ ດົງໂດກ',           score: 17.11 },
    { rank: 17, user: 'BCEL1009', name: 'ທ້າວ ດີໄຊ ຖານະສຸກ',               unit: 'ຂະແໜງ ຄັງເງີນສົດ', branch: 'ສາຂາ ໄຊເສດຖາ',          score: 10.68 },
    { rank: 18, user: 'BCEL1446', name: 'ທ້າວ ເອກະໄຊ ວໍລະວົງ',              unit: 'ຂະແໜງ ຄັງເງີນສົດ', branch: 'ສາຂາ ນະຄອນຫຼວງວຽງຈັນ', score: 10.05 },
    { rank: 19, user: 'BCEL0017', name: 'ທ້າວ ເພັດຕາວັນ ນັນທະວົງ',          unit: 'ຂະແໜງ ຄັງເງີນສົດ', branch: 'ສາຂາ ໄຊເສດຖາ',          score: 7.75 },
  ],
  '4.1.Top_Cash HQV': [
    { rank: 1,  user: 'BCEL1534', name: 'ນາງ ແສງອະພິສິດ ລັດຖະເຮົ້າ',      unit: 'ຂະແໜງ ຄັງເງິນຕາຕ່າງປະເທດ', branch: 'ພະແນກຄັງເງີນສົດ', score: 89.00 },
    { rank: 2,  user: 'BCEL1736', name: 'ນາງ ພະນົມພອນ ເຂັມຄຳ',             unit: 'ຂະແໜງ ຄັງເງິນກີບ',           branch: 'ພະແນກຄັງເງີນສົດ', score: 71.57 },
    { rank: 3,  user: 'BCEL2424', name: 'ທ້າວ ລໍ່ປາວຊົ່ງ ເຍ່ຍຕູ້',          unit: 'ຂະແໜງ ຄັງເງິນຕາຕ່າງປະເທດ', branch: 'ພະແນກຄັງເງີນສົດ', score: 68.85 },
    { rank: 4,  user: 'BCEL1742', name: 'ທ້າວ ສົມພອນ ວົງວິໄລ',              unit: 'ຂະແໜງ ຄັງເງິນກີບ',           branch: 'ພະແນກຄັງເງີນສົດ', score: 46.80 },
    { rank: 5,  user: 'BCEL1873', name: 'ນາງ ຕຸກຕາ ໂສຍມີໄຊ',               unit: 'ຂະແໜງ ຄັງເງິນຕາຕ່າງປະເທດ', branch: 'ພະແນກຄັງເງີນສົດ', score: 43.28 },
    { rank: 6,  user: 'BCEL2423', name: 'ທ້າວ ບຸນປອນ ທິສານະກອນ',            unit: 'ຂະແໜງ ຄັງເງິນກີບ',           branch: 'ພະແນກຄັງເງີນສົດ', score: 25.29 },
    { rank: 7,  user: 'BCEL1877', name: 'ທ້າວ ລີຕູ້ ລີເລ່ຍນູ',              unit: 'ຂະແໜງ ຄັງເງິນຕາຕ່າງປະເທດ', branch: 'ພະແນກຄັງເງີນສົດ', score: 25.02 },
    { rank: 8,  user: 'BCEL2493', name: 'ທ້າວ ພອນໄຊ ໂພທິສານ',               unit: 'ຂະແໜງ ຄັງເງິນກີບ',           branch: 'ພະແນກຄັງເງີນສົດ', score: 22.49 },
    { rank: 9,  user: 'BCEL1886', name: 'ທ້າວ ວັດທະນາ ພະນະຄອນ',             unit: 'ຂະແໜງ ຄັງເງິນກີບ',           branch: 'ພະແນກຄັງເງີນສົດ', score: 22.35 },
    { rank: 10, user: 'BCEL2160', name: 'ທ້າວ ກິດຕິໄຊ ນ້ອຍຜິວພັນ',          unit: 'ຂະແໜງ ຄັງເງິນກີບ',           branch: 'ພະແນກຄັງເງີນສົດ', score: 22.26 },
    { rank: 11, user: 'BCEL2532', name: 'ທ້າວ ພອນສະຫວັດ ພິລາວົງ',           unit: 'ຂະແໜງ ຄັງເງິນກີບ',           branch: 'ພະແນກຄັງເງີນສົດ', score: 21.68 },
    { rank: 12, user: 'BCEL0888', name: 'ທ້າວ ອະນຸໄຊ ໝື່ນມະນີ',             unit: 'ຂະແໜງ ຄັງເງິນກີບ',           branch: 'ພະແນກຄັງເງີນສົດ', score: 20.59 },
    { rank: 13, user: 'BCEL1634', name: 'ທ້າວ ຖາພະກອນ ໂຄດສີເມືອງ',         unit: 'ຂະແໜງ ຄັງເງິນກີບ',           branch: 'ພະແນກຄັງເງີນສົດ', score: 20.11 },
    { rank: 14, user: 'BCEL2089', name: 'ທ້າວ ອານຸສອນ ສີມະລັງ',             unit: 'ຂະແໜງ ຄັງເງິນຕາຕ່າງປະເທດ', branch: 'ພະແນກຄັງເງີນສົດ', score: 20.00 },
    { rank: 15, user: 'BCEL1304', name: 'ທ້າວ ໄຊຊະນະ ພັນທະວົງ',             unit: 'ຂະແໜງ ຄັງເງິນກີບ',           branch: 'ພະແນກຄັງເງີນສົດ', score: 19.29 },
  ],
  '5.1.Top_Clearing OPC': [
    { rank: 1,  user: 'BCEL1501', name: 'ນາງ ບຸນທະວີ ສຸຂວົງ',              unit: 'ຂະແໜງ Clearing',  branch: 'ພະແນກ OPC', score: 95.00 },
    { rank: 2,  user: 'BCEL1502', name: 'ນາງ ສຸດາ ຄຳຫຼ້າ',                 unit: 'ຂະແໜງ Clearing',  branch: 'ພະແນກ OPC', score: 88.50 },
    { rank: 3,  user: 'BCEL1503', name: 'ທ້າວ ວິໄລ ທອງດີ',                 unit: 'ຂະແໜງ Clearing',  branch: 'ພະແນກ OPC', score: 82.30 },
    { rank: 4,  user: 'BCEL1504', name: 'ນາງ ຈັນດາ ສີດາ',                  unit: 'ຂະແໜງ Clearing',  branch: 'ພະແນກ OPC', score: 78.90 },
    { rank: 5,  user: 'BCEL1505', name: 'ທ້າວ ຄຳລ້ວນ ພົມໄຊ',               unit: 'ຂະແໜງ Clearing',  branch: 'ພະແນກ OPC', score: 75.00 },
  ],
  '5.2.Top_Product OPC': [
    { rank: 1,  user: 'BCEL1601', name: 'ນາງ ອຸ່ນໃຈ ພົງສະຫວາດ',            unit: 'ຂະແໜງ Product',   branch: 'ພະແນກ OPC', score: 92.00 },
    { rank: 2,  user: 'BCEL1602', name: 'ທ້າວ ສຸພັນ ຈັນທະລາ',              unit: 'ຂະແໜງ Product',   branch: 'ພະແນກ OPC', score: 85.00 },
    { rank: 3,  user: 'BCEL1603', name: 'ນາງ ມາລາ ວົງສີ',                  unit: 'ຂະແໜງ Product',   branch: 'ພະແນກ OPC', score: 79.50 },
    { rank: 4,  user: 'BCEL1604', name: 'ທ້າວ ສົມສຸກ ບຸນຍາ',               unit: 'ຂະແໜງ Product',   branch: 'ພະແນກ OPC', score: 72.00 },
    { rank: 5,  user: 'BCEL1605', name: 'ນາງ ນວລພອນ ທ່ອນຄຳ',               unit: 'ຂະແໜງ Product',   branch: 'ພະແນກ OPC', score: 68.50 },
  ],
  '5.3.Top_Aftersale OPC': [
    { rank: 1,  user: 'BCEL1701', name: 'ນາງ ສີດາ ທ່ອງຄຳ',                 unit: 'ຂະແໜງ Aftersale', branch: 'ພະແນກ OPC', score: 91.00 },
    { rank: 2,  user: 'BCEL1702', name: 'ທ້າວ ທວີໄຊ ຫຼວງລາດ',              unit: 'ຂະແໜງ Aftersale', branch: 'ພະແນກ OPC', score: 84.00 },
    { rank: 3,  user: 'BCEL1703', name: 'ນາງ ຄຳພັນ ສີຫາດ',                 unit: 'ຂະແໜງ Aftersale', branch: 'ພະແນກ OPC', score: 77.00 },
    { rank: 4,  user: 'BCEL1704', name: 'ທ້າວ ໃຈດີ ຮ່ຳຮຽນ',                unit: 'ຂະແໜງ Aftersale', branch: 'ພະແນກ OPC', score: 70.50 },
  ],
  '5.4.Top_Deposit OPC': [
    { rank: 1,  user: 'BCEL1801', name: 'ນາງ ສຸດທະນີ ຈັນທະວົງ',             unit: 'ຂະແໜງ Deposit',   branch: 'ພະແນກ OPC', score: 96.00 },
    { rank: 2,  user: 'BCEL1802', name: 'ທ້າວ ບຸນທ້ວນ ພົມມາ',               unit: 'ຂະແໜງ Deposit',   branch: 'ພະແນກ OPC', score: 89.00 },
    { rank: 3,  user: 'BCEL1803', name: 'ນາງ ຈຳປາ ຫຼ້ານ້ອຍ',                unit: 'ຂະແໜງ Deposit',   branch: 'ພະແນກ OPC', score: 83.00 },
    { rank: 4,  user: 'BCEL1804', name: 'ທ້າວ ສາຍທອງ ຍ້ວຍລາ',               unit: 'ຂະແໜງ Deposit',   branch: 'ພະແນກ OPC', score: 76.00 },
    { rank: 5,  user: 'BCEL1805', name: 'ນາງ ພອນໄຊ ທ່ອງຂາວ',                unit: 'ຂະແໜງ Deposit',   branch: 'ພະແນກ OPC', score: 69.00 },
  ],
  '5.5.Top_Open N Ac OPC': [
    { rank: 1,  user: 'BCEL1901', name: 'ນາງ ດາລາ ສີວົງ',                   unit: 'ຂະແໜງ OpenAcc',   branch: 'ພະແນກ OPC', score: 94.00 },
    { rank: 2,  user: 'BCEL1902', name: 'ທ້າວ ອານົນ ສີລາ',                   unit: 'ຂະແໜງ OpenAcc',   branch: 'ພະແນກ OPC', score: 87.00 },
    { rank: 3,  user: 'BCEL1903', name: 'ນາງ ຈັນດີ ຍ່ອງພອນ',                 unit: 'ຂະແໜງ OpenAcc',   branch: 'ພະແນກ OPC', score: 80.00 },
    { rank: 4,  user: 'BCEL1904', name: 'ທ້າວ ສຸລິ ທ່ອນລ້ວງ',                unit: 'ຂະແໜງ OpenAcc',   branch: 'ພະແນກ OPC', score: 73.00 },
  ],
  '5.6.Top_Transfer': [
    { rank: 1,  user: 'BCEL2001', name: 'ນາງ ສຸພາ ຈັນທະຮັກ',                 unit: 'ຂະແໜງ Transfer',  branch: 'ພະແນກ OPC', score: 98.00 },
    { rank: 2,  user: 'BCEL2002', name: 'ທ້າວ ບຸນລ້ວນ ຂາວສີ',                unit: 'ຂະແໜງ Transfer',  branch: 'ພະແນກ OPC', score: 91.00 },
    { rank: 3,  user: 'BCEL2003', name: 'ນາງ ຄຳໃສ ທ່ອນທິ',                   unit: 'ຂະແໜງ Transfer',  branch: 'ພະແນກ OPC', score: 85.00 },
    { rank: 4,  user: 'BCEL2004', name: 'ທ້າວ ສົມໃຈ ຍ່ວຍລາ',                 unit: 'ຂະແໜງ Transfer',  branch: 'ພະແນກ OPC', score: 78.00 },
    { rank: 5,  user: 'BCEL2005', name: 'ນາງ ອ່ອນໄຊ ທ່ອນດີ',                 unit: 'ຂະແໜງ Transfer',  branch: 'ພະແນກ OPC', score: 71.00 },
  ],
}

// ──────────────────────────────────────────────────────────
//  ANNOUNCEMENTS seed data
// ──────────────────────────────────────────────────────────
const ANNOUNCEMENTS = [
  {
    title_lo: 'ຜົນການແຂ່ງຂັນ Best Teller Award 2026 ໄດ້ຮັບການຢັ້ງຢືນແລ້ວ',
    title_en: 'Best Teller Award 2026 Results Confirmed',
    body: 'ທີມງານ BCEL ຂໍແຈ້ງໃຫ້ຊາບວ່າ ຜົນການແຂ່ງຂັນ Best Teller Award 2026 ໄດ້ຮັບການຢັ້ງຢືນຈາກຄະນະກຳມະການແລ້ວ.',
    status: 'live', tag: 'new', role_target: 'all',
  },
  {
    title_lo: 'ພິທີມອບລາງວັນ Best Teller 2026',
    title_en: 'Best Teller Award Ceremony 2026',
    body: 'ພິທີມອບລາງວັນ Best Teller Award 2026 ຈະຈັດຂຶ້ນໃນວັນທີ 25 ມີນາ 2026 ທີ່ສຳນັກງານໃຫຍ່ BCEL.',
    status: 'scheduled', tag: 'event', role_target: 'all',
  },
  {
    title_lo: 'ຂ່າວທົດສອບ (Draft)',
    title_en: 'Test Draft Announcement',
    body: 'ນີ້ແມ່ນຂ່າວທົດສອບ ຍັງບໍ່ໄດ້ລະບຸ.',
    status: 'draft', tag: 'new', role_target: 'admin',
  },
]

// ──────────────────────────────────────────────────────────
//  MAIN SEED FUNCTION
// ──────────────────────────────────────────────────────────
async function seed() {
  const client = await pool.connect()
  try {
    console.log('🌱 Starting database seed...\n')

    // Run migration SQL
    const sqlPath = path.resolve(__dirname, 'migrate.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    await client.query(sql)
    console.log('✅ Schema migrated\n')

    // ── Seed Users ──────────────────────────────────────
    console.log('👤 Seeding admin users...')
    const userIds: Record<string, number> = {}
    for (const u of USERS) {
      const hash = await bcrypt.hash(u.password, 12)
      const res = await client.query(
        `INSERT INTO admin_users (username, password_hash, display_name, role, color)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (username) DO UPDATE
           SET password_hash = EXCLUDED.password_hash,
               display_name  = EXCLUDED.display_name,
               role          = EXCLUDED.role,
               color         = EXCLUDED.color
         RETURNING id`,
        [u.username, hash, u.display_name, u.role, u.color]
      )
      userIds[u.username] = res.rows[0].id
      console.log(`  ✓ ${u.username} (${u.role})`)
    }

    // ── Seed Categories ──────────────────────────────────
    console.log('\n📂 Seeding categories...')
    const catIds: Record<string, number> = {}
    for (const c of CATEGORIES) {
      const res = await client.query(
        `INSERT INTO categories (sheet_key, cat, type, label, emoji, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (sheet_key) DO UPDATE
           SET cat = EXCLUDED.cat, type = EXCLUDED.type, label = EXCLUDED.label,
               emoji = EXCLUDED.emoji, sort_order = EXCLUDED.sort_order
         RETURNING id`,
        [c.sheet_key, c.cat, c.type, c.label, c.emoji, c.sort_order]
      )
      catIds[c.sheet_key] = res.rows[0].id
      console.log(`  ✓ ${c.sheet_key} → ${c.label}`)
    }

    // ── Seed Tellers ─────────────────────────────────────
    console.log('\n👥 Seeding tellers...')
    let totalTellers = 0
    for (const [sheetKey, tellers] of Object.entries(TELLER_DATA)) {
      const catId = catIds[sheetKey]
      if (!catId) { console.warn(`  ⚠ No category for ${sheetKey}`); continue }
      for (const t of tellers) {
        await client.query(
          `INSERT INTO tellers (user_code, name, position, unit, branch, score, rank_in_category, category_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (user_code, category_id) DO UPDATE
             SET name = EXCLUDED.name, unit = EXCLUDED.unit, branch = EXCLUDED.branch,
                 score = EXCLUDED.score, rank_in_category = EXCLUDED.rank_in_category`,
          [t.user, t.name, t.position ?? null, t.unit, t.branch, t.score, t.rank, catId]
        )
        totalTellers++
      }
      console.log(`  ✓ ${sheetKey}: ${tellers.length} tellers`)
    }
    console.log(`  Total: ${totalTellers} tellers`)

    // ── Seed Announcements ───────────────────────────────
    console.log('\n📣 Seeding announcements...')
    const superadminId = userIds['superadmin']
    for (const ann of ANNOUNCEMENTS) {
      await client.query(
        `INSERT INTO announcements (title_lo, title_en, body, status, tag, role_target, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [ann.title_lo, ann.title_en, ann.body, ann.status, ann.tag, ann.role_target, superadminId]
      )
      console.log(`  ✓ ${ann.status}: ${ann.title_lo.slice(0, 40)}...`)
    }

    console.log('\n🎉 Seed complete!\n')
    console.log('Credentials:')
    console.log('  superadmin / bcel@SA2026')
    console.log('  editor1    / bcel@Ed2026')
    console.log('  editor2    / bcel@Ed2026')

  } catch (err) {
    console.error('❌ Seed error:', err)
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

seed().catch(() => process.exit(1))
