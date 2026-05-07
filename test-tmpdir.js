const os = require('os');
const path = require('path');
const fs = require('fs');

const p = path.join(os.tmpdir(), 'crucible-0g-mock-storage.json');
console.log("Temp dir:", os.tmpdir());
console.log("File exists:", fs.existsSync(p));
