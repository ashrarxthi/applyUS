import { useState, useEffect } from "react";
import { PDFDocument } from "pdf-lib";

// ─────────────────────────────────────────────────────────────────────────────
// ApplyUS — I-90 Guided Application
// One question at a time. Smart branching. Fills the official USCIS PDF.
// Place the official i-90.pdf in your /public folder.
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  navy:"#0d2444", gold:"#c8942a", goldLight:"#fdf3e3", goldBorder:"#e8d5a0",
  white:"#ffffff", offWhite:"#fafaf8", border:"#e5dfd6", borderLight:"#f0ece6",
  textSecondary:"#5a6478", textMuted:"#9aa5b8",
  success:"#2d7a4f", successLight:"#e6f4ec", successBorder:"#a7d7bc",
  danger:"#dc2626", dangerLight:"#fef2f2", dangerBorder:"#fca5a5",
};

// ─── Question Definitions ─────────────────────────────────────────────────────
// type: radio | text | date | select | yesno
// skip: (answers) => bool — if true, skip this question
// options: for radio/select

const QUESTIONS = [

  // ── Eligibility ──────────────────────────────────────────────────────────────
  {
    id: "card_type",
    section: "Eligibility",
    question: "What type of Green Card do you currently have?",
    type: "radio",
    options: [
      { value: "10yr",        label: "I am a Permanent Resident (10-year Green Card)" },
      { value: "2yr",         label: "I am a Conditional Permanent Resident (2-year Green Card)" },
      { value: "never",       label: "I have never had a Green Card" },
    ],
  },
  {
    id: "ineligible_never",
    section: "Eligibility",
    question: "Unfortunately, Form I-90 is only for people who already have or have had a Green Card. You may need to apply for an immigrant visa or adjustment of status instead.",
    type: "info",
    isBlocking: true,
    skip: (a) => a.card_type !== "never",
  },
  {
    id: "in_us",
    section: "Eligibility",
    question: "Are you currently living in the United States?",
    type: "yesno",
    skip: (a) => a.card_type === "never",
  },
  {
    id: "ineligible_abroad",
    section: "Eligibility",
    question: "If you live outside the U.S., you generally cannot file I-90 from abroad. You may need to contact the nearest U.S. embassy or consulate. We recommend scheduling a consultation with an attorney.",
    type: "info",
    isBlocking: true,
    skip: (a) => a.in_us !== "no",
  },
  {
    id: "filing_reason",
    section: "Eligibility",
    question: "What is your reason for replacing your Green Card?",
    type: "radio",
    skip: (a) => a.card_type === "never" || a.in_us === "no",
    options: [
      { value: "2f",  label: "My card has expired or will expire within 6 months" },
      { value: "2a",  label: "My card was lost, stolen, or destroyed" },
      { value: "2c",  label: "My card has been mutilated or damaged" },
      { value: "2b",  label: "My card was issued but I never received it" },
      { value: "2e",  label: "My name or other personal information has legally changed" },
      { value: "2d",  label: "My card has incorrect information due to a USCIS error" },
      { value: "2g1", label: "I recently turned 14 years old (card expires after my 16th birthday)" },
      { value: "2g2", label: "I recently turned 14 years old (card expires before my 16th birthday)" },
      { value: "2i",  label: "I was automatically converted to permanent resident status" },
      { value: "2j",  label: "I have an older edition card (issued before 1989)" },
      { value: "other", label: "Other reason not listed above" },
    ],
  },

  // ── Personal Information ──────────────────────────────────────────────────────
  {
    id: "family_name",
    section: "Your Information",
    question: "What is your last name (family name)?",
    hint: "Enter your name exactly as it appears on your current Green Card.",
    type: "text",
    skip: (a) => !a.filing_reason || a.card_type === "never",
  },
  {
    id: "given_name",
    section: "Your Information",
    question: "What is your first name (given name)?",
    type: "text",
    skip: (a) => !a.filing_reason,
  },
  {
    id: "middle_name",
    section: "Your Information",
    question: "What is your middle name?",
    hint: "Leave blank if you don't have one.",
    type: "text",
    optional: true,
    skip: (a) => !a.filing_reason,
  },
  {
    id: "name_changed",
    section: "Your Information",
    question: "Has your name legally changed since your Green Card was issued?",
    type: "yesno",
    skip: (a) => a.filing_reason !== "2e",
  },
  {
    id: "new_family_name",
    section: "Your Information",
    question: "What is your new last name (as you want it to appear on the card)?",
    type: "text",
    skip: (a) => a.name_changed !== "yes",
  },
  {
    id: "new_given_name",
    section: "Your Information",
    question: "What is your new first name?",
    type: "text",
    skip: (a) => a.name_changed !== "yes",
  },
  {
    id: "alien_number",
    section: "Your Information",
    question: "What is your Alien Registration Number (A-Number)?",
    hint: "This is the 9-digit number on the back of your Green Card, starting with 'A'. For example: A-123456789",
    type: "text",
    format: (v) => { const d = v.replace(/\D/g,"").slice(0,9); return d ? "A-"+d : v; },
    skip: (a) => !a.given_name,
  },
  {
    id: "uscis_account",
    section: "Your Information",
    question: "Do you have a USCIS Online Account Number?",
    hint: "This is different from your A-Number. You can find it on any USCIS notice. Most people don't have one — it's okay to skip.",
    type: "text",
    optional: true,
    skip: (a) => !a.alien_number,
  },
  {
    id: "date_of_birth",
    section: "Your Information",
    question: "What is your date of birth?",
    type: "date",
    skip: (a) => !a.alien_number,
  },
  {
    id: "sex",
    section: "Your Information",
    question: "What is your sex?",
    hint: "This will appear on your replacement Green Card.",
    type: "radio",
    skip: (a) => !a.date_of_birth,
    options: [
      { value: "male",    label: "Male" },
      { value: "female",  label: "Female" },
      { value: "other",   label: "Nonbinary / Another Gender" },
    ],
  },
  {
    id: "city_of_birth",
    section: "Your Information",
    question: "In what city or town were you born?",
    type: "text",
    skip: (a) => !a.sex,
  },
  {
    id: "country_of_birth",
    section: "Your Information",
    question: "In what country were you born?",
    type: "text",
    skip: (a) => !a.city_of_birth,
  },
  {
    id: "country_of_citizenship",
    section: "Your Information",
    question: "What is your country of citizenship or nationality?",
    hint: "This is usually the same as your country of birth.",
    type: "text",
    prefill: (a) => a.country_of_birth || "",
    skip: (a) => !a.country_of_birth,
  },
  {
    id: "ssn",
    section: "Your Information",
    question: "What is your U.S. Social Security Number (if any)?",
    hint: "Leave blank if you don't have one.",
    type: "text",
    optional: true,
    format: (v) => { const d=v.replace(/\D/g,"").slice(0,9); if(d.length<=3)return d; if(d.length<=5)return d.slice(0,3)+"-"+d.slice(3); return d.slice(0,3)+"-"+d.slice(3,5)+"-"+d.slice(5); },
    skip: (a) => !a.country_of_citizenship,
  },

  // ── Address ───────────────────────────────────────────────────────────────────
  {
    id: "address_street",
    section: "Your Address",
    question: "What is your current mailing address? Start with the street number and name.",
    hint: "For example: 123 Main Street",
    type: "text",
    skip: (a) => !a.country_of_citizenship,
  },
  {
    id: "address_apt",
    section: "Your Address",
    question: "Apartment, suite, or floor number (if any)?",
    type: "text",
    optional: true,
    skip: (a) => !a.address_street,
  },
  {
    id: "address_city",
    section: "Your Address",
    question: "What city or town do you live in?",
    type: "text",
    skip: (a) => !a.address_street,
  },
  {
    id: "address_state",
    section: "Your Address",
    question: "What state?",
    type: "text",
    format: (v) => v.toUpperCase().slice(0,2),
    hint: "Two-letter state abbreviation, e.g. NY, CA, TX",
    skip: (a) => !a.address_city,
  },
  {
    id: "address_zip",
    section: "Your Address",
    question: "What is your ZIP code?",
    type: "text",
    format: (v) => v.replace(/\D/g,"").slice(0,5),
    skip: (a) => !a.address_state,
  },
  {
    id: "physical_same",
    section: "Your Address",
    question: "Is your physical (home) address the same as your mailing address?",
    hint: "Select No if you live somewhere different from where you receive mail.",
    type: "yesno",
    skip: (a) => !a.address_zip,
  },
  {
    id: "physical_street",
    section: "Your Address",
    question: "What is your physical address? Start with the street number and name.",
    type: "text",
    skip: (a) => a.physical_same !== "no",
  },
  {
    id: "physical_city",
    section: "Your Address",
    question: "City or town of your physical address?",
    type: "text",
    skip: (a) => a.physical_same !== "no",
  },
  {
    id: "physical_state",
    section: "Your Address",
    question: "State of your physical address?",
    type: "text",
    format: (v) => v.toUpperCase().slice(0,2),
    skip: (a) => a.physical_same !== "no",
  },
  {
    id: "physical_zip",
    section: "Your Address",
    question: "ZIP code of your physical address?",
    type: "text",
    format: (v) => v.replace(/\D/g,"").slice(0,5),
    skip: (a) => a.physical_same !== "no",
  },

  // ── Entry & Contact ───────────────────────────────────────────────────────────
  {
    id: "last_entry_date",
    section: "Entry Information",
    question: "When did you last enter the United States?",
    hint: "Enter the most recent date you came into the U.S.",
    type: "date",
    skip: (a) => !a.address_zip,
  },
  {
    id: "last_entry_place",
    section: "Entry Information",
    question: "Where did you last enter the United States?",
    hint: "For example: JFK Airport, New York — or — San Ysidro, California",
    type: "text",
    skip: (a) => !a.last_entry_date,
  },
  {
    id: "immigration_status",
    section: "Entry Information",
    question: "What was your immigration status when you last entered the U.S.?",
    hint: "For most Green Card holders this is LPR (Lawful Permanent Resident).",
    type: "text",
    prefill: (a) => a.card_type === "10yr" || a.card_type === "2yr" ? "LPR" : "",
    skip: (a) => !a.last_entry_place,
  },
  {
    id: "phone",
    section: "Contact",
    question: "What is your daytime phone number?",
    type: "text",
    format: (v) => { const d=v.replace(/\D/g,"").slice(0,10); if(d.length<=3)return d; if(d.length<=6)return"("+d.slice(0,3)+") "+d.slice(3); return"("+d.slice(0,3)+") "+d.slice(3,6)+"-"+d.slice(6); },
    skip: (a) => !a.immigration_status,
  },
  {
    id: "email",
    section: "Contact",
    question: "What is your email address? (optional)",
    hint: "USCIS may use this to send you electronic notices about your case.",
    type: "text",
    optional: true,
    skip: (a) => !a.phone,
  },

  // ── Biographic (for the official form) ───────────────────────────────────────
  {
    id: "height_feet",
    section: "Physical Description",
    question: "How tall are you? (feet)",
    type: "radio",
    skip: (a) => !a.phone,
    options: [
      {value:"4",label:"4 ft"},{value:"5",label:"5 ft"},{value:"6",label:"6 ft"},{value:"7",label:"7 ft"},
    ],
  },
  {
    id: "height_inches",
    section: "Physical Description",
    question: "And the inches?",
    type: "radio",
    skip: (a) => !a.height_feet,
    options: [
      {value:"0",label:'0"'},{value:"1",label:'1"'},{value:"2",label:'2"'},{value:"3",label:'3"'},
      {value:"4",label:'4"'},{value:"5",label:'5"'},{value:"6",label:'6"'},{value:"7",label:'7"'},
      {value:"8",label:'8"'},{value:"9",label:'9"'},{value:"10",label:'10"'},{value:"11",label:'11"'},
    ],
  },
  {
    id: "weight",
    section: "Physical Description",
    question: "What is your weight in pounds?",
    type: "text",
    format: (v) => v.replace(/\D/g,"").slice(0,3),
    skip: (a) => !a.height_feet,
  },
  {
    id: "eye_color",
    section: "Physical Description",
    question: "What color are your eyes?",
    type: "radio",
    skip: (a) => !a.weight,
    options: [
      {value:"black",label:"Black"},{value:"blue",label:"Blue"},{value:"brown",label:"Brown"},
      {value:"gray",label:"Gray"},{value:"green",label:"Green"},{value:"hazel",label:"Hazel"},
      {value:"maroon",label:"Maroon"},{value:"pink",label:"Pink"},{value:"unknown",label:"Unknown/Other"},
    ],
  },
  {
    id: "hair_color",
    section: "Physical Description",
    question: "What color is your hair?",
    type: "radio",
    skip: (a) => !a.eye_color,
    options: [
      {value:"bald",label:"Bald"},{value:"black",label:"Black"},{value:"blond",label:"Blond"},
      {value:"brown",label:"Brown"},{value:"gray",label:"Gray"},{value:"red",label:"Red"},
      {value:"sandy",label:"Sandy"},{value:"white",label:"White"},{value:"unknown",label:"Unknown/Other"},
    ],
  },

  // ── Legal Questions ───────────────────────────────────────────────────────────
  {
    id: "removal_proceedings",
    section: "Legal Questions",
    question: "Have you ever been in exclusion, deportation, or removal proceedings, or been ordered removed from the United States?",
    type: "yesno",
    skip: (a) => !a.hair_color,
  },
  {
    id: "abandoned_status",
    section: "Legal Questions",
    question: "Since becoming a permanent resident, have you ever filed Form I-407 (Abandonment of LPR Status) or been found to have abandoned your status?",
    type: "yesno",
    skip: (a) => !a.hair_color,
  },

  // ── Disability Accommodations ─────────────────────────────────────────────────
  {
    id: "needs_accommodation",
    section: "Accommodations",
    question: "Do you need any special accommodations at your biometrics appointment (e.g. sign language interpreter, wheelchair access)?",
    type: "yesno",
    skip: (a) => !a.hair_color,
  },
  {
    id: "accommodation_desc",
    section: "Accommodations",
    question: "Please describe the accommodation you need.",
    type: "text",
    skip: (a) => a.needs_accommodation !== "yes",
  },

  // ── Interpreter / Preparer ────────────────────────────────────────────────────
  {
    id: "used_interpreter",
    section: "Statement",
    question: "Did someone interpret this application into another language for you?",
    type: "yesno",
    skip: (a) => !a.hair_color,
  },
  {
    id: "sign_date",
    section: "Statement",
    question: "Today's date — by continuing you certify that all information is complete, true, and correct.",
    type: "date",
    prefill: () => new Date().toISOString().split("T")[0],
    skip: (a) => !a.hair_color,
  },
];

// ─── PDF Filler ───────────────────────────────────────────────────────────────

const REASON_MAP = {
  "2a":0,"2b":1,"2c":2,"2d":3,"2e":4,"2f":5,"2g1":6,"2g2":7,"2h1":8,"2h2":9,"2i":10,"2j":11,"other":11,
};
const EYE_MAP  = {black:0,blue:1,brown:2,gray:3,green:4,hazel:5,maroon:6,pink:7,unknown:8};
const HAIR_MAP = {bald:0,black:1,blond:2,brown:3,gray:4,red:5,sandy:6,white:7,unknown:8};

async function fillAndDownloadI90(answers) {
  let pdfBytes;
  try {
    const res = await fetch("/i-90.pdf");
    if (!res.ok) throw new Error("not found");
    pdfBytes = await res.arrayBuffer();
  } catch {
    alert("Could not load i-90.pdf from your /public folder.\n\nPlease download it from:\nhttps://www.uscis.gov/sites/default/files/document/forms/i-90.pdf\n\nAnd save it as: public/i-90.pdf in your project.");
    return;
  }

  const doc  = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const form = doc.getForm();

  const set = (name, val) => { if (!val) return; try { form.getTextField(name).setText(String(val)); } catch {} };
  const chk = (name)      => { try { form.getButton(name).check(); } catch {} };
  const ddl = (name, val) => { if (!val) return; try { form.getDropdown(name).select(val); } catch {} };
  const fmtDate = (d) => { if (!d) return ""; if (d.includes("-")) { const [y,m,dd]=d.split("-"); return `${m}/${dd}/${y}`; } return d; };

  // Part 1 — Name
  set("form1[0].#subform[0].P1_Line3a_FamilyName[0]", answers.family_name);
  set("form1[0].#subform[0].P1_Line3b_GivenName[0]",  answers.given_name);
  set("form1[0].#subform[0].P1_Line3c_MiddleName[0]", answers.middle_name);

  if (answers.filing_reason === "2e" && answers.name_changed === "yes") {
    chk("form1[0].#subform[0].P1_checkbox4[0]"); // Yes - name changed
    set("form1[0].#subform[0].P1_Line5a_FamilyName[0]", answers.new_family_name || answers.family_name);
    set("form1[0].#subform[0].P1_Line5b_GivenName[0]",  answers.new_given_name  || answers.given_name);
  } else {
    chk("form1[0].#subform[0].P1_checkbox4[1]"); // No
  }

  // Part 1 — IDs
  set("form1[0].#subform[0].#area[1].P1_Line1_AlienNumber[0]", (answers.alien_number||"").replace(/\D/g,""));
  set("form1[0].#subform[0].P1_Line2_AcctIdentifier[0]",       answers.uscis_account);

  // Part 1 — Mailing address
  set("form1[0].#subform[0].P1_Line6b_StreetNumberName[0]", answers.address_street);
  set("form1[0].#subform[0].P1_Line6c_AptSteFlrNumber[0]",  answers.address_apt);
  set("form1[0].#subform[0].P1_Line6d_CityOrTown[0]",       answers.address_city);
  set("form1[0].#subform[0].P1_Line6f_ZipCode[0]",          answers.address_zip);
  ddl("form1[0].#subform[0].P1_Line6e_State[0]",            answers.address_state);

  // Part 1 — Physical address
  if (answers.physical_same === "no") {
    set("form1[0].#subform[0].P1_Line7a_StreetNumberName[0]", answers.physical_street);
    set("form1[0].#subform[0].P1_Line7c_CityOrTown[0]",       answers.physical_city);
    set("form1[0].#subform[0].P1_Line7e_ZipCode[0]",          answers.physical_zip);
    ddl("form1[0].#subform[0].P1_Line7d_State[0]",            answers.physical_state);
  }

  // Part 1 — Bio
  set("form1[0].#subform[1].P1_Line9_DateOfBirth[0]",     fmtDate(answers.date_of_birth));
  set("form1[0].#subform[1].P1_Line10_CityTownOfBirth[0]",answers.city_of_birth);
  set("form1[0].#subform[1].P1_Line11_CountryofBirth[0]", answers.country_of_birth);
  set("form1[0].#subform[1].P1_Line16_SSN[0]",            answers.ssn);
  set("form1[0].#subform[1].P1_Line14_ClassOfAdmission[0]", answers.immigration_status);
  set("form1[0].#subform[1].P1_Line15_DateOfAdmission[0]",  fmtDate(answers.last_entry_date));

  const sex = (answers.sex||"").toLowerCase();
  if (sex === "male")   chk("form1[0].#subform[1].P1_Line8_male[0]");
  if (sex === "female") chk("form1[0].#subform[1].P1_Line8_female[0]");

  // Part 2 — Status & Reason
  chk("form1[0].#subform[1].P2_checkbox1[0]"); // LPR
  const rIdx = REASON_MAP[answers.filing_reason];
  if (rIdx !== undefined) chk(`form1[0].#subform[1].P2_checkbox2[${rIdx}]`);

  // Part 3 — Processing
  set("form1[0].#subform[2].P3_Line1_LocationAppliedVisa[0]", answers.last_entry_place);
  set("form1[0].#subform[2].P3_Line3a1_CityandState[0]",      answers.last_entry_place);

  // Removal / abandonment
  if (answers.removal_proceedings === "yes") chk("form1[0].#subform[2].P3_checkbox4[0]");
  else                                        chk("form1[0].#subform[2].P3_checkbox4[1]");
  if (answers.abandoned_status === "yes")     chk("form1[0].#subform[2].P3_checkbox5[0]");
  else                                        chk("form1[0].#subform[2].P3_checkbox5[1]");

  // Height / weight
  set("form1[0].#subform[2].P3_Line9_HeightInches1[0]", answers.height_feet);
  set("form1[0].#subform[2].P3_Line9_HeightInches2[0]", answers.height_inches);
  set("form1[0].#subform[2].P3_Line9_HeightInches3[0]", answers.weight);

  // Eye color
  const eIdx = EYE_MAP[(answers.eye_color||"").toLowerCase()];
  if (eIdx !== undefined) chk(`form1[0].#subform[2].P3_checkbox10[${eIdx}]`);

  // Hair color
  const hIdx = HAIR_MAP[(answers.hair_color||"").toLowerCase()];
  if (hIdx !== undefined) chk(`form1[0].#subform[2].P3_checkbox11[${hIdx}]`);

  // Part 4 — Accommodations
  if (answers.needs_accommodation === "yes") {
    chk("form1[0].#subform[2].P4_checkbox1[0]"); // Yes
    chk("form1[0].#subform[2].P4_checkbox1c[0]"); // other type
    set("form1[0].#subform[3].P4_Line1c_AccomodationRequested[0]", answers.accommodation_desc);
  } else {
    chk("form1[0].#subform[2].P4_checkbox1[1]"); // No
  }

  // Part 5 — Statement
  if (answers.used_interpreter === "yes") {
    chk("form1[0].#subform[3].P5_Checkbox1b[0]");
  } else {
    chk("form1[0].#subform[3].P5_Checkbox1a[0]");
  }
  // Mark "preparer assisted" since attorney is filing
  chk("form1[0].#subform[3].P5_Checkbox2[0]");
  set("form1[0].#subform[3].P5_Line2_NameofRepresentative[0]", "ApplyUS Legal");
  set("form1[0].#subform[3].P5_Line3_DaytimePhoneNumber[0]",   answers.phone);
  set("form1[0].#subform[3].P5_Line5_EmailAddress[0]",         answers.email);
  set("form1[0].#subform[3].P5_Line6b_DateofSignature[0]",     fmtDate(answers.sign_date));

  // Part 8 — repeat name
  set("form1[0].#subform[6].P1_Line3a_FamilyName[1]", answers.family_name);
  set("form1[0].#subform[6].P1_Line3b_GivenName[1]",  answers.given_name);
  set("form1[0].#subform[6].P1_Line3c_MiddleName[1]", answers.middle_name);
  set("form1[0].#subform[6].#area[3].P1_Line1_AlienNumber[1]", (answers.alien_number||"").replace(/\D/g,""));

  const filled = await doc.save();
  const blob   = new Blob([filled], { type: "application/pdf" });
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement("a");
  a.href       = url;
  a.download   = `I-90_${answers.given_name||"applicant"}_${answers.family_name||""}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── UI Components ────────────────────────────────────────────────────────────

function RadioGroup({ options, value, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {options.map(opt => {
        const selected = value === opt.value;
        return (
          <button key={opt.value} onClick={() => onChange(opt.value)} style={{
            display: "flex", alignItems: "center", gap: "14px",
            padding: "14px 20px", borderRadius: "10px", cursor: "pointer",
            border: `2px solid ${selected ? C.navy : C.border}`,
            background: selected ? "#eef2fa" : C.white,
            textAlign: "left", fontFamily: "'Plus Jakarta Sans', sans-serif",
            transition: "all 0.15s",
          }}>
            <div style={{
              width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0,
              border: `2px solid ${selected ? C.navy : C.border}`,
              background: selected ? C.navy : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {selected && <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: C.white }} />}
            </div>
            <span style={{ fontSize: "15px", color: C.navy, fontWeight: selected ? "600" : "400" }}>
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function YesNo({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: "12px" }}>
      {["yes","no"].map(v => {
        const selected = value === v;
        return (
          <button key={v} onClick={() => onChange(v)} style={{
            padding: "14px 40px", borderRadius: "10px", cursor: "pointer",
            border: `2px solid ${selected ? C.navy : C.border}`,
            background: selected ? C.navy : C.white,
            color: selected ? C.white : C.navy,
            fontSize: "16px", fontWeight: "600",
            fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.15s",
          }}>
            {v === "yes" ? "Yes" : "No"}
          </button>
        );
      })}
    </div>
  );
}

function TextInput({ value, onChange, hint, format, type = "text" }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type === "date" ? "date" : "text"}
      value={value || ""}
      onChange={e => { const v = format ? format(e.target.value) : e.target.value; onChange(v); }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder={hint || ""}
      style={{
        width: "100%", padding: "14px 18px", fontSize: "16px",
        border: `2px solid ${focused ? C.navy : C.border}`,
        borderRadius: "10px", outline: "none",
        fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.navy,
        background: C.white, transition: "border-color 0.15s", boxSizing: "border-box",
      }}
    />
  );
}

// ─── Progress Sidebar ─────────────────────────────────────────────────────────

const SECTIONS = ["Eligibility", "Your Information", "Your Address", "Entry Information", "Contact", "Physical Description", "Legal Questions", "Accommodations", "Statement"];

function Sidebar({ currentSection, completedSections, answers }) {
  return (
    <div style={{ width: "220px", flexShrink: 0 }}>
      <div style={{ position: "sticky", top: "78px" }}>
        <div style={{ fontSize: "10px", fontWeight: "700", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "12px", paddingLeft: "4px" }}>
          Sections
        </div>
        {SECTIONS.map((section, i) => {
          const done   = completedSections.includes(section);
          const active = currentSection === section;
          const sectionQs = QUESTIONS.filter(q => q.section === section && q.type !== "info" && (!q.skip || !q.skip(answers)));
          const sectionDone = sectionQs.filter(q => answers[q.id]?.toString().trim()).length;
          const sectionTotal = sectionQs.length;
          const pct = sectionTotal > 0 ? Math.round((sectionDone / sectionTotal) * 100) : 0;
          return (
            <div key={section} style={{
              padding: "10px 12px", borderRadius: "8px", marginBottom: "4px",
              background: active ? C.navy : "transparent",
              border: `1px solid ${active ? C.navy : done ? C.successBorder : C.border}`,
              transition: "all 0.15s",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: sectionTotal > 0 ? "6px" : "0" }}>
                <div style={{
                  width: "22px", height: "22px", borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: active ? C.gold : done ? C.success : C.borderLight,
                  fontSize: "11px", fontWeight: "700",
                  color: active || done ? C.white : C.textMuted,
                }}>
                  {done ? "✓" : i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: "12px", fontWeight: active ? "700" : "500", color: active ? C.white : done ? C.success : C.textMuted }}>
                    {section}
                  </span>
                  {sectionTotal > 0 && (
                    <span style={{ fontSize: "10px", color: active ? "rgba(255,255,255,0.5)" : C.textMuted, marginLeft: "6px" }}>
                      {sectionDone}/{sectionTotal}
                    </span>
                  )}
                </div>
              </div>
              {sectionTotal > 0 && (
                <div style={{ height: "3px", background: active ? "rgba(255,255,255,0.15)" : C.borderLight, borderRadius: "2px", marginLeft: "32px" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: active ? C.gold : done ? C.success : C.gold, borderRadius: "2px", transition: "width 0.3s" }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function I90SmartForm({ onClose }) {
  const [answers,    setAnswers]    = useState({});
  const [queueIndex, setQueueIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [submitted,  setSubmitted]  = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!document.querySelector("#applyus-fonts")) {
      const l = document.createElement("link"); l.id = "applyus-fonts"; l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap";
      document.head.appendChild(l);
    }
  }, []);

  // Build the active queue — skip questions whose skip() returns true
  const queue = QUESTIONS.filter(q => !q.skip || !q.skip(answers));
  const current = queue[queueIndex];
  const isLast = queueIndex >= queue.length - 1;
  // Use full non-info question count for stable total in progress bar
  const totalQuestions = QUESTIONS.filter(q => q.type !== "info").length;

  // Track completed sections
  const completedSections = [];
  for (let i = 0; i < queueIndex; i++) {
    const s = queue[i]?.section;
    if (s && !completedSections.includes(s)) completedSections.push(s);
  }

  // Prefill input when moving to a new question
  useEffect(() => {
    if (!current) return;
    const existing = answers[current.id];
    if (existing) { setInputValue(existing); return; }
    if (current.prefill) { setInputValue(current.prefill(answers)); return; }
    setInputValue("");
  }, [queueIndex, current?.id]);

  const canAdvance = () => {
    if (!current) return false;
    if (current.type === "info") return true;
    if (current.isBlocking) return false;
    if (current.optional) return true;
    return inputValue?.toString().trim().length > 0;
  };

  const advance = () => {
    if (!current) return;
    const newAnswers = current.type !== "info"
      ? { ...answers, [current.id]: inputValue }
      : answers;
    if (current.type !== "info") setAnswers(newAnswers);
    const nextQueue = QUESTIONS.filter(q => !q.skip || !q.skip(newAnswers));
    if (queueIndex >= nextQueue.length - 1) { setSubmitted(true); return; }
    setQueueIndex(i => i + 1);
  };

  const goBack = () => {
    if (queueIndex === 0) return;
    setQueueIndex(i => i - 1);
  };

  const handleDownload = async () => {
    setGenerating(true);
    try { await fillAndDownloadI90(answers); } catch (e) { alert("Error generating PDF: " + e.message); }
    setGenerating(false);
  };

  // Confirmation screen
  if (submitted) {
    const ref = Math.random().toString(36).substr(2,8).toUpperCase();
    return (
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: C.offWhite, minHeight: "100vh" }}>
        <div style={{ background: C.navy, height: "64px", display: "flex", alignItems: "center", padding: "0 2.5rem" }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: "700", fontSize: "22px", color: C.white }}>Apply</span>
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: "700", fontSize: "22px", color: C.gold }}>US</span>
        </div>
        <div style={{ maxWidth: "580px", margin: "80px auto", padding: "0 2rem", textAlign: "center" }}>

          <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: C.successLight, border: `2px solid ${C.successBorder}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px", fontSize: "34px" }}>✓</div>

          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "32px", color: C.navy, marginBottom: "14px" }}>
            You're Almost There{answers.given_name ? `, ${answers.given_name}` : ""}!
          </h2>
          <p style={{ color: C.textSecondary, fontSize: "15px", lineHeight: "1.75", marginBottom: "32px" }}>
            Your I-90 application has been submitted to ApplyUS. A licensed immigration attorney will review your information, prepare your official USCIS filing, and reach out to you within 1–2 business days.
          </p>

          <div style={{ background: C.goldLight, border: `1px solid ${C.goldBorder}`, borderRadius: "12px", padding: "20px 24px", marginBottom: "28px" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#7a5810", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "8px" }}>Your Case Reference Number</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "28px", fontWeight: "700", color: C.navy }}>{ref}</div>
            <div style={{ fontSize: "12px", color: "#7a5810", marginTop: "6px" }}>Save this number — you'll need it to check your case status.</div>
          </div>

          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "20px 24px", marginBottom: "28px", textAlign: "left" }}>
            <div style={{ fontSize: "12px", fontWeight: "700", color: C.navy, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "14px" }}>What happens next</div>
            {[
              ["1–2 business days", "An attorney reviews your application and verifies all information"],
              ["2–3 business days", "You receive a confirmation email with next steps and document checklist"],
              ["Within 1 week",     "Your attorney files Form I-90 with USCIS on your behalf"],
            ].map(([time, desc]) => (
              <div key={time} style={{ display: "flex", gap: "14px", marginBottom: "14px", alignItems: "flex-start" }}>
                <div style={{ background: C.navy, color: C.white, borderRadius: "6px", padding: "3px 8px", fontSize: "11px", fontWeight: "700", whiteSpace: "nowrap", marginTop: "2px" }}>{time}</div>
                <span style={{ fontSize: "13px", color: C.textSecondary, lineHeight: "1.55" }}>{desc}</span>
              </div>
            ))}
          </div>

          <button onClick={onClose} style={{
            background: C.navy, color: C.white, border: "none",
            padding: "14px 36px", borderRadius: "10px", fontSize: "15px",
            fontWeight: "700", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", width: "100%",
          }}>
            ← Back to ApplyUS
          </button>

        </div>
      </div>
    );
  }

  if (!current) return null;

  const progress = Math.round(((queueIndex + 1) / totalQuestions) * 100);

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: C.offWhite, minHeight: "100vh" }}>

      {/* Top bar */}
      <div style={{ background: C.navy, height: "64px", display: "flex", alignItems: "center", padding: "0 2.5rem", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {onClose && <button onClick={onClose} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "rgba(255,255,255,0.6)", borderRadius: "6px", padding: "6px 12px", fontSize: "13px", cursor: "pointer", fontFamily: "inherit" }}>← Back</button>}
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: "700", fontSize: "22px", color: C.white }}>Apply</span>
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: "700", fontSize: "22px", color: C.gold, marginLeft: "-8px" }}>US</span>
          <span style={{ color: "rgba(255,255,255,0.25)", margin: "0 6px" }}>|</span>
          <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px" }}>Form I-90 — Green Card Renewal</span>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "4px" }}>
            Question {queueIndex + 1} of {totalQuestions} &nbsp;·&nbsp; {progress}% complete
          </div>
          <div style={{ width: "200px", height: "5px", background: "rgba(255,255,255,0.12)", borderRadius: "3px" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: C.gold, borderRadius: "3px", transition: "width 0.4s" }} />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "48px 2.5rem 80px", display: "flex", gap: "40px" }}>

        <Sidebar currentSection={current.section} completedSections={completedSections} answers={answers} />

        {/* Question card */}
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: "10px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: C.gold, textTransform: "uppercase", letterSpacing: "0.8px" }}>
              {current.section}
            </span>
          </div>

          <div style={{ background: C.white, borderRadius: "16px", border: `1px solid ${C.border}`, padding: "40px", marginBottom: "20px" }}>

            {/* Blocking info screen */}
            {current.type === "info" ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "40px", marginBottom: "20px" }}>⚖️</div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", color: C.navy, marginBottom: "16px" }}>
                  Let's Talk First
                </h2>
                <p style={{ color: C.textSecondary, fontSize: "15px", lineHeight: "1.7", marginBottom: "28px" }}>
                  {current.question}
                </p>
                <button style={{ background: C.gold, color: C.white, border: "none", padding: "14px 28px", borderRadius: "8px", fontSize: "15px", fontWeight: "700", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", width: "100%", marginBottom: "12px" }}>
                  Schedule Free Consultation
                </button>
                <button onClick={goBack} style={{ background: "transparent", color: C.textSecondary, border: `1px solid ${C.border}`, padding: "12px 28px", borderRadius: "8px", fontSize: "14px", fontWeight: "500", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", width: "100%" }}>
                  ← Go Back
                </button>
              </div>
            ) : (
              <>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", color: C.navy, marginBottom: current.hint ? "10px" : "28px", lineHeight: "1.35" }}>
                  {current.question}
                </h2>

                {current.hint && (
                  <p style={{ color: C.textSecondary, fontSize: "14px", lineHeight: "1.6", marginBottom: "24px", padding: "10px 14px", background: C.goldLight, borderRadius: "8px", border: `1px solid ${C.goldBorder}` }}>
                    {current.hint}
                  </p>
                )}

                {current.type === "radio" && (
                  <RadioGroup options={current.options} value={inputValue} onChange={v => { setInputValue(v); }} />
                )}
                {current.type === "yesno" && (
                  <YesNo value={inputValue} onChange={v => setInputValue(v)} />
                )}
                {(current.type === "text" || current.type === "date") && (
                  <TextInput value={inputValue} onChange={setInputValue} hint={current.placeholder} format={current.format} type={current.type} />
                )}

                {current.optional && (
                  <p style={{ marginTop: "10px", fontSize: "12px", color: C.textMuted }}>This field is optional — you can skip it.</p>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "32px" }}>
                  <button onClick={goBack} disabled={queueIndex === 0} style={{ background: "transparent", color: queueIndex === 0 ? C.textMuted : C.textSecondary, border: `1px solid ${queueIndex === 0 ? C.borderLight : C.border}`, padding: "12px 24px", borderRadius: "8px", fontSize: "14px", fontWeight: "500", cursor: queueIndex === 0 ? "not-allowed" : "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    ← Back
                  </button>
                  <button onClick={advance} disabled={!canAdvance()} style={{ background: canAdvance() ? C.navy : C.borderLight, color: canAdvance() ? C.white : C.textMuted, border: "none", padding: "12px 32px", borderRadius: "8px", fontSize: "15px", fontWeight: "700", cursor: canAdvance() ? "pointer" : "not-allowed", fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.15s" }}>
                    {isLast ? "Review & Download →" : "Continue →"}
                  </button>
                </div>
              </>
            )}
          </div>


        </div>
      </div>
    </div>
  );
}
