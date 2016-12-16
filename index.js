#!/usr/bin/env node

const http = require('http');
const fs   = require('fs');
const path = require('path');
const program = require('commander');

program
 .option('-f, --filename <filename>', 'The video file')
 .option('-l, --language <language>', 'The subtitle language')

program.on('--help', () => {
  console.log('    Example')
  console.log('')
  console.log('    subtitle -f video.mp4 -l eng')
  console.log('')
})
 
program.parse(process.argv);

const languages = {
  'pob' : 'pb',
  'eng': 'en'
}

const file                 = program.filename
const language             = program.language || 'pob';

if (!file) {
  console.log('Terminating...')
  process.exit(1)
}

const finalFilename        = path.isAbsolute(file) ? file : `${process.cwd()}/${file}`;

const baseName             = path.basename(finalFilename);
const dirName              = path.dirname(finalFilename);
const extension            = path.extname(finalFilename);
const subtitleName         = baseName.replace(extension, '.srt');

const OS = require('opensubtitles-api');
const OpenSubtitles = new OS("OSTestUserAgentTemp");


console.log("Downloading subtitle...")
OpenSubtitles.extractInfo(finalFilename)  
    .then(infos => {
      OpenSubtitles.search({
          sublanguageid: language, 
          hash: infos.moviehash, 
          extensions: ['srt'], 
          limit: '10', 
      }).then(subtitles => {
          const subtitle = subtitles[languages[language]].sort((a,b) => a.score > b.score ? -1 : 1)[0];
          const file = fs.createWriteStream(`${dirName}/${subtitleName}`);
          http.get(subtitle.url, response => {
            response.pipe(file)
            file.on('finish', () => file.close())
            console.log('Subtitle Downloaded successfully.')
          })
      });
    })