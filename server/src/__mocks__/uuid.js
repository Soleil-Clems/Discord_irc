'use strict';
let counter = 0;
module.exports = { v4: () => `mock-uuid-${++counter}`, v1: () => `mock-uuid-v1-${++counter}`, v3: () => `mock-uuid-v3`, v5: () => `mock-uuid-v5` };
