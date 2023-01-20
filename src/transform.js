// TODO make synchronous to avoid out-of-memory problems!

const fs = require('fs');

const { exec, execSync } = require('child_process');

const config = JSON.parse( fs.readFileSync('./src/config.json') );

function transformWithJava( dataset, sources, queryPattern, outputFile ) {

  let queryFile = queryPattern
  if ( !queryPattern ) {
    queryFile = `./data/${dataset.endpoint}.rq`;
  }
  const query = fs.readFileSync( dataset.query )
  .toString()
  .replace(/BASE_URI/g,config.baseUri)
  .replace(/API_URL/g,config.odataApi)
  .replace(/https:\/\/example.org\/ontology\//g,config.ontology);
  //console.log(queryFilePath, query);
  fs.writeFileSync( queryFile, query,(err) => {
    if (err) throw err;
  });
  const sourceList = sources.split(",");
  let datastr=""
  for ( i in sourceList ) {
    datastr += ` --data=${sourceList[i]}`
  }
  const cmd=`sparql --query=${queryFile} ${datastr} > ${outputFile}\n rm ${queryFile}`;
  console.log("command:",cmd);
  execSync(cmd, (err, stdout, stderr) => {
    if (err) {
      //some err occurred
      console.error(err)
    } else {
     // the *entire* stdout and stderr (buffered)
     if(stderr) {
      console.log(`stderr: ${stderr}`);
     }
    }
  });
  
}

const transformEachFile = ( dataset ) => {
    if( dataset.skip ){
      console.log(`Skipping ${dataset.endpoint}`);
      return
    }
    //console.log( "Starting transformation with", dataset.endpoint );
    // normally the sources are derived from the download files
    // in special cases it is needed to define the input sources by hand
    // in that case the 'sources' and 'output' parameters should be defined in config.js
    if( dataset.sources ){
      if( !dataset.output ) {
        console.log(`Error: output parameter not defined in config.json for ${dataset.endpoint}`);
        return
      }
      console.log( `Calling transform for ${dataset.endpoint} with ${dataset.sources} and ${dataset.output}`);
      transformWithJava( dataset, dataset.sources, null, dataset.output );
    }
    else {
      downloadedFiles = `${config.datadir}${dataset.endpoint.toLowerCase()}.json`
      const filelist = JSON.parse( fs.readFileSync( downloadedFiles ) )
      for( key in filelist ) {
        const rawRdfFile = filelist[key].replace(".json",".nt");
        const outputFile = filelist[key].replace(".json","-schema.ttl");
        const queryFile = filelist[key].replace(".json",".rq");
        console.log( `Calling transform for ${dataset.endpoint} with ${rawRdfFile} and ${outputFile}`);
        transformWithJava( dataset, rawRdfFile, queryFile, outputFile );
      }
    }
 }

/*
async function transformWithJava( dataset, sources, queryPattern, outputFile ) {

  let queryFile = queryPattern
  if ( !queryPattern ) {
    queryFile = `./data/${dataset.endpoint}.rq`;
  }
  const query = fs.readFileSync( dataset.query )
  .toString()
  .replace(/BASE_URI/g,config.baseUri)
  .replace(/API_URL/g,config.odataApi)
  .replace(/https:\/\/example.org\/ontology\//g,config.ontology);
  //console.log(queryFilePath, query);
  fs.writeFileSync( queryFile, query,(err) => {
    if (err) throw err;
  });
  const sourceList = sources.split(",");
  let datastr=""
  for ( i in sourceList ) {
    datastr += ` --data=${sourceList[i]}`
  }
  const cmd=`sparql --query=${queryFile} ${datastr} > ${outputFile}\n rm ${queryFile}`;
  console.log("command: ",cmd);
  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      //some err occurred
      console.error(err)
    } else {
     // the *entire* stdout and stderr (buffered)
     if(stderr) {
      console.log(`stderr: ${stderr}`);
     }
    }
  });
  
}


  const transformEachFile = async ( dataset ) => {
    if( dataset.skip ){
      console.log(`Skipping ${dataset.endpoint}`);
      return
    }
    //console.log( "Starting transformation with", dataset.endpoint );
    // normally the sources are derived from the download files
    // in special cases it is needed to define the input sources by hand
    // in that case the 'sources' and 'output' parameters should be defined in config.js
    if( dataset.sources ){
      if( !dataset.output ) {
        console.log(`Error: output parameter not defined in config.json for ${dataset.endpoint}`);
        return
      }
      console.log( `Calling transform for ${dataset.endpoint} with ${dataset.sources} and ${dataset.output}`);
      await transformWithJava( dataset, dataset.sources, null, dataset.output );
    }
    else {
      downloadedFiles = `${config.datadir}${dataset.endpoint.toLowerCase()}.json`
      const filelist = JSON.parse( fs.readFileSync( downloadedFiles ) )
      for( key in filelist ) {
        const rawRdfFile = filelist[key].replace(".json",".nt");
        const outputFile = filelist[key].replace(".json","-schema.ttl");
        const queryFile = filelist[key].replace(".json",".rq");
        console.log( `Calling transform for ${dataset.endpoint} with ${rawRdfFile} and ${outputFile}`);
        await transformWithJava( dataset, rawRdfFile, queryFile, outputFile );
      }
    }
  }

  async function runAll() {
    const datasets = config.transform;
    return Promise.all( datasets.map( async( dataset ) => transformEachFile( dataset ) ))
  }
*/
  function runAll() {
    const datasets = config.transform;
    return datasets.map( ( dataset ) => transformEachFile( dataset ) )
  }

  exports.runAll = runAll;