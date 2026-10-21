import { db } from "hatchable";
export const access = "public";
export const methods = ["GET"];
export default async function(req,res){
  const id=req.params.id;
  const c=await db.query("SELECT * FROM cases WHERE id=$1",[id]);
  if(!c.rows.length) return res.status(404).json({error:"Case not found."});
  const item=c.rows[0];
  const [p,e,a,o,act,out]=await Promise.all([
    item.product_id?db.query("SELECT * FROM products WHERE id=$1",[item.product_id]):Promise.resolve({rows:[]}),
    db.query("SELECT * FROM evidence WHERE case_id=$1 ORDER BY created_at DESC",[id]),
    db.query("SELECT * FROM troubleshooting_attempts WHERE case_id=$1 ORDER BY created_at ASC",[id]),
    db.query("SELECT * FROM resolution_options WHERE case_id=$1 ORDER BY recommended DESC,created_at DESC",[id]),
    db.query("SELECT * FROM case_actions WHERE case_id=$1 ORDER BY created_at DESC",[id]),
    db.query("SELECT * FROM case_outcomes WHERE case_id=$1 ORDER BY created_at DESC",[id])
  ]);
  res.json({case:item,product:p.rows[0]||null,evidence:e.rows,attempts:a.rows,options:o.rows,actions:act.rows,outcomes:out.rows});
}