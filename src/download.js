const fs = require('fs');
const axios = require('axios');

//const rawdata = fs.readFileSync('./src/config.json');
const config = JSON.parse( fs.readFileSync('./src/config.json') );

// Simple download function that loops through the
// 'next' links to collect all the data from and endpoint
async function downloadEndpoint( dataset ) {
  if( dataset.skip ) {
    console.log( `Skipped ${dataset.endpoint}` )
    return
  }
  const odataApi = config.odataApi;
  const baseFilename = config.datadir + dataset.endpoint.toLowerCase();
  //const outputfile = dataset.download;
  console.log( `Starting with download from ${dataset.endpoint}` )
  let records = [];
  let url = `${odataApi}${dataset.endpoint}`;
  if(dataset.parameters) {
    url += `?${dataset.parameters}`;
  }
  let downloadedPages = 0;
  let filecounter = 0;
  let downloadfiles = [];
  let outputfile = `${baseFilename}${filecounter}.json`
  do {
    await axios
      .get( url )
      .then( async function ( result ) {
        const data = await result.data.value;
        url = result.data['@odata.nextLink']
        records.push(...data);
        downloadedPages += 1;
        if( downloadedPages == config.maxDownloadPages ) {
          fs.writeFileSync( outputfile, JSON.stringify( records ) );
          console.log( '\nWritten',records.length,'records from endpoint', dataset.endpoint,'to',outputfile );
          downloadfiles.push(outputfile);
          records = [];
          downloadedPages = 0;
          filecounter += 1;
          outputfile = `${baseFilename}${filecounter}.json`;   
        }
      })
      .catch( function ( error ) {
          console.log( error.code );
          url = false;
      });
  } while( url )
  if( downloadedPages != 0 ) {
    fs.writeFileSync( outputfile, JSON.stringify( records ) );
    console.log( '\nWritten',records.length,'records from',dataset.endpoint,'endpoint to',outputfile );
    downloadfiles.push(outputfile);
  }
  fs.writeFileSync( `${baseFilename}.json`, JSON.stringify( downloadfiles ) );
  console.log( `Downloaded all data from ${dataset.endpoint} endpoint, see ${baseFilename}.json for filelist.`  );  
}

async function runAll() {
  const datasets = config.downloadAndMap;
  return Promise.all( datasets.map( async( dataset ) => downloadEndpoint( dataset ) ) )
}

exports.runAll = runAll;