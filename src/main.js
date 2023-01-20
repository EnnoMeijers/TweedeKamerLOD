const download = require('./download');
const transform = require('./transform');
const map2rdf = require('./map2rdf')

async function runAll() {
  console.log("Starting with download step...");
  await download.runAll();
  console.log("Starting with for mapping step...");
  await map2rdf.runAll();
  console.log("Starting with transformation step...");
  // the transformation is run synchronous in order to avoid memory problems 
  transform.runAll();
}

runAll();