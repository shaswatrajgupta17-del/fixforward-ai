import { db } from "hatchable";
export const access = "public";
export const methods = ["POST"];
export default async function(req,res){
  const id=req.params.id;
  const c=await db.query("SELECT * FROM cases WHERE id=$1",[id]);
  if(!c.rows.length) return res.status(404).json({error:"Case not found."});
  const item=c.rows[0];
  const [p,e,a]=await Promise.all([
    item.product_id?db.query("SELECT * FROM products WHERE id=$1",[item.product_id]):Promise.resolve({rows:[]}),
    db.query("SELECT * FROM evidence WHERE case_id=$1 ORDER BY created_at DESC",[id]),
    db.query("SELECT * FROM troubleshooting_attempts WHERE case_id=$1 ORDER BY created_at DESC",[id])
  ]);
  const product=p.rows[0]||{};
  const evidence=e.rows;
  const failed=a.rows.some(x=>x.result==="failed");
  const worked=a.rows.some(x=>x.result==="worked");
  const demo=evidence.some(x=>x.verification_status==="demo_only");
  const warrantyMonths=Number(product.warranty_months||0);
  const purchaseDate=product.purchase_date?new Date(product.purchase_date):null;
  let monthsOld=null;
  if(purchaseDate && !isNaN(purchaseDate.getTime())) monthsOld=(Date.now()-purchaseDate.getTime())/(1000*60*60*24*30.4375);
  const periodPossible=!!warrantyMonths && monthsOld!==null && monthsOld>=0 && monthsOld<=warrantyMonths;
  const options=[
    {option_type:"troubleshoot",title:"Continue guided troubleshooting",description:worked?"A previous step was reported as working. Confirm whether the issue is fully resolved before repeating steps.":failed?"A prior step failed. Review the history and try only a distinct, model-appropriate safe step.":"Start with reversible, model-appropriate checks from the available product guidance. Avoid unsafe disassembly or unapproved cleaning methods.",estimated_cost:0,currency:product.currency||"INR",evidence_basis:evidence.length?evidence.map(x=>x.title).join("; "):"No case-specific evidence has been added.",uncertainty:"Troubleshooting guidance may be fictional or user-provided; confirm against the exact model's official manual.",recommended:!worked},
    {option_type:"warranty_support",title:"Check manufacturer or warranty support",description:"Verify exact model, purchase evidence, coverage terms and exclusions with the manufacturer or seller before paying for a repair.",estimated_cost:null,currency:product.currency||"INR",evidence_basis:product.warranty_months?"Saved warranty duration: "+product.warranty_months+" months; purchase date "+(product.purchase_date||"not recorded")+".":"Purchase date and warranty duration are incomplete.",uncertainty:(periodPossible?"Purchase date falls within the recorded duration, but eligibility and exclusions are not verified. ":"Eligibility is unknown. ")+(demo?"Some linked evidence is fictional demo data. ":"")+"No claim has been submitted and no free repair is promised.",recommended:periodPossible&&failed&&!worked},
    {option_type:"repair",title:"Request a repair quote",description:"Ask an authorized or reputable repair provider for a written diagnosis, total cost, parts availability and repair warranty before approving work.",estimated_cost:null,currency:product.currency||"INR",evidence_basis:"No live repair quote is connected to this demo.",uncertainty:"Cost, turnaround time, parts availability and repair success are unknown until a provider gives a quote.",recommended:false},
    {option_type:"replace",title:"Compare a compatible replacement",description:"Consider replacement only after checking repair/support options and compatibility. Compare total price, return terms and expected useful life.",estimated_cost:null,currency:product.currency||"INR",evidence_basis:"No live product price or compatibility feed is connected.",uncertainty:"Current price, compatibility and long-term value are not verified.",recommended:false}
  ];
  await db.query("DELETE FROM resolution_options WHERE case_id=$1",[id]);
  const saved=[];
  for(const o of options){
    const r=await db.query("INSERT INTO resolution_options (case_id,option_type,title,description,estimated_cost,currency,evidence_basis,uncertainty,recommended) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *",[id,o.option_type,o.title,o.description,o.estimated_cost,o.currency,o.evidence_basis,o.uncertainty,o.recommended]);
    saved.push(r.rows[0]);
  }
  await db.query("INSERT INTO case_actions (case_id,action_type,description,status) VALUES ($1,'options_compared',$2,'recorded')",[id,"Compared four resolution paths using saved case context. No live warranty, repair quote or replacement price was assumed."]);
  await db.query("UPDATE cases SET updated_at=now() WHERE id=$1",[id]);
  res.json({case_id:id,options:saved,notice:"This is a transparent rule-based comparison, not a warranty eligibility decision or live quote."});
}