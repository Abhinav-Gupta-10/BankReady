async function run() {
  const r = await fetch('http://localhost:3000');
  const html = await r.text();
  const match = html.match(/href="(\/_next\/static\/chunks\/[^"]+\.css)"/);
  if (match) {
    const cssUrl = 'http://localhost:3000' + match[1];
    const cssRes = await fetch(cssUrl);
    const text = await cssRes.text();
    console.log('CSS URL:', cssUrl);
    console.log('CSS Size bytes:', text.length);
    console.log('Contains flex:', text.includes('flex'));
    console.log('Contains w-5 or w-10:', text.includes('w-5') || text.includes('w-10') || text.includes('width:'));
    console.log('Sample preview:', text.substring(0, 200));
  } else {
    console.log('No CSS tag found in HTML');
  }
}
run();
