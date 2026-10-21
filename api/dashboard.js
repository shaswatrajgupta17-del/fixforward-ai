import { db } from "hatchable";
export const access = "public";
export const methods = ["GET"];
export default async function(req,res){
  const [p,c,e] = await Promise.all([
    db.query("SELECT * FROM products ORDER BY created_at DESC"),
    db.query("SELECT * FROM cases ORDER BY updated_at DESC"),
    db.query("SELECT * FROM evidence ORDER BY created_at DESC")
  ]);
  res.json({products:p.rows,cases:c.rows,evidence:e.rows});
}