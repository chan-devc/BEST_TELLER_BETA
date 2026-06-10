import { query } from '../lib/db'

async function main() {
  const sp = await query('SELECT prod_name, score FROM score_point WHERE is_active = true ORDER BY no')
  console.log('=== SCORE_POINT prod_names ===')
  sp.forEach(r => console.log(`  "${r.prod_name}" -> ${r.score}`))

  const t = await query("SELECT user_id,cup,cup_virtual,inter_card,paycard,b1,b1_b1_dup,ibank,sms,onepay,onepay_replace,edc,ac_opn,ac_cls,cash_dps,cash_out,trf,smvat,p2p,domes_trf,inter_trf,sal,cheque,exch,loan,c1_mg,cassic_mg,b1_mg,ib_mg,extra_score,oth,total FROM source_txn WHERE user_id='BCEL0021' LIMIT 1")
  console.log('\n=== BCEL0021 ===')
  console.log(JSON.stringify(t[0], null, 2))
  process.exit(0)
}
main()
