export const access = "member";
export default {
  name: "compare_resolution_options",
  description: "Compare the saved troubleshooting, warranty-support, repair and replacement options for a case. Creates persistent option records; does not submit claims or buy anything.",
  inputSchema: {type:"object",required:["case_id"],properties:{case_id:{type:"string",description:"UUID of the resolution case"}}},
  async handler(args,ctx){
    const id=String(args.case_id||"").trim();
    if(!/^[0-9a-f-]{36}$/i.test(id)) return {error:"A valid case UUID is required."};
    const c=await ctx.db.query("SELECT id FROM cases WHERE id=$1",[id]);
    if(!c.rows.length) return {error:"Case not found."};
    const {rows}=await ctx.db.query("SELECT option_type,title,description,estimated_cost,currency,evidence_basis,uncertainty,recommended FROM resolution_options WHERE case_id=$1 ORDER BY recommended DESC,created_at DESC LIMIT 8",[id]);
    return {case_id:id,options:rows,notice:rows.length?"Options reflect the latest saved comparison. Costs and eligibility are unknown unless explicitly supported.":"No comparison has been generated. Use the FixForward case workspace to create one."};
  }
};