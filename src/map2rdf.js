const fs = require('fs');

// The configuration file determines the data endpoints to harvest
const config = JSON.parse( fs.readFileSync('./src/config.json') );

let bnCounter = 0 ;

function cleanUp(rawValue){
  let strVal = rawValue.toString();
  strVal = strVal.replace(/\\/g,'');  // remove all backslahes 
  strVal = strVal.replace(/"/g,"'");  // replace all dubble quotes with single quotes
  strVal = strVal.replace(/(\r\n|\n|\r)/gm,''); // remove newlines
  return strVal;
}

function createBlankNode( endpoint, uri, property, object, fileNumber ) {
  const bnId = `_:f${fileNumber}b${bnCounter}`;
  const pred = `<http://example.org/${endpoint}/${property.toLowerCase()}>`;
  let triples = `${uri} ${pred} ${bnId} . \n`;
  for( field in object) {
    if( object[field] != null ) {
      const predField = `<http://example.org/${property.toLowerCase()}/${field.toLowerCase()}>`;
      propObj = `${bnId} ${predField} "${cleanUp(object[field])}" . \n`
      triples += propObj; 
    }
  }
  bnCounter ++;
  return triples;
}

function expand( endpoint, uri, property, object, fileNumber ){
  if( object.constructor === Array ) {
    let triples = '';
    for( obj in object ) {
      const record = object[obj]
      triples += createBlankNode( endpoint, uri, property, record, fileNumber );
    }
    return triples;
  }
  else {
    return createBlankNode( endpoint, uri, property, object, fileNumber );
  }
}

// Build a mapping script based on the JSON data 
// Use a simple one-to-one mapping for eacht property
// Perform the actual mapping using the RML processor with the dynamicly build script
const map2rdf = async ( dataset, downloadfile, outputfile, fileNumber ) => {

  // Type and properties get a default prefix based on the name of the ODATA endpoint
  const endpoint=dataset.endpoint.toLowerCase();
  const primarykey=dataset.primarykey;
  const type = `<http://example.org/${endpoint}/${dataset.endpoint}>`;
  const rdftype = '<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>';
  bnCounter = 0 ;
  // read the data from file into a string 
  const datafile = ( fs.readFileSync( downloadfile ).toString() );
  const jsonfile = JSON.parse ( datafile );
  fs.writeFileSync( outputfile,'',(err) => {
    if (err) throw err;
  });

  // Loop through all the datafiels and define a 
  // predicateObjectMap for each of them
  // Note: it looks like the ODATA API returns all the fields
  // for every records, regardless their value. 
  // So based on this we just use the first record in the data
  // to find the all the fields that need to be mapped.
  let resource = "";
  console.log(`Starting with mapping ${downloadfile}`);
  for( const object in jsonfile ){
    const uri = `<http://example.org/${endpoint}/${jsonfile[object][primarykey]}>`;
    resource = `${uri} ${rdftype} ${type} .\n`;
    for ( const property in jsonfile[object] ) {
        const propertyValue = jsonfile[object][property];
        if( propertyValue != null ){
          if( typeof propertyValue === 'object' ) {
            resource += expand( endpoint, uri, property, propertyValue, fileNumber );
          }
          else {
            const pred = `<http://example.org/${endpoint}/${property.toLowerCase()}>`;
            const obj = cleanUp(propertyValue);
            const triple = uri + ' ' + pred + ' "' + obj + '".\n';
            resource += triple;
          }
        }
    }
    fs.appendFileSync( outputfile, resource );
  }
  // do some logging
  console.log( `Raw RDF data written to ${outputfile}` );
};

const mapEachFile = async ( dataset ) => {

  if( dataset.skip ) {
    console.log( `Skipped ${dataset.endpoint}` )
    return
  }
  console.log( "starting with", dataset.endpoint );
  downloadFiles = `${config.datadir}${dataset.endpoint.toLowerCase()}.json`
  const filelist = JSON.parse( fs.readFileSync( downloadFiles ) )
  //console.log( "filelist", filelist );
  for( key in filelist ) {
    const downloadfile = filelist[key];
    const outputfile = filelist[key].replace(".json",".nt");
    console.log( `Calling map2rdf for ${dataset.endpoint} with ${downloadfile} and ${outputfile}`);
    await map2rdf( dataset, downloadfile, outputfile, key );
  }
}

// loop through all the configured datasets for mapping
async function runAll() {
  const datasets = config.downloadAndMap;
  return Promise.all( datasets.map( async( dataset ) => mapEachFile( dataset ) ) )
}

exports.runAll = runAll;

