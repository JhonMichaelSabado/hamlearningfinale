const path = require('path');
const tasks = require('./routes/tasks');
console.log('Type of tasks:', typeof tasks);
console.log('Is Router function?', tasks && typeof tasks === 'function');
console.dir(tasks, { depth: 2 });
