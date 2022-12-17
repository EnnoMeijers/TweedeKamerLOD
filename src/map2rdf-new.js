const fs = require('fs');

// The configuration file determines the data endpoints to harvest
const config = JSON.parse( fs.readFileSync('./src/config-test.json') );

// Build a mapping script based on the JSON data 
// Use a simple one-to-one mapping for eacht property
// Perform the actual mapping using the RML processor with the dynamicly build script
const map2rdf = async ( dataset ) => {

  // Type and properties get a default prefix based on the name of the ODATA endpoint
  const endpoint=dataset.endpoint.toLowerCase();
  const primarykey=dataset.primarykey;
  const subject = `<http://example.org/${endpoint}/PRIMARYKEY}>`;
  const type = `<https://example.org/${endpoint}/${dataset.endpoint}>`;
  const rdftype = '<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>';
  
  // read the data from file into a string 
  const datafile = ( fs.readFileSync( dataset.download ).toString() );
  const jsonfile = JSON.parse ( datafile );

  // Loop through all the datafiels and define a 
  // predicateObjectMap for each of them
  // Note: it looks like the ODATA API returns all the fields
  // for every records, regardless their value. 
  // So based on this we just use the first record in the data
  // to find the all the fields that need to be mapped.
  let result = "";
  let resource = "";
  for(const object in jsonfile){
    const uri = `<http://example.org/${endpoint}/${jsonfile[object][primarykey]}>`;
    resource = `${uri} ${rdftype} ${type} .\n`;
    for (const property in jsonfile[object]) {
        if(jsonfile[object][property]!=null){
          const pred = `<http://example.org/${endpoint}/${property.toLowerCase()}>`;
          const obj = `${jsonfile[object][property]}`;
          const triple = uri + ' ' + pred + ' "' + obj.toString() + '".\n';
          resource += triple;
        }
    }
    console.log(resource);
  }
  //console.log(result);

  // write the results to the outputfile 
  fs.writeFileSync( dataset.output, result );

  // do some logging
  //console.log( `Raw RDF data written to ${dataset.output}` );
};


// loop through all the configured datasets for mapping
async function runAll() {
  const datasets = config.downloadAndMap;
  return Promise.all( datasets.map( async( dataset ) => map2rdf( dataset ) ) )
}

runAll();

exports.runAll = runAll;

