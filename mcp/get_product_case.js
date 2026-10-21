export const access = "member";
export default {
  name: "get_product_case",
  description: "Retrieve a product resolution case, its linked product, troubleshooting history, evidence, options and status. Use this before suggesting a next step.",
  inputSchema: {type:"object",required:["case_id"],properties:{case_id:{type:"string",description:"UUID of the saved FixForward case"}}},
  async handler(args,ctx){
    const id=String(args.case_id||"").trim();
    if(!/^[0-9a-f-]{36}$/i.test(id)) return {error:"A valid case UUID is required."};
    const c=await ctx.db.query("SELECT * FROM cases WHERE id=$1",[id]);
    if(!c.rows.length) return {error:"Case not found."};
    const item=c.rows[0];
    const [p,e,a,o]=await Promise.all([
      item.product_id?ctx.db.query("SELECT * FROM products WHERE id=$1",[item.product_id]):Promise.resolve({rows:[]}),
      ctx.db.query("SELECT title,source_type,source_reference,excerpt,verification_status,checked_at FROM evidence WHERE case_id=$1 ORDER BY created_at DESC LIMIT 8",[id]),
      ctx.db.query("SELECT step_title,instructions,result,user_note,created_at FROM troubleshooting_attempts WHERE case_id=$1 ORDER BY created_at DESC LIMIT 12",[id]),
      ctx.db.query("SELECT option_type,title,description,estimated_cost,currency,evidence_basis,uncertainty,recommended FROM resolution_options WHERE case_id=$1 ORDER BY recommended DESC LIMIT 8",[id])
    ]);
    return {case:item,product:p.rows[0]||null,evidence:e.rows,attempts:a.rows,options:o.rows};
  }
};