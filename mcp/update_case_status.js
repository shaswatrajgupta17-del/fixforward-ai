export const access = "member";
export default {
  name: "update_case_status",
  description: "Record a case action or a user-confirmed outcome. A case can only be marked resolved when explicit user confirmation is supplied.",
  inputSchema: {type:"object",required:["case_id","action_type","description"],properties:{case_id:{type:"string"},action_type:{type:"string",enum:["note","option_selected","support_contacted","resolved","still_open","escalated"]},description:{type:"string"},user_confirmed:{type:"boolean",description:"Must be true to record a resolved outcome"}}},
  async handler(args,ctx){
    const id=String(args.case_id||"").trim(),desc=String(args.description||"").trim(),type=String(args.action_type||"");
    if(!/^[0-9a-f-]{36}$/i.test(id)) return {error:"A valid case UUID is required."};
    if(!desc) return {error:"Description is required."};
    const allowed=["note","option_selected","support_contacted","resolved","still_open","escalated"];
    if(!allowed.includes(type)) return {error:"Unsupported action type."};
    const c=await ctx.db.query("SELECT id FROM cases WHERE id=$1",[id]);
    if(!c.rows.length) return {error:"Case not found."};
    if(type==="resolved" && args.user_confirmed!==true) return {error:"User confirmation is required before marking a case resolved."};
    if(type==="resolved"){
      await ctx.db.query("INSERT INTO case_outcomes (case_id,outcome,note,confirmed_by_user) VALUES ($1,'resolved',$2,true)",[id,desc]);
      await ctx.db.query("UPDATE cases SET status='resolved',resolved_at=now(),outcome_note=$1,updated_at=now() WHERE id=$2",[desc,id]);
    } else if(type==="escalated"){
      await ctx.db.query("UPDATE cases SET status='awaiting_support',updated_at=now() WHERE id=$1",[id]);
      await ctx.db.query("INSERT INTO case_outcomes (case_id,outcome,note,confirmed_by_user) VALUES ($1,'escalated',$2,false)",[id,desc]);
    } else if(type==="still_open"){
      await ctx.db.query("UPDATE cases SET status='investigating',updated_at=now() WHERE id=$1",[id]);
      await ctx.db.query("INSERT INTO case_outcomes (case_id,outcome,note,confirmed_by_user) VALUES ($1,'still_open',$2,false)",[id,desc]);
    } else {
      await ctx.db.query("UPDATE cases SET updated_at=now() WHERE id=$1",[id]);
    }
    const r=await ctx.db.query("INSERT INTO case_actions (case_id,action_type,description,status,approved_by_user) VALUES ($1,$2,$3,$4,$5) RETURNING id,created_at",[id,type,desc,type==="resolved"?"confirmed_by_user":"recorded",args.user_confirmed===true]);
    return {ok:true,case_id:id,action:r.rows[0],status:type==="resolved"?"resolved":type==="escalated"?"awaiting_support":type==="still_open"?"investigating":"recorded"};
  }
};