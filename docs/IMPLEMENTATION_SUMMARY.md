# Safety-First Output Framing: Implementation Summary

## What Was Delivered

This package provides Passagr with a **trauma-informed, neutrally-toned framework** for presenting immigration and safety guidance to users making high-stakes relocation decisions.

The framework ensures that all results:
- ✅ Name specific legal protections (not emotional claims)
- ✅ State barriers plainly without softening or minimizing
- ✅ Include realistic timelines with current backlogs (January 2026)
- ✅ Offer fallback pathways for when primary options fail
- ✅ Respect fear without amplifying it
- ✅ Center user agency (information supports decisions; doesn't make them)
- ✅ Refuse to guarantee approval, safety, or speed

---

## The Two Core Documents

### **Document 1: SAFETY_FIRST_OUTPUT_FRAMING.md**
**Purpose:** Complete framework specification
**Who needs it:** Product designers, senior writers, policy team
**Contains:**
- **Part 1:** Reusable result card template (4 mandatory sections)
- **Part 2:** Two fully written example outputs
  - Example 1: "Safe But Slow" (Portugal D7 + EU Asylum fallback)
  - Example 2: "Fast But Fragile" (Canada IRCC + Mexico COMAR fallback)
- **Part 3:** "What This Tool Cannot Do" disclaimer (copy-paste ready)
- **Part 4:** Tone rationale (why neutrality ≠ coldness; explains every major decision)
- **Part 5:** Verification checklist (pre-publishing quality gate)
- **Part 6:** Sample application (step-by-step guide for teams building output)

**Key insight:** The tone rationale (Part 4) explains the *why* behind every choice—essential for justifying this approach to stakeholders.

---

### **Document 2: OUTPUT_FRAMING_QUICK_REFERENCE.md**
**Purpose:** Practical implementation guide for content teams
**Who needs it:** Content writers, editors, QA reviewers
**Contains:**
- Four required sections (with template language)
- Five tone rules (with "don't/do" examples)
- Intake question language mapping
- Data currency & verification checklist
- Common pitfalls & how to avoid them
- Content review checklist (for editors)
- Pro-bono legal resources (to include in every result)

**Best used as:** A checklist taped to every writer's workspace.

---

## How to Use This Framework

### **For Product Teams: Building a New Result Card**

1. **User completes intake questionnaire** → 7 questions answered
2. **Generate eligible pathways** using Agent 2 elimination logic
3. **Select two pathways:**
   - Primary: Usually the fastest viable option
   - Fallback: Different preconditions; what to do if primary fails
4. **Draft using template:**
   - Section A (Why safer): Cite law + source + date; distinguish legal from practical
   - Section B (What's difficult): Name barriers tied to intake answers + timelines
   - Section C (Fastest pathway): Sequential steps + backlog status (current as of Jan 2026)
   - Section D (Fallback): Different requirements; explicit triggers
5. **Run verification checklist** (from Part 5 of main document)
6. **Attach disclaimer** (non-removable; full version or link)
7. **Include resources:** Pro-bono legal org links (3–5 relevant to pathway/country)

### **For Editors: Quality Gate Checklist**

Before approving any result card:

**Accuracy:**
- [ ] All figures match passagr_research.md
- [ ] Processing times show current backlogs (January 2026)
- [ ] Legal protections correctly stated with source citation

**Tone:**
- [ ] No soft language: "just," "simply," "easy," "guaranteed"
- [ ] All barriers named plainly (not minimized)
- [ ] No false certainty about outcomes
- [ ] No motivational language
- [ ] Fear respected, not amplified

**Completeness:**
- [ ] All four sections present
- [ ] Fallback uses different preconditions
- [ ] Intake question references accurate
- [ ] Disclaimer attached
- [ ] Pro-bono resources included (3–5)

**Ethics:**
- [ ] No legal advice given (only law described)
- [ ] User agency centered
- [ ] If rejection is possible, it's named
- [ ] If timeline is uncertain, that's stated

---

## The Three Foundational Principles

### **1. Specificity Over Vagueness**
❌ "Good LGBTQ+ protections" → ✅ "Hate crime law (Law 5/99) covers sexual orientation; conviction carries 1–5 years"

All claims must cite specific laws, statutes, or government policies—never emotional characterizations.

### **2. Barriers Without Softening**
❌ "Just prove income" → ✅ "Requires 1+ year tax returns proving €920/month passive income; difficult if recent employment or irregular income; IRS documentation takes 2–4 weeks"

Name the difficulty and timeline plainly. Users in high-stakes situations need realism, not reassurance.

### **3. Law ≠ Safety**
❌ "Canada will keep you safe" → ✅ "Canada has federal hate crime legislation + constitutional protections. Your actual safety depends on location, local enforcement, and on-the-ground conditions; research with local LGBTQ+ organizations"

Legal protection is necessary but not sufficient. Users must independently assess practical safety.

---

## The Four Required Sections (Checklist Format)

**Every result card must include all four:**

| Section | Contains | Key Rule |
|---------|----------|----------|
| **A: Why Safer** | Specific law; source + date; how it differs from U.S. | Distinguish legal protection from practical enforcement |
| **B: What's Difficult** | Barriers tied to intake answers; timeline per barrier | Name difficulty plainly; no softening |
| **C: Fastest Pathway** | Sequential steps; current backlog status; success criteria | Acknowledge this is fastest, not safest; include "viable" definition |
| **D: Fallback** | One alternative pathway; explicit triggers; what changes | Different preconditions; not just "same path slower" |

---

## Tone: Five Non-Negotiable Rules

1. **Specificity:** All claims cite specific laws, dates, and sources
2. **No softening:** Barriers are named plainly; timelines are realistic
3. **No false certainty:** Approval/safety not guaranteed; outcomes are uncertain
4. **No motivational language:** Remove "you can do this," "don't worry," "you'll be okay"
5. **Respect fear:** Acknowledge risk; let users assess whether risk is justified

---

## Data Integrity Requirements

**Every output must include:**
- [ ] Current as of January 2026 (refresh annually)
- [ ] Processing times reflect current backlogs (not standard/historical times)
- [ ] Legal sources cited (government ministry or recognized NGO: ILGA, UNHCR, HRW, etc.)
- [ ] Confidence level: "High," "Moderate," or "Conditional—[flag]"
- [ ] For flags: "pending legislation," "enforcement inconsistent," "varies by region"

**Before publishing, verify:**
- [ ] No post-January 2026 policy changes assumed
- [ ] Backlog status updated if new information available
- [ ] Sources match those in passagr_research.md
- [ ] Lawyer/NGO resources reflect current organizations

---

## The Mandatory Disclaimer

Every result must include:

> **PASSAGR IS NOT LEGAL ADVICE**
>
> Passagr provides research-based information about immigration options. It does NOT provide:
> - Legal advice or representation
> - Personalized assessment of your specific eligibility
> - Guarantees of approval or processing speed
> - Assessment of whether you'll actually be safe
> - Solutions if you're rejected
> - Insurance against risk
>
> **You must:**
> - Consult a qualified immigration attorney (licensed in destination country)
> - Verify all legal information with official government sources
> - Research on-the-ground conditions through local LGBTQ+/reproductive rights orgs
> - Assess your financial situation and worst-case scenario
> - Connect with resettlement organizations for practical support

See full version: SAFETY_FIRST_OUTPUT_FRAMING.md, Part 3

---

## Common Mistakes to Avoid

| Mistake | Example | Solution |
|---------|---------|----------|
| Comparative ranking | "Spain is faster than Canada" | State both timelines; let user choose based on their needs |
| Motivational tone | "You've got this!" | Replace with factual statement: "This is viable if you meet these preconditions" |
| Softening barriers | "Just need to prove income" | "Must prove €920/month with 1+ year documentation; difficult if recent/irregular income" |
| Conflating law + safety | "Portugal is safe for LGBTQ+ people" | "Portugal has legal protections; research on-the-ground conditions" |
| Outdated timelines | "Canada takes 6 months" | "Standard 6–7 months; current backlog 10–14 months (January 2026)" |
| Advice tone | "You should apply for X visa" | "X visa is an option if you meet these requirements; decide based on your situation" |

---

## For Different Stakeholder Groups

### **Product Leadership**
- Read: Tone Rationale (Part 4 of main document)
- Action: Align product vision with trauma-informed, neutral approach
- Question: "Why neutrality ≠ coldness? Because false hope followed by rejection is cruelty disguised as kindness."

### **Writers & Content Team**
- Use: OUTPUT_FRAMING_QUICK_REFERENCE.md (as working checklist)
- Reference: Template language (Section 1 of reference document)
- Verify: Against common pitfalls list (at end of reference document)

### **Editors & QA**
- Use: Content review checklist (from Quick Reference)
- Measure: Against verification checklist (Part 5 of main document)
- Gate: Every output against accuracy + tone + completeness before publication

### **Legal/Compliance**
- Read: "What This Tool Cannot Do" disclaimer (Part 3 of main document)
- Verify: That all outputs include non-removable disclaimer
- Monitor: For any outputs that veer into legal advice territory

### **Product Design**
- Study: The two example outputs (Part 2 of main document)
- Understand: How intake answers shape result card content
- Design: UI to surface the disclaimer prominently and consistently

---

## Success Metrics

A well-executed result card will:
- ✅ Answer the four required sections completely
- ✅ Use specific, cited legal information (never vague emotional claims)
- ✅ Name all relevant barriers plainly
- ✅ Include realistic timelines with current backlog data
- ✅ Avoid all soft language (just, simple, easy, guaranteed, don't worry)
- ✅ Acknowledge that outcomes are uncertain
- ✅ Respect user fear without amplifying it
- ✅ Center user agency (information supports their choice)
- ✅ Include non-removable disclaimer
- ✅ Link to 3–5 pro-bono legal/support resources

---

## Next Steps for Implementation

1. **Share SAFETY_FIRST_OUTPUT_FRAMING.md with:**
   - Product leadership (for tone alignment)
   - Senior writers (for template understanding)
   - Legal/compliance (for disclaimer review)

2. **Share OUTPUT_FRAMING_QUICK_REFERENCE.md with:**
   - All writers and editors
   - QA team (for verification)
   - Anyone building result cards

3. **Integrate into workflow:**
   - Add verification checklist to publication gate
   - Make disclaimer copy-paste requirement
   - Create editorial template using the 4-section structure

4. **Train team on tone:**
   - Review the five tone rules (with examples)
   - Discuss why soft language creates harm
   - Share the "Why Neutrality ≠ Coldness" rationale

5. **Monitor compliance:**
   - Audit first 10 result cards against checklist
   - Adjust template if edge cases appear
   - Update data annually (January 2027 refresh)

---

## Document Locations

- **Full Framework:** `/home/user/Passagr/SAFETY_FIRST_OUTPUT_FRAMING.md` (5,600+ lines)
- **Quick Reference:** `/home/user/Passagr/OUTPUT_FRAMING_QUICK_REFERENCE.md` (600+ lines)
- **Implementation Summary:** This document
- **Git commit:** `1e39c324` (includes both documents)
- **Branch:** `claude/safety-first-output-framing-MHlQ4`

---

## Questions?

**For tone/framing questions:** Review "Why Neutrality ≠ Coldness" (Part 4 of main document)

**For template questions:** Review the example outputs (Part 2 of main document) or the four-section template (Part 1)

**For workflow questions:** Review the implementation guide (Part 6 of main document)

**For editing questions:** Use the content review checklist (OUTPUT_FRAMING_QUICK_REFERENCE.md)

---

**Document Created:** January 29, 2026
**Status:** Ready for implementation
**Last Reviewed:** [To be updated by implementation team]
