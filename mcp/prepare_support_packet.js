export const access = "member";
export default {
  name: "prepare_support_packet",
  description: "Create and save an editable support-request draft from a resolution case. This tool does not send the packet externally.",
  inputSchema: {type:"object",required:["case_id"],properties:{case_id:{type:"string",description:"UUID of the case"}}},
  async handler(args,ctx){
    const id=String(args.case_id||"").trim();
    if(!/^[0-9a-f-]{36}$/i.test(id)) return {error:"A valid case UUID is required."};
    const c=await ctx.db.query("SELECT * FROM cases WHERE id=$1",[id]);
    if(!c.rows.length) return {error:"Case not found."};
    const x=c.rows[0];
    const [p,a,e]=await Promise.all([
      x.product_id?ctx.db.query("SELECT * FROM products WHERE id=$1",[x.product_id]):Promise.resolve({rows:[]}),
      ctx.db.query("SELECT step_title,instructions,result,user_note FROM troubleshooting_attempts WHERE case_id=$1 ORDER BY created_at",[id]),
      ctx.db.query("SELECT title,excerpt,verification_status,source_reference FROM evidence WHERE case_id=$1 ORDER BY created_at",[id])
    ]);
    const product=p.rows[0]||{};
    const packet=["FIXFORWARD AI — SUPPORT REQUEST DRAFT","Review before sending. Not submitted externally.","","Case: "+x.title,"Case ID: "+x.id,"Status: "+x.status,"","PRODUCT","Name: "+(product.name||"Not provided"),"Model: "+[product.brand,product.model].filter(Boolean).join(" / "),"Retailer: "+(product.retailer||"Not provided"),"Purchase date: "+(product.purchase_date||"Not provided"),"","ISSUE",x.issue_description,"Symptoms: "+(x.symptoms||"Not provided"),"","TROUBLESHOOTING",...(a.rows.length?a.rows.map(z=>"- "+z.step_title+": "+z.result+" — "+z.instructions):["- None recorded."]),"","EVIDENCE",...(e.rows.length?e.rows.map(z=>"- "+z.title+" ["+z.verification_status+"]: "+z.excerpt+" Reference: "+(z.source_reference||"none")):["- No evidence linked."]),"","REQUEST","Please confirm diagnostic steps, applicable coverage and exclusions, required proof, available service options, total cost and turnaround time.","","Warranty eligibility and costs have not been independently confirmed."].join("\n");
    const r=await ctx.db.query("INSERT INTO support_packets (case_id,packet_text) VALUES ($1,$2) RETURNING id,created_at",[id,packet]);
    await ctx.db.query("INSERT INTO case_actions (case_id,action_type,description,status) VALUES ($1,'support_packet_prepared','MCP prepared a support request draft; it was not sent externally.','recorded')",[id]);
    return {packet_id:r.rows[0].id,case_id:id,packet_text:packet,created_at:r.rows[0].created_at,sent:false};
  }
};