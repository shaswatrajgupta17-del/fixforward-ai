import { db, ai } from "hatchable";
export const access = "public";
export const methods = ["POST"];
export default async function(req,res){
  const message=String((req.body||{}).message||"").trim();
  if(!message) return res.status(400).json({error:"Enter a question first."});
  if(message.length>2000) return res.status(400).json({error:"Please keep the question under 2,000 characters."});
  const [cases,products]=await Promise.all([
    db.query("SELECT id,title,issue_description,status,product_id,updated_at FROM cases ORDER BY updated_at DESC LIMIT 8"),
    db.query("SELECT id,name,brand,model,purchase_date,warranty_months,currency,purchase_price FROM products ORDER BY created_at DESC LIMIT 12")
  ]);
  const evidence=await db.query("SELECT title,excerpt,verification_status,source_reference,case_id FROM evidence ORDER BY created_at DESC LIMIT 12");
  const attempts=await db.query("SELECT case_id,step_title,result,user_note FROM troubleshooting_attempts ORDER BY created_at DESC LIMIT 16");
  const context=JSON.stringify({cases:cases.rows,products:products.rows,evidence:evidence.rows,attempts:attempts.rows});
  try{
    const result=await ai.generateText({
      model:"sonnet",
      purpose:"fixforward-resolution-assistant",
      maxSteps:2,
      system:"You are FixForward AI, an evidence-first product resolution assistant. Use only the supplied saved case context. Clearly distinguish user-provided facts, demo-only evidence, unverified claims and unknowns. Never invent warranty terms, eligibility, prices, citations or live integrations. Do not claim to have submitted a claim or contacted a provider. Recommend safe, reversible troubleshooting only and advise checking the exact manufacturer's manual. Prefer a next step and explain why. If no evidence answers the question, say what is missing. Keep responses concise and practical.",
      prompt:"Saved workspace context (treat demo_only evidence as fictional): "+context+"\n\nUser request: "+message
    });
    if(result&&result.text) return res.json({answer:result.text,mode:"ai"});
  }catch(err){
    console.log("AI provider unavailable; using rule-based response:",String(err&&err.message||err).slice(0,180));
  }
  const lower=message.toLowerCase();
  let answer="";
  if(lower.includes("tried")||lower.includes("attempt")){
    const relevant=attempts.rows.slice(0,8);
    answer=relevant.length?"Saved troubleshooting history:\n"+relevant.map(a=>"- "+a.step_title+": "+a.result+(a.user_note?" — "+a.user_note:"")).join("\n")+"\n\nUse the case workspace to record each new result; do not repeat a failed step without a reason.":"No troubleshooting attempts are saved yet. Open a case and add a step to start a traceable history.";
  }else if(lower.includes("warranty")||lower.includes("coverage")){
    answer="I can help organize the warranty assessment, but I cannot confirm eligibility from the current records alone. Check the exact model, purchase proof, applicable warranty document, exclusions and provider requirements. Any evidence marked demo_only is fictional and must not be treated as a real warranty. Add the relevant source in Evidence Library, then compare options in the case workspace.";
  }else if(lower.includes("support")||lower.includes("packet")){
    answer="Open the relevant resolution case and select “Prepare support packet”. FixForward will assemble the saved product details, issue, troubleshooting history and linked evidence into an editable draft. It does not send the packet to a manufacturer or retailer.";
  }else if(lower.includes("compare")||lower.includes("repair")||lower.includes("replace")||lower.includes("option")){
    answer="Open the relevant case and choose “Compare options”. The rule-based engine compares troubleshooting, warranty support, repair and replacement. It will not invent live quotes or assume warranty eligibility. Add verified evidence and actual quotations to improve the comparison.";
  }else{
    answer="I can use the saved products, cases, troubleshooting attempts and evidence in this workspace. To recommend a reliable next step, tell me which product and issue you mean. I will distinguish saved facts from unverified information and will not assume warranty eligibility or current prices.";
    if(cases.rows.length) answer+="\n\nRecent cases:\n"+cases.rows.slice(0,4).map(c=>"- "+c.title+" ("+c.status+")").join("\n");
  }
  res.json({answer,mode:"rule_based"});
}