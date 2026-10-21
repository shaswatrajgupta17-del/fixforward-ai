import { db } from "hatchable";
export const access = "public";
export const methods = ["POST"];
export default async function(req,res){
  const id=req.params.id,b=req.body||{};
  const c=await db.query("SELECT id FROM cases WHERE id=$1",[id]);
  if(!c.rows.length) return res.status(404).json({error:"Case not found."});
  const description=String(b.description||"").trim();
  if(!description) return res.status(400).json({error:"Action description is required."});
  const r=await db.query("INSERT INTO case_actions (case_id,action_type,description,status,approved_by_user) VALUES ($1,$2,$3,'recorded',$4) RETURNING *",[id,String(b.action_type||"user_action"),description,b.approved_by_user===true]);
  await db.query("UPDATE cases SET updated_at=now() WHERE id=$1",[id]);
  res.status(201).json(r.rows[0]);
}