import { describe, it, expect } from "vitest";
import {
  parseCallUpText,
  standardizeDate,
  calculateDaysRemaining,
  formatDateDisplay,
} from "./parser";

describe("parseCallUpText", () => {
  it("handles empty or whitespace-only input gracefully", () => {
    const emptyResult = parseCallUpText("");
    expect(emptyResult.fullName.value).toBe("");
    expect(emptyResult.fullName.confidence).toBe("not found");
    expect(emptyResult.stateCode.value).toBe("");
    expect(emptyResult.stateCode.confidence).toBe("not found");
    expect(emptyResult.callUpNumber.value).toBe("");
    expect(emptyResult.callUpNumber.confidence).toBe("not found");
    expect(emptyResult.campState.value).toBe("");
    expect(emptyResult.reportingDate.value).toBe("");

    const wsResult = parseCallUpText("   \n\n\t  ");
    expect(wsResult.fullName.confidence).toBe("not found");
    expect(wsResult.callUpNumber.confidence).toBe("not found");
  });

  it("extracts all fields from a standard synthetic call-up letter", () => {
    const syntheticLetter = `
NATIONAL YOUTH SERVICE CORPS
DIRECTORATE HEADQUARTERS, ABUJA
CALL-UP LETTER FOR 2026 BATCH 'A' SERVICE YEAR

Call-up Number: NYSC/ABU/2026/142981
State Code: LA/26A/4912
Name: ADENIRAN BABAJIDE SAMUEL
State of Deployment: LAGOS
Orientation Camp: NYSC Permanent Orientation Camp, Iyana-Ipaja, Lagos State
Date of Reporting: 18th November, 2026
Batch: 2026 Batch A
Stream: Stream 1
`;

    const parsed = parseCallUpText(syntheticLetter);

    expect(parsed.fullName.value).toBe("ADENIRAN BABAJIDE SAMUEL");
    expect(parsed.fullName.confidence).toBe("found");

    expect(parsed.callUpNumber.value).toBe("NYSC/ABU/2026/142981");
    expect(parsed.callUpNumber.confidence).toBe("found");

    expect(parsed.stateCode.value).toBe("LA/26A/4912");
    expect(parsed.stateCode.confidence).toBe("found");

    expect(parsed.campState.value).toBe("Lagos");
    expect(parsed.campState.confidence).toBe("found");

    expect(parsed.campName.value).toContain("Iyana-Ipaja");
    expect(parsed.campName.confidence).toBe("found");

    expect(parsed.reportingDate.value).toBe("2026-11-18");
    expect(parsed.reportingDate.confidence).toBe("found");

    expect(parsed.batch.value).toBe("2026 Batch A");
    expect(parsed.batch.confidence).toBe("found");

    expect(parsed.stream.value).toBe("Stream 1");
    expect(parsed.stream.confidence).toBe("found");
  });

  it("extracts fields when some are missing", () => {
    const partialLetter = `
NATIONAL YOUTH SERVICE CORPS
Candidate Name: CHUKWUEMEKA CHINEDU
Call-up No: NYSC/UNN/2026/782101
Deployment State: ENUGU
`;

    const parsed = parseCallUpText(partialLetter);

    expect(parsed.fullName.value).toBe("CHUKWUEMEKA CHINEDU");
    expect(parsed.fullName.confidence).toBe("found");

    expect(parsed.callUpNumber.value).toBe("NYSC/UNN/2026/782101");
    expect(parsed.callUpNumber.confidence).toBe("found");

    expect(parsed.campState.value).toBe("Enugu");
    expect(parsed.campState.confidence).toBe("found");

    // Missing fields should be empty and flagged "not found"
    expect(parsed.stateCode.value).toBe("");
    expect(parsed.stateCode.confidence).toBe("not found");
    expect(parsed.campName.value).toBe("");
    expect(parsed.campName.confidence).toBe("not found");
    expect(parsed.reportingDate.value).toBe("");
    expect(parsed.reportingDate.confidence).toBe("not found");
  });

  it("handles different label casings (all uppercase, lowercase, mixed case)", () => {
    const uppercaseText = `
NAME: FATIMA BELLO
CALL-UP NO.: NYSC/BUK/2026/009123
STATE CODE: KN/26A/0192
CAMP STATE: KANO
CAMP ADDRESS: NYSC ORIENTATION CAMP, KUSALLA DAM, KARAYE
REPORTING DATE: 2026-12-01
BATCH: BATCH A
STREAM: STREAM II
`;

    const parsedUpper = parseCallUpText(uppercaseText);
    expect(parsedUpper.fullName.value).toBe("FATIMA BELLO");
    expect(parsedUpper.callUpNumber.value).toBe("NYSC/BUK/2026/009123");
    expect(parsedUpper.stateCode.value).toBe("KN/26A/0192");
    expect(parsedUpper.campState.value).toBe("Kano");
    expect(parsedUpper.reportingDate.value).toBe("2026-12-01");
    expect(parsedUpper.stream.value).toBe("Stream 2");

    const lowercaseText = `
name: amina yusuf
call-up number: nysc/oau/2026/102948
state code: og/26b/0034
camp state: ogun
venue: nysc sagamu camp
report on or before: 15/10/2026
`;

    const parsedLower = parseCallUpText(lowercaseText);
    expect(parsedLower.fullName.value).toBe("amina yusuf");
    expect(parsedLower.callUpNumber.value).toBe("NYSC/OAU/2026/102948");
    expect(parsedLower.stateCode.value).toBe("OG/26B/0034");
    expect(parsedLower.campState.value).toBe("Ogun");
    expect(parsedLower.campName.value).toBe("nysc sagamu camp");
    expect(parsedLower.reportingDate.value).toBe("2026-10-15");
  });

  it("handles various date formats (DD/MM/YYYY, DD-MM-YYYY, Worded dates, ISO)", () => {
    // 1. DD/MM/YYYY
    const dmy = parseCallUpText("Date of Reporting: 24/11/2026");
    expect(dmy.reportingDate.value).toBe("2026-11-24");

    // 2. DD-MM-YYYY
    const dashed = parseCallUpText("Reporting Date: 05-08-2026");
    expect(dashed.reportingDate.value).toBe("2026-08-05");

    // 3. Worded Month DD, YYYY
    const worded = parseCallUpText("Report to camp on: 18th November 2026");
    expect(worded.reportingDate.value).toBe("2026-11-18");

    // 4. Month first: October 12, 2026
    const monthFirst = parseCallUpText("Commencement Date: October 12, 2026");
    expect(monthFirst.reportingDate.value).toBe("2026-10-12");
  });

  it("filters out irrelevant noise and surrounding narrative", () => {
    const noisyText = `
Forwarded message from group chat:
Hey guys, congratulations to everyone mobilised!
Here is my letter excerpt:

Congratulations! You have been deployed to Oyo State for youth service.
Corps Member Name: TOLULOPE AFOLAYAN
Call Up No: NYSC/UI/2026/554120
State Code: OY/26A/9012
Venue: NYSC Permanent Orientation Camp, Iseyin
Please report on 2026-11-20 without fail.

Make sure to bring your white shorts and socks guys!
See you at the gate.
`;

    const parsed = parseCallUpText(noisyText);
    expect(parsed.fullName.value).toBe("TOLULOPE AFOLAYAN");
    expect(parsed.callUpNumber.value).toBe("NYSC/UI/2026/554120");
    expect(parsed.stateCode.value).toBe("OY/26A/9012");
    expect(parsed.campState.value).toBe("Oyo");
    expect(parsed.reportingDate.value).toBe("2026-11-20");
  });

  it("does not false-positive match 'NATIONAL YOUTH SERVICE CORPS' as the full name", () => {
    const textWithHeader = `
NATIONAL YOUTH SERVICE CORPS
MOBILIZATION TIMETABLE
Call-up No: NYSC/FUTO/2026/012984
State Code: IM/26A/1102
`;

    const parsed = parseCallUpText(textWithHeader);
    expect(parsed.fullName.value).toBe("");
    expect(parsed.fullName.confidence).toBe("not found");
    expect(parsed.callUpNumber.value).toBe("NYSC/FUTO/2026/012984");
  });
});

describe("standardizeDate", () => {
  it("normalizes ISO dates", () => {
    expect(standardizeDate("2026-11-18")).toBe("2026-11-18");
  });

  it("normalizes DD/MM/YYYY and DD-MM-YYYY", () => {
    expect(standardizeDate("18/11/2026")).toBe("2026-11-18");
    expect(standardizeDate("05-04-2026")).toBe("2026-04-05");
  });

  it("normalizes worded dates with ordinals", () => {
    expect(standardizeDate("1st January 2027")).toBe("2027-01-01");
    expect(standardizeDate("22nd October 2026")).toBe("2026-10-22");
    expect(standardizeDate("3rd March, 2026")).toBe("2026-03-03");
  });

  it("returns null for non-date inputs", () => {
    expect(standardizeDate("")).toBeNull();
    expect(standardizeDate("not a date")).toBeNull();
  });
});

describe("calculateDaysRemaining", () => {
  it("calculates future days remaining correctly", () => {
    const ref = new Date("2026-11-10T12:00:00");
    const res = calculateDaysRemaining("2026-11-18", ref);
    expect(res).toEqual({ days: 8, status: "future" });
  });

  it("identifies today correctly", () => {
    const ref = new Date("2026-11-18T09:30:00");
    const res = calculateDaysRemaining("2026-11-18", ref);
    expect(res).toEqual({ days: 0, status: "today" });
  });

  it("calculates past dates correctly", () => {
    const ref = new Date("2026-11-25T15:00:00");
    const res = calculateDaysRemaining("2026-11-18", ref);
    expect(res).toEqual({ days: 7, status: "past" });
  });

  it("returns null for invalid date string", () => {
    expect(calculateDaysRemaining("invalid-date")).toBeNull();
  });
});

describe("formatDateDisplay", () => {
  it("formats ISO string into readable UK/Nigerian date", () => {
    const formatted = formatDateDisplay("2026-11-18");
    expect(formatted).toContain("Nov");
    expect(formatted).toContain("2026");
    expect(formatted).toContain("18");
  });
});
