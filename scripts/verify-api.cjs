// HTTP health check for CityBike server, requiring only Node built-ins.
'use strict';
const assert = require('node:assert/strict');
const net = require('node:net');
const { spawn } = require('node:child_process');
const path = require('node:path');
async function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on('error', reject);
    server.listen(0,'127.0.0.1',() => { const port=server.address().port; server.close(()=>resolve(port)); });
  });
}
async function main() {
  const port=await freePort();
  const child=spawn(process.execPath,[path.join(__dirname,'..','server.js')],{
    cwd:path.resolve(__dirname,'..'), env:{...process.env,PORT:String(port)}, stdio:'ignore'
  });
  try {
    let healthy=false;
    for (let i=0;i<60;i++) {
      if(child.exitCode!==null) throw new Error(`Server stopped unexpectedly (exit ${child.exitCode})`);
      try {const r=await fetch(`http://127.0.0.1:${port}/health`);healthy=r.ok;if(healthy)break;}catch{}
      await new Promise(r=>setTimeout(r,100));
    }
    assert.ok(healthy,'Local server did not start');
    console.log('[OK] GET /health');
    const st=await fetch(`http://127.0.0.1:${port}/api/stations`);
    assert.equal(st.status,200);const body=await st.json();
    assert.equal(body.stations.length,4);
    assert.ok(body.stations.some(s=>s.name==='Riverside Park'&&s.bikes===0));
    console.log('[OK] GET /api/stations provides four stations and zero-bike fixture');
    const bad=await fetch(`http://127.0.0.1:${port}/api/reservations`,{
      method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({stationId:'riverside',email:'student@example.com'})});
    assert.equal(bad.status,422);
    console.log('[OK] POST /api/reservations rejects zero-bike station');
    const good=await fetch(`http://127.0.0.1:${port}/api/reservations`,{
      method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({stationId:'central',email:'student@example.com'})});
    assert.equal(good.status,201);
    const result=await good.json();assert.equal(result.stationId,'central');
    console.log('[OK] POST /api/reservations accepts valid request');
    const home=await fetch(`http://127.0.0.1:${port}/`);
    assert.equal(home.status,200);assert.match(await home.text(),/Find your next bike/);
    console.log('[OK] GET / serves complete CityBike application');
    console.log('5/5 HTTP checks passed (browser automation requires npm ci and Chromium).');
  } finally {child.kill();}
}
main().catch(err=>{console.error('[FAIL]',err.stack||err);process.exitCode=1;});
