import { useState, useCallback, useEffect } from "react";
import jsPDF from "jspdf";

// ─── Smart Inference Rules (pure JS, no AI) ───────────────────────────────────

const INFERENCE_RULES = [
  {
    trigger: "country_of_birth",
    infer: (val, data) => {
      if (!data.country_of_citizenship && val && !val.toLowerCase().includes("united states"))
        return { country_of_citizenship: val };
      return {};
    },
  },
  { trigger: "alien_number",   format: (v) => { const d = v.replace(/\D/g,"").slice(0,9); return d ? "A-"+d : ""; } },
  { trigger: "ssn",            format: (v) => { const d = v.replace(/\D/g,"").slice(0,9); if(d.length<=3)return d; if(d.length<=5)return d.slice(0,3)+"-"+d.slice(3); return d.slice(0,3)+"-"+d.slice(3,5)+"-"+d.slice(5); } },
  { trigger: "phone",          format: (v) => { const d = v.replace(/\D/g,"").slice(0,10); if(d.length<=3)return d; if(d.length<=6)return"("+d.slice(0,3)+") "+d.slice(3); return"("+d.slice(0,3)+") "+d.slice(3,6)+"-"+d.slice(6); } },
  { trigger: "address_state",  format: (v) => v.toUpperCase().slice(0,2) },
  { trigger: "address_zip",    format: (v) => v.replace(/\D/g,"").slice(0,5) },
  { trigger: "i94_number",     format: (v) => v.replace(/\D/g,"").slice(0,11) },
];

function applyRules(fieldId, rawValue, currentData) {
  let formatted = rawValue;
  let inferred  = {};
  for (const rule of INFERENCE_RULES) {
    if (rule.trigger === fieldId) {
      if (rule.format) formatted = rule.format(rawValue);
      if (rule.infer)  inferred  = { ...inferred, ...rule.infer(formatted, currentData) };
    }
  }
  return { formatted, inferred };
}

// ─── All I-90 Eligibility Questions ──────────────────────────────────────────

const ELIGIBILITY_QUESTIONS = [
  { id:"is_lpr",               required:true,  question:"Are you currently a Lawful Permanent Resident (LPR) of the United States?",                                                                  detail:"You must hold LPR status — i.e., have a Green Card — to file Form I-90." },
  { id:"has_had_card",         required:true,  question:"Have you ever been issued a Permanent Resident Card (Form I-551)?",                                                                          detail:"This includes both 10-year (standard) and 2-year (conditional) Green Cards." },
  { id:"in_us",                required:true,  question:"Are you currently physically residing in the United States?",                                                                                detail:"LPRs residing abroad must file through a different consular process." },
  { id:"no_removal_order",     required:true,  question:"Are you NOT currently subject to a final order of removal, deportation, or exclusion?",                                                      detail:"A final removal order generally disqualifies you from filing I-90." },
  { id:"no_proceedings",       required:true,  question:"Are you NOT currently in active removal proceedings before an immigration judge?",                                                            detail:"Pending removal proceedings may affect eligibility. Consult an attorney first." },
  { id:"not_abandoned",        required:true,  question:"Have you NOT abandoned your permanent residency by establishing a primary residence in another country?",                                     detail:"Extended stays abroad or establishing a new home country can constitute abandonment." },
  { id:"not_relinquished",     required:true,  question:"Have you NOT formally relinquished or voluntarily abandoned your LPR status?",                                                               detail:"Signing Form I-407 or declaring abandonment at a port of entry terminates LPR status." },
  { id:"not_citizen",          required:true,  question:"Have you NOT become a U.S. citizen (by naturalization, acquisition, or derivation)?",                                                        detail:"U.S. citizens do not hold or need a Green Card and should not file I-90." },
  { id:"has_valid_reason",     required:true,  question:"Do you have a valid reason for replacing your card, such as expiration, loss, theft, damage, name change, or a card error?",                 detail:"USCIS accepts I-90 only for specific filing reasons. Filing without a valid reason results in denial." },
  { id:"no_criminal_bar",      required:true,  question:"Are you NOT subject to any criminal grounds of inadmissibility that would bar you from obtaining immigration benefits?",                      detail:"Certain convictions can affect eligibility. If unsure, consult an immigration attorney before filing." },
  { id:"no_fraud",             required:true,  question:"Have you NOT previously committed immigration fraud or willful misrepresentation in connection with any immigration benefit?",                 detail:"Prior fraud findings can result in permanent bars to immigration benefits." },
  { id:"biometrics_ok",        required:false, question:"Are you able to appear in person at a USCIS Application Support Center (ASC) for biometrics (fingerprints, photo, signature)?",             detail:"Most I-90 applicants must attend a biometrics appointment. Exceptions exist for those over 79 or with disabilities." },
  { id:"supporting_docs",      required:false, question:"Do you have or can you obtain the necessary supporting documents (prior card, government-issued ID, evidence of name change, etc.)?",        detail:"Required documents vary by filing reason. Your attorney will advise on exactly what is needed." },
];

// ─── Filing Reasons ───────────────────────────────────────────────────────────

const FILING_REASONS = [
  "","1a — My previous card has been lost, stolen, or destroyed","1b — My existing card has been mutilated",
  "1c — My existing card was issued with incorrect info due to a USCIS administrative error",
  "1d — My card was issued but never received","2 — My name or other biographic info has legally changed since the card was issued",
  "3 — My card has been automatically converted to lawful permanent resident status",
  "4 — I have reached my 14th birthday and am registering (conditional/2-year card)",
  "5 — I have reached my 14th birthday and am registering (10-year card)",
  "6 — My 10-year card will expire within 6 months or has already expired",
  "7 — My 2-year conditional card will expire within 6 months or has already expired",
  "8 — I am a permanent resident who has taken up residence in another country",
  "9 — I have a prior edition card (issued before 1989)","10 — I have been automatically converted to LPR status","11 — Other (explain in additional information)",
];

// ─── Form Sections ────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    id:"part1", title:"Part 1 — About You",
    fields:[
      {id:"family_name",            label:"Family Name (Last Name)",                   type:"text",   span:1, required:true,  hint:"Exactly as printed on your current or most recent Green Card."},
      {id:"given_name",             label:"Given Name (First Name)",                   type:"text",   span:1, required:true,  hint:"Your legal first name."},
      {id:"middle_name",            label:"Middle Name",                               type:"text",   span:1, required:false, hint:"Leave blank if none."},
      {id:"other_names",            label:"Other Last Names Used (maiden, alias, etc.)",type:"text",  span:1, required:false, hint:"Include all legal names previously used."},
      {id:"date_of_birth",          label:"Date of Birth",                             type:"date",   span:1, required:true,  hint:"Your date of birth as printed on your Green Card."},
      {id:"sex",                    label:"Sex",                                       type:"select", span:1, required:true,  options:["","Male","Female","Nonbinary / Another Gender"], hint:"As you wish it to appear on the replacement card."},
      {id:"city_of_birth",          label:"City or Town of Birth",                     type:"text",   span:1, required:true,  hint:"The city or town where you were born."},
      {id:"country_of_birth",       label:"Country of Birth",                          type:"text",   span:1, required:true,  hint:"Full country name. Entering this will auto-suggest Country of Citizenship."},
      {id:"country_of_citizenship", label:"Country of Citizenship / Nationality",      type:"text",   span:2, required:true,  hint:"Your current country of citizenship. Auto-suggested from Country of Birth."},
      {id:"alien_number",           label:"Alien Registration Number (A-Number)",      type:"text",   span:1, required:true,  placeholder:"e.g. 123456789", hint:"9-digit number on the back of your Green Card. Auto-formatted as A-XXXXXXXXX."},
      {id:"uscis_account",          label:"USCIS Online Account Number (if any)",      type:"text",   span:1, required:false, hint:"From any USCIS notice. Leave blank if none."},
      {id:"ssn",                    label:"U.S. Social Security Number",               type:"text",   span:1, required:false, placeholder:"e.g. 123456789", hint:"Auto-formatted as XXX-XX-XXXX."},
      {id:"phone",                  label:"Daytime Phone Number",                      type:"text",   span:1, required:true,  placeholder:"e.g. 2125550000", hint:"Auto-formatted as (XXX) XXX-XXXX."},
      {id:"email",                  label:"Email Address",                             type:"email",  span:2, required:false, hint:"USCIS may use this to send electronic notices about your case."},
    ],
  },
  {
    id:"part1b", title:"Part 1 (cont.) — Mailing Address",
    fields:[
      {id:"address_care_of",   label:"In Care Of Name (if applicable)",           type:"text",   span:2, required:false, hint:"If mail should be delivered to another person on your behalf."},
      {id:"address_street",    label:"Street Number and Name",                    type:"text",   span:2, required:true,  placeholder:"e.g. 123 Main Street", hint:"Do not include apartment or suite number here."},
      {id:"address_apt",       label:"Apt / Ste / Flr",                           type:"text",   span:1, required:false},
      {id:"address_city",      label:"City or Town",                              type:"text",   span:1, required:true},
      {id:"address_state",     label:"State (2-letter)",                          type:"text",   span:1, required:true,  placeholder:"e.g. NY", hint:"Auto-uppercased 2-letter code."},
      {id:"address_zip",       label:"ZIP Code",                                  type:"text",   span:1, required:true,  placeholder:"e.g. 10001", hint:"5-digit ZIP. Digits only, auto-formatted."},
      {id:"address_province",  label:"Province (non-U.S. only)",                  type:"text",   span:1, required:false},
      {id:"address_postal",    label:"Postal Code (non-U.S. only)",               type:"text",   span:1, required:false},
      {id:"address_country",   label:"Country (if outside U.S.)",                 type:"text",   span:1, required:false},
    ],
  },
  {
    id:"part1c", title:"Part 1 (cont.) — Physical Address",
    fields:[
      {id:"physical_same",   label:"Physical address same as mailing address?",  type:"select", span:2, required:true,  options:["","Yes — same as above","No — enter below"], hint:"Select No if you live somewhere different from your mailing address."},
      {id:"physical_street", label:"Street Number and Name",                     type:"text",   span:2, required:false, conditionalOn:{field:"physical_same",value:"No — enter below"}},
      {id:"physical_apt",    label:"Apt / Ste / Flr",                            type:"text",   span:1, required:false, conditionalOn:{field:"physical_same",value:"No — enter below"}},
      {id:"physical_city",   label:"City or Town",                               type:"text",   span:1, required:false, conditionalOn:{field:"physical_same",value:"No — enter below"}},
      {id:"physical_state",  label:"State",                                      type:"text",   span:1, required:false, conditionalOn:{field:"physical_same",value:"No — enter below"}},
      {id:"physical_zip",    label:"ZIP Code",                                   type:"text",   span:1, required:false, conditionalOn:{field:"physical_same",value:"No — enter below"}},
    ],
  },
  {
    id:"part2", title:"Part 2 — Reason for Filing",
    fields:[
      {id:"filing_reason",      label:"Reason for Filing",                            type:"select",   span:2, required:true,  options:FILING_REASONS, hint:"Select the reason that most closely matches your situation. This determines required supporting documents."},
      {id:"card_expiry_date",   label:"Expiration Date on Current Card",              type:"date",     span:1, required:false, hint:"The expiration date printed on the front of your card."},
      {id:"name_change_reason", label:"Reason for Name Change",                       type:"text",     span:1, required:false, conditionalOn:{field:"filing_reason",startsWith:"2 —"}, hint:"e.g. Marriage, court order, religious change."},
      {id:"additional_info",    label:"Additional Information / Explanation",         type:"textarea", span:2, required:false, hint:"Use this to explain any unusual circumstances or provide context."},
    ],
  },
  {
    id:"part3", title:"Part 3 — Processing Information",
    fields:[
      {id:"last_entry_date",    label:"Date of Last Entry into the U.S.",                    type:"date", span:1, required:true,  hint:"Most recent date you entered the United States."},
      {id:"last_entry_place",   label:"Place of Last Entry",                                 type:"text", span:1, required:true,  placeholder:"e.g. JFK Airport, New York", hint:"Port of entry city and state, or airport name."},
      {id:"i94_number",         label:"I-94 Arrival/Departure Record Number",                type:"text", span:1, required:false, placeholder:"11-digit number", hint:"Look up at cbp.gov/i94 if needed."},
      {id:"immigration_status", label:"Immigration Status at Last Entry",                    type:"text", span:1, required:true,  placeholder:"e.g. LPR, Parolee, Refugee", hint:"Your status as it appeared on your travel documents at entry."},
      {id:"visa_number",        label:"Nonimmigrant Visa Number (if applicable)",            type:"text", span:1, required:false, hint:"From your most recent U.S. visa stamp, if any."},
      {id:"visa_consular_post", label:"Consular Post Where Visa Was Issued",                 type:"text", span:1, required:false, placeholder:"e.g. U.S. Consulate Mumbai"},
      {id:"visa_expiry",        label:"Visa Expiration Date",                                type:"date", span:1, required:false},
      {id:"passport_number",    label:"Passport Number",                                     type:"text", span:1, required:false, hint:"Passport used to enter the U.S."},
      {id:"passport_country",   label:"Country of Passport Issuance",                        type:"text", span:1, required:false},
      {id:"passport_expiry",    label:"Passport Expiration Date",                            type:"date", span:1, required:false},
    ],
  },
  {
    id:"part4", title:"Part 4 — Accommodations",
    fields:[
      {id:"disability_accom",  label:"Do you require an accommodation for a disability or impairment?", type:"select",   span:2, required:true, options:["","No","Yes — describe below"], hint:"USCIS provides accommodations at biometrics appointments (ASL, wheelchair, etc.)."},
      {id:"disability_desc",   label:"Describe the accommodation needed",                                type:"textarea", span:2, required:false, conditionalOn:{field:"disability_accom",value:"Yes — describe below"}},
    ],
  },
  {
    id:"part5", title:"Part 5 — Statement & Signature",
    fields:[
      {id:"interpreter_used",    label:"Did someone interpret this form for you?",   type:"select", span:2, required:true, options:["","No — I read this form in English","Yes — an interpreter assisted me"]},
      {id:"interpreter_name",    label:"Interpreter's Full Name",                    type:"text",   span:1, required:false, conditionalOn:{field:"interpreter_used",value:"Yes — an interpreter assisted me"}},
      {id:"interpreter_lang",    label:"Language Interpreted",                       type:"text",   span:1, required:false, conditionalOn:{field:"interpreter_used",value:"Yes — an interpreter assisted me"}},
      {id:"preparer_used",       label:"Did an attorney or preparer assist you?",    type:"select", span:2, required:true, options:["","No — I prepared this form myself","Yes — a preparer assisted me"]},
      {id:"preparer_name",       label:"Preparer's Full Name",                       type:"text",   span:1, required:false, conditionalOn:{field:"preparer_used",value:"Yes — a preparer assisted me"}},
      {id:"preparer_firm",       label:"Preparer's Firm / Organization",             type:"text",   span:1, required:false, conditionalOn:{field:"preparer_used",value:"Yes — a preparer assisted me"}},
      {id:"sign_date",           label:"Today's Date",                               type:"date",   span:1, required:true,  hint:"Date you are certifying the accuracy of this application."},
    ],
  },
];

const ALL_FIELDS = SECTIONS.flatMap(s => s.fields);

// ─── Colors ───────────────────────────────────────────────────────────────────

const C = {
  navy:"#0d2444", navyMid:"#1e3d6e", gold:"#c8942a", goldLight:"#fdf3e3", goldBorder:"#e8d5a0",
  white:"#ffffff", offWhite:"#fafaf8", border:"#e5dfd6", borderLight:"#f0ece6",
  textSecondary:"#5a6478", textMuted:"#9aa5b8",
  success:"#2d7a4f", successLight:"#e6f4ec", successBorder:"#a7d7bc",
  danger:"#dc2626", dangerLight:"#fef2f2", dangerBorder:"#fca5a5",
  inferred:"#eef4ff", inferredBorder:"#93b4e8", inferredText:"#1a3a7a",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isVisible(field, formData) {
  if (!field.conditionalOn) return true;
  const {field:dep, value, startsWith} = field.conditionalOn;
  const v = formData[dep] || "";
  if (value)      return v === value;
  if (startsWith) return v.startsWith(startsWith);
  return true;
}

function sectionStats(section, formData) {
  const vis  = section.fields.filter(f => isVisible(f, formData));
  const req  = vis.filter(f => f.required);
  const done = req.filter(f => formData[f.id]?.toString().trim());
  return {total: req.length, filled: done.length};
}

// ─── PDF ──────────────────────────────────────────────────────────────────────

function generatePDF(formData) {
  const doc = new jsPDF({unit:"pt", format:"letter"});
  const W=612, M=52;
  let y=0;
  const navy=[13,36,68], gold=[200,148,42], lg=[225,218,210], mg=[90,100,120];
  const tx=(s,x,yy,sz,clr,st="normal")=>{doc.setFontSize(sz);doc.setTextColor(...clr);doc.setFont("helvetica",st);doc.text(s||"—",x,yy);};
  const ln=(x1,y1,x2,y2,c=lg,w=0.4)=>{doc.setDrawColor(...c);doc.setLineWidth(w);doc.line(x1,y1,x2,y2);};
  const bx=(x,yy,w,h,c)=>{doc.setFillColor(...c);doc.rect(x,yy,w,h,"F");};
  const chk=(n=60)=>{if(y+n>750){doc.addPage();y=M;}};
  bx(0,0,W,58,navy);
  tx("ApplyUS",M,26,24,gold,"bold");
  tx("USCIS Form I-90 — Application to Replace Permanent Resident Card",M,44,8.5,[200,210,230]);
  const today=new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});
  tx("Draft: "+today,W-M-120,44,8,[160,175,200]);
  bx(0,58,W,24,[245,241,234]);ln(0,58,W,58);
  tx("Reason: "+(formData.filing_reason||"Not selected"),M,74,8,mg);
  tx("A-Number: "+(formData.alien_number||"—"),W-M-120,74,8,mg);
  y=102;
  const head=(t)=>{chk(40);bx(M-6,y-14,W-M*2+12,24,[232,238,252]);ln(M-6,y-14,M-6,y+10,navy,3);tx(t,M+6,y+2,10,navy,"bold");y+=22;};
  const frow=(l,v,full=false)=>{chk(36);const rw=full?W-M*2:(W-M*2-10)/2;tx(l.toUpperCase(),M,y,6.5,mg);y+=12;bx(M,y,rw,18,v?[247,251,248]:[252,252,252]);ln(M,y,M+rw,y);ln(M,y+18,M+rw,y+18);if(v)tx(v,M+6,y+12,9.5,navy);else tx("Not provided",M+6,y+12,8.5,[185,185,185],"italic");y+=24;};
  const fpair=(l1,v1,l2,v2)=>{chk(36);const hw=(W-M*2-10)/2,rx=M+hw+10;tx(l1.toUpperCase(),M,y,6.5,mg);tx(l2.toUpperCase(),rx,y,6.5,mg);y+=12;[[M,v1],[rx,v2]].forEach(([x,v])=>{bx(x,y,hw,18,v?[247,251,248]:[252,252,252]);ln(x,y,x+hw,y);ln(x,y+18,x+hw,y+18);if(v)tx(v,x+6,y+12,9.5,navy);else tx("Not provided",x+6,y+12,8.5,[185,185,185],"italic");});y+=24;};
  const gap=(n=12)=>{y+=n;};
  head("Part 1 — Information About You");
  fpair("Family Name",formData.family_name,"Given Name",formData.given_name);
  fpair("Middle Name",formData.middle_name,"Other Names Used",formData.other_names);
  fpair("Date of Birth",formData.date_of_birth,"Sex",formData.sex);
  fpair("City of Birth",formData.city_of_birth,"Country of Birth",formData.country_of_birth);
  frow("Country of Citizenship / Nationality",formData.country_of_citizenship,true);
  fpair("A-Number",formData.alien_number,"SSN",formData.ssn);
  fpair("USCIS Account Number",formData.uscis_account,"Phone",formData.phone);
  frow("Email",formData.email,true);gap();
  head("Part 1 (cont.) — Mailing Address");
  frow("Street",formData.address_street,true);
  fpair("Apt / Ste / Flr",formData.address_apt,"City",formData.address_city);
  fpair("State",formData.address_state,"ZIP Code",formData.address_zip);gap();
  if(formData.physical_same==="No — enter below"){head("Part 1 (cont.) — Physical Address");frow("Street",formData.physical_street,true);fpair("City",formData.physical_city,"State / ZIP",[formData.physical_state,formData.physical_zip].filter(Boolean).join(" "));gap();}
  head("Part 2 — Application Type");
  frow("Reason for Filing",formData.filing_reason,true);
  if(formData.name_change_reason)frow("Reason for Name Change",formData.name_change_reason,true);
  if(formData.additional_info)frow("Additional Information",formData.additional_info,true);gap();
  head("Part 3 — Processing Information");
  fpair("Date of Last Entry",formData.last_entry_date,"Place of Last Entry",formData.last_entry_place);
  fpair("I-94 Number",formData.i94_number,"Immigration Status at Entry",formData.immigration_status);
  fpair("Passport Number",formData.passport_number,"Passport Country",formData.passport_country);
  fpair("Passport Expiry",formData.passport_expiry,"Visa Number",formData.visa_number);gap();
  head("Part 4 — Accommodations");
  frow("Accommodation Request",formData.disability_accom,true);
  if(formData.disability_desc)frow("Description",formData.disability_desc,true);gap();
  head("Part 5 — Statement & Signature");
  fpair("Interpreter Used?",formData.interpreter_used,"Preparer Used?",formData.preparer_used);
  frow("Date Signed",formData.sign_date,true);gap(20);
  chk(80);bx(M,y,W-M*2,60,[249,246,242]);ln(M,y,W-M*2+M,y);ln(M,y+60,W-M*2+M,y+60);
  tx("Applicant Signature",M+10,y+18,8,mg);ln(M+10,y+38,M+200,y+38);
  tx("Date",M+220,y+18,8,mg);ln(M+220,y+38,M+360,y+38);y+=72;
  ln(M,748,W-M,748,lg);
  const pages=doc.getNumberOfPages();
  for(let i=1;i<=pages;i++){doc.setPage(i);tx("DRAFT — For Attorney Review Only. Do not submit directly to USCIS.",M,760,7,[160,160,160],"italic");tx("ApplyUS — applyus.com",W-M-90,760,7,mg);}
  const name=[formData.given_name,formData.family_name].filter(Boolean).join("_")||"applicant";
  doc.save("I-90_"+name+"_draft.pdf");
}

// ─── FormField Component ──────────────────────────────────────────────────────

function FormField({field, value, inferredVal, onChange, onAccept}) {
  const [focused, setFocused]   = useState(false);
  const [showHint, setShowHint] = useState(false);
  const hasInferred = !!inferredVal && !value;
  const base = {
    width:"100%", padding:"10px 14px", fontSize:"14px", outline:"none",
    border:`1.5px solid ${focused ? C.navy : hasInferred ? C.inferredBorder : C.border}`,
    borderRadius:"8px", fontFamily:"'Plus Jakarta Sans', sans-serif", color:C.navy,
    background: hasInferred ? C.inferred : C.white, transition:"border-color 0.15s", boxSizing:"border-box",
  };
  const el = field.type==="select"
    ? <select value={value||""} onChange={e=>onChange(e.target.value)} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} style={{...base,cursor:"pointer"}}>{field.options.map((o,i)=><option key={i} value={o}>{o||"Select…"}</option>)}</select>
    : field.type==="textarea"
    ? <textarea rows={3} value={value||""} onChange={e=>onChange(e.target.value)} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} placeholder={field.placeholder||""} style={{...base,resize:"vertical",lineHeight:"1.6"}}/>
    : <input type={field.type} value={value||""} placeholder={field.placeholder||""} onChange={e=>onChange(e.target.value)} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} onKeyDown={e=>{if(e.key==="Tab"&&hasInferred){e.preventDefault();onAccept(inferredVal);}}} style={base}/>;
  return (
    <div style={{position:"relative"}}>
      <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"6px"}}>
        <label style={{fontSize:"11px",fontWeight:"700",color:C.textSecondary,textTransform:"uppercase",letterSpacing:"0.6px"}}>
          {field.label}{field.required&&<span style={{color:C.gold,marginLeft:"3px"}}>*</span>}
        </label>
        {field.hint&&<span onMouseEnter={()=>setShowHint(true)} onMouseLeave={()=>setShowHint(false)} style={{width:"15px",height:"15px",borderRadius:"50%",background:C.borderLight,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"help",fontSize:"9px",color:C.textSecondary,fontWeight:"700",flexShrink:0}}>?</span>}
      </div>
      {showHint&&<div style={{position:"absolute",top:"22px",left:"0",zIndex:20,background:C.navy,color:C.white,fontSize:"12px",padding:"9px 13px",borderRadius:"8px",maxWidth:"300px",lineHeight:"1.55",pointerEvents:"none"}}>{field.hint}</div>}
      {el}
      {hasInferred&&(
        <div style={{marginTop:"6px",display:"flex",alignItems:"center",gap:"8px"}}>
          <span style={{fontSize:"11px",color:C.inferredText}}>Suggested: <strong>{inferredVal}</strong></span>
          <button onClick={()=>onAccept(inferredVal)} style={{background:C.navy,color:C.white,border:"none",padding:"2px 10px",borderRadius:"4px",fontSize:"11px",fontWeight:"700",cursor:"pointer",fontFamily:"'Plus Jakarta Sans', sans-serif"}}>Accept ↵</button>
          <span style={{fontSize:"10px",color:C.textMuted}}>or Tab</span>
        </div>
      )}
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({formData, active, onJump}) {
  return (
    <div style={{width:"210px",flexShrink:0}}>
      <div style={{position:"sticky",top:"78px"}}>
        <div style={{fontSize:"10px",fontWeight:"700",color:C.textMuted,textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:"10px"}}>Sections</div>
        {SECTIONS.map((s,i)=>{
          const {total,filled}=sectionStats(s,formData);
          const done=total>0&&filled===total, act=active===i;
          return (
            <button key={s.id} onClick={()=>onJump(i)} style={{width:"100%",textAlign:"left",background:act?C.navy:"transparent",border:`1px solid ${act?C.navy:done?C.successBorder:C.border}`,borderRadius:"8px",padding:"10px 12px",marginBottom:"6px",cursor:"pointer",fontFamily:"'Plus Jakarta Sans', sans-serif",transition:"all 0.15s"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:"12px",fontWeight:"600",color:act?C.white:done?C.success:C.navy,lineHeight:"1.3"}}>{s.title.split("—")[0].trim()}</span>
                <span style={{fontSize:"10px",fontWeight:"700",color:act?"rgba(255,255,255,0.5)":done?C.success:C.textMuted}}>{done?"✓":total>0?`${filled}/${total}`:""}</span>
              </div>
              {total>0&&<div style={{marginTop:"6px",height:"3px",background:act?"rgba(255,255,255,0.15)":C.borderLight,borderRadius:"2px"}}><div style={{height:"100%",width:`${Math.round((filled/total)*100)}%`,background:act?C.gold:done?C.success:C.gold,borderRadius:"2px",transition:"width 0.3s"}}/></div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Eligibility Screen ───────────────────────────────────────────────────────

function EligibilityScreen({onPass, onFail}) {
  const [answers, setAnswers] = useState({});
  const total    = ELIGIBILITY_QUESTIONS.length;
  const answered = Object.keys(answers).length;
  const failedQ  = ELIGIBILITY_QUESTIONS.filter(q=>q.required&&answers[q.id]===false);
  const allDone  = answered === total;
  const canPass  = allDone && failedQ.length === 0;

  return (
    <div style={{maxWidth:"700px",margin:"0 auto"}}>
      <div style={{textAlign:"center",marginBottom:"32px"}}>
        <div style={{fontSize:"11px",fontWeight:"700",color:C.gold,letterSpacing:"0.8px",textTransform:"uppercase",marginBottom:"10px"}}>Step 1 of 2</div>
        <h2 style={{fontFamily:"'Playfair Display', serif",fontSize:"28px",color:C.navy,marginBottom:"12px"}}>I-90 Eligibility Check</h2>
        <p style={{color:C.textSecondary,fontSize:"14px",lineHeight:"1.65",maxWidth:"500px",margin:"0 auto"}}>
          These are the official USCIS eligibility requirements for Form I-90. Answer every question honestly before proceeding to the application.
        </p>
      </div>

      <div style={{background:C.white,borderRadius:"12px",border:`1px solid ${C.border}`,padding:"6px 0",marginBottom:"24px"}}>
        {ELIGIBILITY_QUESTIONS.map((q,i)=>{
          const ans=answers[q.id], fail=q.required&&ans===false, pass=ans===true;
          return (
            <div key={q.id} style={{padding:"18px 24px",borderBottom:i<ELIGIBILITY_QUESTIONS.length-1?`1px solid ${C.borderLight}`:"none",background:fail?C.dangerLight:pass?C.successLight:"transparent",transition:"background 0.2s"}}>
              <div style={{display:"flex",gap:"16px",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:"10px",fontWeight:"700",color:C.textMuted,letterSpacing:"0.5px",marginBottom:"4px"}}>
                    {i+1}. {!q.required&&"OPTIONAL — "}{q.required?"REQUIRED":""}
                  </div>
                  <p style={{color:C.navy,fontSize:"14px",fontWeight:"500",lineHeight:"1.55",marginBottom:q.detail?"6px":"0"}}>{q.question}</p>
                  {q.detail&&<p style={{color:C.textSecondary,fontSize:"12px",lineHeight:"1.5"}}>{q.detail}</p>}
                  {fail&&<p style={{color:"#b91c1c",fontSize:"12px",marginTop:"8px",fontWeight:"600"}}>⚠ This answer may disqualify you from filing I-90. Please consult an attorney.</p>}
                </div>
                <div style={{display:"flex",gap:"8px",flexShrink:0,paddingTop:"2px"}}>
                  {[true,false].map(val=>(
                    <button key={String(val)} onClick={()=>setAnswers(p=>({...p,[q.id]:val}))} style={{padding:"7px 16px",borderRadius:"7px",fontSize:"13px",fontWeight:"600",cursor:"pointer",border:"1.5px solid",fontFamily:"'Plus Jakarta Sans', sans-serif",transition:"all 0.15s",background:ans===val?(val?C.success:C.danger):C.white,color:ans===val?C.white:C.textSecondary,borderColor:ans===val?(val?C.success:C.danger):C.border}}>
                      {val?"Yes":"No"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:"13px",color:C.textMuted}}>{answered} / {total} answered</div>
        <div style={{display:"flex",gap:"12px"}}>
          {failedQ.length>0&&(
            <button onClick={onFail} style={{background:"transparent",color:C.textSecondary,border:`1px solid ${C.border}`,padding:"11px 22px",borderRadius:"8px",fontSize:"14px",fontWeight:"500",cursor:"pointer",fontFamily:"'Plus Jakarta Sans', sans-serif"}}>
              Schedule Consultation
            </button>
          )}
          <button onClick={onPass} disabled={!canPass} style={{background:canPass?C.gold:C.borderLight,color:canPass?C.white:C.textMuted,border:"none",padding:"12px 28px",borderRadius:"8px",fontSize:"14px",fontWeight:"700",cursor:canPass?"pointer":"not-allowed",fontFamily:"'Plus Jakarta Sans', sans-serif",transition:"all 0.2s"}}>
            {!allDone ? `Answer All ${total} Questions` : canPass ? "I'm Eligible — Start Form →" : "Not Eligible — See Consultation"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function I90SmartForm({onClose}) {
  const [screen,  setScreen]  = useState("eligibility");
  const [formData,setFormData]= useState({});
  const [inferred,setInferred]= useState({});
  const [section, setSection] = useState(0);

  useEffect(()=>{
    if(!document.querySelector("#applyus-fonts")){
      const l=document.createElement("link");l.id="applyus-fonts";l.rel="stylesheet";
      l.href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap";
      document.head.appendChild(l);
    }
  },[]);

  const handleChange = useCallback((fieldId, rawValue) => {
    const {formatted, inferred:newInf} = applyRules(fieldId, rawValue, formData);
    setFormData(prev=>({...prev,[fieldId]:formatted}));
    setInferred(prev=>{
      const n={...prev};
      delete n[fieldId]; // clear suggestion once user types
      return Object.keys(newInf).length>0 ? {...n,...newInf} : n;
    });
  },[formData]);

  const handleAccept = useCallback((fieldId, val) => {
    setFormData(prev=>({...prev,[fieldId]:val}));
    setInferred(prev=>{const n={...prev};delete n[fieldId];return n;});
  },[]);

  const totalReq  = ALL_FIELDS.filter(f=>f.required&&isVisible(f,formData)).length;
  const totalDone = ALL_FIELDS.filter(f=>f.required&&isVisible(f,formData)&&formData[f.id]?.toString().trim()).length;
  const pct       = totalReq>0 ? Math.round((totalDone/totalReq)*100) : 0;

  if(screen==="ineligible") return (
    <div style={{fontFamily:"'Plus Jakarta Sans', sans-serif",background:C.offWhite,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"48px 2rem"}}>
      <div style={{background:C.white,borderRadius:"16px",border:`1px solid ${C.border}`,padding:"48px",maxWidth:"500px",textAlign:"center"}}>
        <div style={{fontSize:"44px",marginBottom:"20px"}}>⚖️</div>
        <h2 style={{fontFamily:"'Playfair Display', serif",fontSize:"24px",color:C.navy,marginBottom:"14px"}}>Let's Talk First</h2>
        <p style={{color:C.textSecondary,fontSize:"14px",lineHeight:"1.7",marginBottom:"28px"}}>Based on your answers, there may be additional considerations before filing I-90. Our attorneys can review your specific situation and advise on the best path forward at no charge.</p>
        <button style={{background:C.gold,color:C.white,border:"none",padding:"14px 28px",borderRadius:"8px",fontSize:"15px",fontWeight:"700",cursor:"pointer",fontFamily:"'Plus Jakarta Sans', sans-serif",marginBottom:"12px",width:"100%"}}>Schedule Free Consultation</button>
        <button onClick={()=>setScreen("eligibility")} style={{background:"transparent",color:C.textSecondary,border:`1px solid ${C.border}`,padding:"12px 28px",borderRadius:"8px",fontSize:"14px",fontWeight:"500",cursor:"pointer",fontFamily:"'Plus Jakarta Sans', sans-serif",width:"100%"}}>← Review My Answers</button>
      </div>
    </div>
  );

  return (
    <div style={{fontFamily:"'Plus Jakarta Sans', sans-serif",background:C.offWhite,minHeight:"100vh"}}>
      {/* Top bar */}
      <div style={{background:C.navy,padding:"0 2.5rem",height:"64px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
          {onClose&&<button onClick={onClose} style={{background:"rgba(255,255,255,0.08)",border:"none",color:"rgba(255,255,255,0.6)",borderRadius:"6px",padding:"6px 12px",fontSize:"13px",cursor:"pointer",fontFamily:"inherit"}}>← Back</button>}
          <span style={{fontFamily:"'Playfair Display', serif",fontWeight:"700",fontSize:"22px",color:C.white}}>Apply</span>
          <span style={{fontFamily:"'Playfair Display', serif",fontWeight:"700",fontSize:"22px",color:C.gold,marginLeft:"-8px"}}>US</span>
          <span style={{color:"rgba(255,255,255,0.2)",margin:"0 6px"}}>|</span>
          <span style={{color:"rgba(255,255,255,0.55)",fontSize:"13px"}}>Form I-90 — Green Card Renewal / Replacement</span>
        </div>
        {screen==="form"&&(
          <div style={{display:"flex",alignItems:"center",gap:"16px"}}>
            <div>
              <div style={{fontSize:"11px",color:"rgba(255,255,255,0.4)",marginBottom:"4px",textAlign:"right"}}>{pct}% complete — {totalDone}/{totalReq} required fields</div>
              <div style={{width:"150px",height:"4px",background:"rgba(255,255,255,0.12)",borderRadius:"2px"}}>
                <div style={{height:"100%",width:`${pct}%`,background:pct===100?C.success:C.gold,borderRadius:"2px",transition:"width 0.3s"}}/>
              </div>
            </div>
            <button onClick={()=>generatePDF(formData)} disabled={pct<5} style={{background:pct>=5?C.gold:"rgba(255,255,255,0.1)",color:pct>=5?C.white:"rgba(255,255,255,0.3)",border:"none",padding:"9px 20px",borderRadius:"7px",fontSize:"13px",fontWeight:"700",cursor:pct>=5?"pointer":"not-allowed",fontFamily:"inherit"}}>
              ⬇ Download Draft PDF
            </button>
          </div>
        )}
      </div>

      <div style={{maxWidth:screen==="form"?"1080px":"760px",margin:"0 auto",padding:"44px 2.5rem 80px"}}>
        {screen==="eligibility"&&<EligibilityScreen onPass={()=>setScreen("form")} onFail={()=>setScreen("ineligible")}/>}

        {screen==="form"&&(
          <div style={{display:"flex",gap:"28px",alignItems:"flex-start"}}>
            <Sidebar formData={formData} active={section} onJump={setSection}/>

            <div style={{flex:1}}>
              {SECTIONS.map((sec,sIdx)=>(
                <div key={sec.id} style={{display:section===sIdx?"block":"none"}}>
                  <div style={{background:C.white,borderRadius:"14px",border:`1px solid ${C.border}`,overflow:"hidden",marginBottom:"16px"}}>
                    <div style={{background:C.navy,padding:"18px 28px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                        <div style={{width:"4px",height:"20px",background:C.gold,borderRadius:"2px"}}/>
                        <h2 style={{fontFamily:"'Playfair Display', serif",fontSize:"17px",color:C.white}}>{sec.title}</h2>
                      </div>
                      <span style={{fontSize:"11px",color:"rgba(255,255,255,0.35)"}}>{sIdx+1} / {SECTIONS.length}</span>
                    </div>
                    <div style={{padding:"28px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"22px"}}>
                      {sec.fields.filter(f=>isVisible(f,formData)).map(field=>(
                        <div key={field.id} style={{gridColumn:field.span===2?"span 2":"span 1"}}>
                          <FormField field={field} value={formData[field.id]||""} inferredVal={inferred[field.id]} onChange={v=>handleChange(field.id,v)} onAccept={v=>handleAccept(field.id,v)}/>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{display:"flex",justifyContent:"space-between"}}>
                    <button onClick={()=>setSection(s=>Math.max(0,s-1))} disabled={section===0} style={{background:"transparent",color:section===0?C.textMuted:C.textSecondary,border:`1px solid ${section===0?C.borderLight:C.border}`,padding:"11px 22px",borderRadius:"8px",fontSize:"14px",fontWeight:"500",cursor:section===0?"not-allowed":"pointer",fontFamily:"'Plus Jakarta Sans', sans-serif"}}>← Previous</button>
                    {section<SECTIONS.length-1
                      ? <button onClick={()=>setSection(s=>s+1)} style={{background:C.gold,color:C.white,border:"none",padding:"12px 28px",borderRadius:"8px",fontSize:"14px",fontWeight:"700",cursor:"pointer",fontFamily:"'Plus Jakarta Sans', sans-serif"}}>Next Section →</button>
                      : <button onClick={()=>generatePDF(formData)} style={{background:C.navy,color:C.white,border:"none",padding:"12px 28px",borderRadius:"8px",fontSize:"14px",fontWeight:"700",cursor:"pointer",fontFamily:"'Plus Jakarta Sans', sans-serif"}}>⬇ Download Completed I-90 PDF</button>
                    }
                  </div>
                </div>
              ))}

              <div style={{background:C.goldLight,border:`1px solid ${C.goldBorder}`,borderRadius:"10px",padding:"16px 22px",marginTop:"20px"}}>
                <p style={{fontSize:"12px",color:"#7a5810",lineHeight:"1.7"}}><strong>Attorney Review:</strong> The PDF generated is a draft for attorney review only. Your ApplyUS attorney will verify all information, confirm required supporting documents, and file on your behalf. Do not submit this draft directly to USCIS.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
