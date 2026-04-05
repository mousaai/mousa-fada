const pdfjsLib = require('pdfjs-dist/build/pdf.js');
const { createCanvas } = require('canvas');
const fs = require('fs');

async function test() {
  const data = new Uint8Array(fs.readFileSync('/home/ubuntu/upload/ARCHM04(6).pdf'));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  console.log('Pages:', doc.numPages);
  
  const page = await doc.getPage(6);
  const viewport = page.getViewport({ scale: 1.5 });
  const canvas = createCanvas(viewport.width, viewport.height);
  const ctx = canvas.getContext('2d');
  await page.render({ canvasContext: ctx, viewport }).promise;
  const buf = canvas.toBuffer('image/png');
  fs.writeFileSync('/tmp/test_page6.png', buf);
  console.log('OK: saved /tmp/test_page6.png, size:', buf.length);
}
test().catch(e => console.log('ERROR:', e.message));
