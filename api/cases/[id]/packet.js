import { db } from "hatchable";
export const access = "public";
export const methods = ["POST"];
export default async function(req,res){
  const id=req.params.id;
  const c=await db.query("SELECT * FROM cases WHERE id=$1",[id]);
  if(!c.rows.length) return res.status(404).json({error:"Case not found."});
  const item=c.rows[0];
  const [p,a,e]=await Promise.all([
    item.product_id?db.query("SELECT * FROM products WHERE id=$1",[item.product_id]):Promise.resolve({rows:[]}),
    db.query("SELECT * FROM troubleshooting_attempts WHERE case_id=$1 ORDER BY created_at",[id]),
    db.query("SELECT * FROM evidence WHERE case_id=$1 ORDER BY created_at",[id])
  ]);
  const product=p.rows[0]||{};
  const packet=[
    "FIXFORWARD AI — SUPPORT REQUEST DRAFT",
    "Review and edit before sending. This packet has not been submitted to any provider.",
    "",
    "Case: "+item.title,
    "Case ID: "+item.id,
    "Status: "+item.status,
    "",
    "PRODUCT",
    "Name: "+(product.name||"Not provided"),
    "Brand/model: "+[product.brand,product.model].filter(Boolean).join(" / "),
    "Retailer: "+(product.retailer||"Not provided"),
    "Purchase date: "+(product.purchase_date||"Not provided"),
    "Purchase price: "+(product.purchase_price==null?"Not provided":product.currency+" "+product.purchase_price),
    "",
    "ISSUE",
    item.issue_description,
    "Symptoms: "+(item.symptoms||"Not provided"),
    "",
    "TROUBLESHOOTING ALREADY ATTEMPTED",
    ...(a.rows.length?a.rows.map(x=>"- "+x.step_title+" — "+x.result+". "+x.instructions+(x.user_note?" User note: "+x.user_note:"")):["- No attempts recorded."]),
    "",
    "SUPPORTING EVIDENCE",
    ...(e.rows.length?e.rows.map(x=>"- "+x.title+" ["+x.verification_status+"]: "+x.excerpt+" Reference: "+(x.source_reference||"not supplied")):["- No evidence linked to this case."]),
    "",
    "REQUEST",
    "Please confirm the applicable diagnostic steps, coverage and exclusions, any required proof of purchase, available service options, estimated total cost, and expected turnaround time.",
    "",
    "DISCLAIMER",
    "Information is based on user-provided case data and the evidence listed above. Warranty eligibility and repair costs have not been independently confirmed by FixForward AI."
  ].join("\n");
  const r=await db.query("INSERT INTO support_packets (case_id,packet_text) VALUES ($1,$2) RETURNING *",[id,packet]);
  await db.query("INSERT INTO case_actions (case_id,action_type,description,status) VALUES ($1,'support_packet_prepared','Prepared a support-request draft. It has not been sent externally.','recorded')",[id]);
  await db.query("UPDATE cases SET updated_at=now() WHERE id=$1",[id]);
  res.json({id:r.rows[0].id,packet_text:packet,created_at:r.rows[0].created_at});
}