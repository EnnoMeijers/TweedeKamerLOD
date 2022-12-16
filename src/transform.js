const fs = require('fs');

// Use the Comunica query library to run SPARQL CONSTRUCT queries.
// These queries are being used to do more advanced transformation of the data.
// Note: a lot could be done with RML as well but using SPARQL CONSTRUCT queries
// is a more verisatile and less complex. 
const QueryEngine = require('@comunica/query-sparql-file').QueryEngine;
const myEngine = new QueryEngine();

const config = JSON.parse( fs.readFileSync('./src/config.json') );

async function transform( dataset ) {
    if( dataset.skip ){
      return
    }
    const query = fs.readFileSync( dataset.query )
          .toString()
          .replace(/BASE_URI/g,config.baseUri)
          .replace(/API_URL/g,config.odataApi)
          .replace(/https:\/\/example.org\/ontology\//g,config.ontology);
    //console.log(query);
    const sources = dataset.sources.split(",");
    console.log(`Starting sparql query with ${dataset.query}, ${dataset.sources} and ${dataset.output}`);
    const result = await myEngine.query(query, { sources: sources, });
    const { data } = await myEngine.resultToString(result,'text/turtle');
    const writeStream = fs.createWriteStream(dataset.output);
    data.pipe( writeStream );
    return new Promise(fulfill => writeStream.on("finish", fulfill));
  }
  
  async function runAll() {
    const datasets = config.transform;
    return Promise.all( datasets.map( async( dataset ) => transform( dataset ) ))
  }

  exports.runAll = runAll;