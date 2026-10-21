import { db } from "hatchable";
export const access = "public";
export const methods = ["GET","POST"];
export default async function(req,res){
  if(req.method==="GET"){
    const {rows}=await db.query("SELECT * FROM cases ORDER BY updated_at DESC");
    return res.json({cases:rows});
  }
  const b=req.body||{};
  const title=String(b.title||"").trim();
  const issue=String(b.issue_description||"").trim();
  if(!title||!issue) return res.status(400).json({error:"Case title and issue description are required."});
  const productId=b.product_id||null;
  if(productId){
    const p=await db.query("SELECT id FROM products WHERE id=$1",[productId]);
    if(!p.rows.length) return res.status(400).json({error:"Selected product was not found."});
  }
  const {rows}=await db.query(
    "INSERT INTO cases (product_id,title,issue_description,symptoms,status,priority,user_goal) VALUES ($1,$2,$3,$4,'open',$5,'resolve_without_unnecessary_cost') RETURNING *",
    [productId,title,issue,String(b.symptoms||""),String(b.priority||"normal")]
  );
  await db.query("INSERT INTO case_actions (case_id,action_type,description,status) VALUES ($1,'case_created','Case created and saved.','recorded')",[rows[0].id]);
  res.status(201).json(rows[0]);
}