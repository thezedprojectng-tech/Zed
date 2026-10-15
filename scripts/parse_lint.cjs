/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const data = JSON.parse(fs.readFileSync("scratch_lint.json", "utf8"));
let errorCount = 0;
let warnCount = 0;
data.filter(f => f.messages.length > 0).forEach(f => {
  const rel = f.filePath.replace(/^.*ZedProject[\\/]/, "");
  console.log(`\n=== ${rel} ===`);
  f.messages.forEach(m => {
    if (m.severity === 2) errorCount++;
    else warnCount++;
    console.log(`  [${m.severity === 2 ? 'ERR ' : 'WARN'}] line ${m.line}:${m.column} (${m.ruleId}): ${m.message.split('\n')[0]}`);
  });
});
console.log(`\nTOTAL: ${errorCount} errors, ${warnCount} warnings`);
