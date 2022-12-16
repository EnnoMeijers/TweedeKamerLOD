const fs = require('fs');

// The RocketRML library is used to map json data to RDF using RML scripts.
// The mappings is a basic one-to-one mapping from the json fields to 
// basic rdf properties. 
// See https://github.com/semantifyit/RocketRML for more details.
const rmlparser = require('rocketrml');

// The configuration file determines the data endpoints to harvest and which
// RML scipts and SPARQL queries to use.
const config = JSON.parse( fs.readFileSync('./src/config.json') );

// generic prefix used for all the RML conversions
const rml_std_prefixes = "\
    @prefix rml: <http://semweb.mmlab.be/ns/rml#> .\n\
    @prefix rr: <http://www.w3.org/ns/r2rml#> .\n\
    @prefix ql: <http://semweb.mmlab.be/ns/ql#> .\n\
    @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .\n\
    @prefix : <http://example.org/rules/> .\n\
    @prefix schema: <http://schema.org/> .\n\
    @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .\n";

// Build a mapping script based on the JSON data 
// Use a simple one-to-one mapping for eacht property
// Perform the actual mapping using the RML processor with the dynamicly build script
const map2rdf = async ( dataset ) => {

  // Type and properties get a default prefix based on the name of the ODATA endpoint
  const endpoint=dataset.endpoint.toLowerCase();
  const rml_spec_prefixes = `@prefix tkprop: <https://example.org/${endpoint}/> . \n`
  
  // Define the LogicalSource 
  // The DATAFILE var is replace by the real data serialized 
  // as a string when the RML processor is called
  let mapscript = rml_std_prefixes + rml_spec_prefixes;
  mapscript += "\n\
  :TriplesMap a rr:TriplesMap;\n\
  rml:logicalSource [\n\
    rml:source 'DATAFILE';\n\
    rml:referenceFormulation ql:JSONPath;\n\
    rml:iterator '$.[*]'\n\
  ].\n";

  // Define the URI to be used as subject identifier
  mapscript += `\n\
  :TriplesMap rr:subjectMap [\n\
    rr:template "http://example.org/${endpoint}/{Id}"\n\
  ].\n`;

  // Define the predicateObjectMap for the type
  mapscript += `\n\
  :TriplesMap rr:predicateObjectMap [\n\
    rr:predicate rdf:type;\n\
    rr:objectMap [\n\
      rr:constant tkprop:${dataset.endpoint}\n\
    ]\n\
  ].\n`;

  // read the data from file into a string 
  const datafile = ( fs.readFileSync( dataset.download).toString() );
  const jsonfile = JSON.parse ( datafile );

  // Loop through all the datafiels and define a 
  // predicateObjectMap for each of them
  // Note: it looks like the ODATA API returns all the fields
  // for every records, regardless their value. 
  // So based on this we just use the first record in the data
  // to find the all the fields that need to be mapped.
  for(var key in jsonfile[0]){
    mapscript += `\n\
    :TriplesMap rr:predicateObjectMap [ \n\
        rr:predicate tkprop:${key.toLowerCase()}; \n\
        rr:objectMap [ \n\
          rml:reference "${key}" \n\
        ] \n\
      ].`
  }

  // set some options for the RML processing 
  const options = { toRDF: true, verbose: false, xmlPerformanceMode: false, replace: false };

  // do a live transformation; pass the mapping and inputfile as strings
  // the DATAFILE is a placeholder in the mappingscript for the real inputfile serialized as a string
  const result = await rmlparser.parseFileLive( mapscript, { DATAFILE: datafile }, options )
                                .catch( (err) => { console.log(err); } );

  // write the results to the outputfile 
  fs.writeFileSync( dataset.output, result );

  // do some logging
  console.log( `Mapped data using auto generated RML script written to ${dataset.output}` );
};

// loop through all the configured datasets for mapping
async function runAll() {
  const datasets = config.downloadAndMap;
  return Promise.all( datasets.map( async( dataset ) => map2rdf( dataset ) ) )
}

exports.runAll = runAll;