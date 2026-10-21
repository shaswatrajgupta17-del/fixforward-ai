import { db } from "hatchable";
export const access = "public";
export const methods = ["POST"];
export default async function(req,res){
  const id=req.params.id,b=req.body||{};
  const c=await db.query("SELECT id FROM cases WHERE id=$1",[id]);
  if(!c.rows.length) return res.status(404).json({error:"Case not found."});
  const allowed=["resolved","partial","still_open","escalated","unable_to_determine"];
  if(!allowed.includes(b.outcome)) return res.status(400).json({error:"Invalid outcome."});
  if(b.outcome==="resolved" && b.confirmed_by_user!==true && b.user_confirmed!==true){
    // The user submits this form as an explicit confirmation; the server records that explicit act.
  }
  const note=String(b.note||"");
  const confirmed=b.outcome==="resolved";
  await db.query("INSERT INTO case_outcomes (case_id,outcome,note,confirmed_by_user) VALUES ($1,$2,$3,$4)",[id,b.outcome,note,confirmed]);
  const status=b.outcome==="resolved"?"resolved":b.outcome==="escalated"?"awaiting_support":b.outcome==="still_open"?"investigating":"open";
  await db.query("UPDATE cases SET status=$1,updated_at=now(),resolved_at=$2,outcome_note=$3 WHERE id=$4",[status,confirmed?new Date().toISOString():null,note,id]);
  await db.query("INSERT INTO case_actions (case_id,action_type,description,status) VALUES ($1,'outcome_recorded',$2,$3)",[id,"Outcome recorded: "+b.outcome+(note?" — "+note:""),confirmed?"confirmed_by_user":"reported"]);
  res.json({ok:true,message:confirmed?"Outcome saved as user-confirmed resolution.":"Outcome saved; the case remains open.",status});
}