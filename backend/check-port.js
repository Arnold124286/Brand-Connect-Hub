const {execSync}=require('child_process');
try {
  const out = execSync('netstat -ano', {encoding:'utf8'});
  const lines = out.split(/\r?\n/).filter(l => l.includes(':5000'));
  console.log('PORT5000 LINES:', lines.length);
  lines.forEach(l => console.log(l));
} catch (e) {
  console.error('ERROR', e.message);
}
