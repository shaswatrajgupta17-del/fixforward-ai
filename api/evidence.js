import { db } from "hatchable";
export const access = "public";
export const methods = ["GET","POST"];
export default async function(req,res){
  if(req.method==="GET"){
    const {rows}=await db.query("SELECT * FROM evidence ORDER BY created_at DESC");
    return res.json({evidence:rows});
  }
  const b=req.body||{};
  const title=String(b.title||"").trim(), excerpt=String(b.excerpt||"").trim();
  if(!title||!excerpt) return res.status(400).json({error:"Evidence title and excerpt are required."});
  if(b.case_id){
    const c=await db.query("SELECT id FROM cases WHERE id=$1",[b.case_id]);
    if(!c.rows.length) return res.status(400).json({error:"Selected case was not found."});
  }
  const {rows}=await db.query(
    "INSERT INTO evidence (case_id,title,source_type,source_reference,excerpt,verification_status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
    [b.case_id||null,title,String(b.source_type||"user_provided"),String(b.source_reference||""),excerpt,String(b.verification_status||"unverified")]
  );
  if(b.case_id) await db.query("UPDATE cases SET updated_at=now() WHERE id=$1",[b.case_id]);
  res.status(201).json(rows[0]);
}