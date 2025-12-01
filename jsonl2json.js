const fs = require('fs');
const readline = require('readline');

async function convertJsonlToJson(jsonlFilePath, jsonFilePath) {
  const fileStream = fs.createReadStream(jsonlFilePath);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const outputStream = fs.createWriteStream(jsonFilePath);

  outputStream.write('[\n');

  let isFirstLine = true;

  for await (const line of rl) {
    if (line.trim()) {
      try {
        if (!isFirstLine) {
          outputStream.write(',\n');
        }

        outputStream.write(line);
        isFirstLine = false;
      } catch (error) {
        console.error('Error processing line:', line, error);
      }
    }
  }


  outputStream.write('\n]');
  outputStream.end();

  console.log(`Successfully converted ${jsonlFilePath} to ${jsonFilePath}`);
}

const inputFile = '/home/northway/Documents/hackathons/ebpf-hackathon/tetra_log_v8.jsonl';
const outputFile = '/home/northway/Documents/hackathons/ebpf-hackathon/tetra_log_v8.json';

convertJsonlToJson(inputFile, outputFile).catch(console.error);