import { db } from "hatchable";
export const access = "public";
export const methods = ["GET","POST"];
export default async function(req,res){
  if(req.method==="GET"){
    const {rows}=await db.query("SELECT * FROM products ORDER BY created_at DESC");
    return res.json({products:rows});
  }
  const b=req.body||{};
  const name=String(b.name||"").trim();
  if(!name) return res.status(400).json({error:"Product name is required."});
  const {rows}=await db.query(
    "INSERT INTO products (name,brand,model,category,retailer,purchase_date,purchase_price,currency,warranty_months,return_deadline,notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *",
    [name,String(b.brand||""),String(b.model||""),String(b.category||"Electronics"),String(b.retailer||""),b.purchase_date||null,b.purchase_price===""||b.purchase_price==null?null:Number(b.purchase_price),String(b.currency||"INR"),b.warranty_months===""||b.warranty_months==null?null:Number(b.warranty_months),b.return_deadline||null,String(b.notes||"")]
  );
  res.status(201).json(rows[0]);
}