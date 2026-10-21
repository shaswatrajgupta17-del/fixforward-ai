import { db } from "hatchable";
export const access = "public";
export const methods = ["POST"];
export default async function(req,res){
  const id=req.params.id,b=req.body||{};
  const c=await db.query("SELECT id FROM cases WHERE id=$1",[id]);
  if(!c.rows.length) return res.status(404).json({error:"Case not found."});
  const allowed=["not_tried","worked","failed","partial","unsafe"];
  if(b.attempt_id){
    if(!allowed.includes(b.result)) return res.status(400).json({error:"Invalid attempt result."});
    const r=await db.query("UPDATE troubleshooting_attempts SET result=$1,user_note=$2 WHERE id=$3 AND case_id=$4 RETURNING *",[b.result,String(b.user_note||""),b.attempt_id,id]);
    if(!r.rows.length) return res.status(404).json({error:"Troubleshooting step not found."});
    await db.query("INSERT INTO case_actions (case_id,action_type,description,status) VALUES ($1,'troubleshooting_result',$2,'recorded')",[id,"Result recorded for "+r.rows[0].step_title+": "+b.result]);
    await db.query("UPDATE cases SET updated_at=now() WHERE id=$1",[id]);
    return res.json(r.rows[0]);
  }
  const title=String(b.step_title||"").trim(),instructions=String(b.instructions||"").trim();
  if(!title||!instructions) return res.status(400).json({error:"Step title and instructions are required."});
  if(!allowed.includes(b.result||"not_tried")) return res.status(400).json({error:"Invalid result."});
  const r=await db.query("INSERT INTO troubleshooting_attempts (case_id,step_title,instructions,result,user_note) VALUES ($1,$2,$3,$4,$5) RETURNING *",[id,title,instructions,b.result||"not_tried",String(b.user_note||"")]);
  await db.query("INSERT INTO case_actions (case_id,action_type,description,status) VALUES ($1,'troubleshooting_added',$2,'recorded')",[id,"Troubleshooting step added: "+title]);
  await db.query("UPDATE cases SET updated_at=now() WHERE id=$1",[id]);
  res.status(201).json(r.rows[0]);
}