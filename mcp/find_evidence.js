export const access = "member";
export default {
  name: "find_evidence",
  description: "Search saved evidence notes for a case using keyword matching and return excerpts with verification status. This does not independently verify a source URL.",
  inputSchema: {type:"object",required:["query"],properties:{query:{type:"string",description:"Keywords to find in saved evidence"},case_id:{type:"string",description:"Optional case UUID"}}},
  async handler(args,ctx){
    const q=String(args.query||"").trim().slice(0,200);
    if(!q) return {error:"Search query is required."};
    const id=args.case_id?String(args.case_id):null;
    const {rows}=await ctx.db.query("SELECT id,case_id,title,source_type,source_reference,excerpt,verification_status,checked_at FROM evidence WHERE ($1::uuid IS NULL OR case_id=$1::uuid) AND (title ILIKE $2 OR excerpt ILIKE $2 OR source_reference ILIKE $2) ORDER BY created_at DESC LIMIT 8",[id,"%"+q+"%"]);
    return {query:q,count:rows.length,results:rows,note:"A matching excerpt is not proof that a warranty claim is eligible. Verify the source and applicability."};
  }
};