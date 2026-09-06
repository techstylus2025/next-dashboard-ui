import { loadGradingLevels } from '../src/lib/gradingData';

(async function run(){
  try{
    const rows = await loadGradingLevels();
    console.log('Grading levels after ensureDefault:', rows);
  }catch(err){
    console.error('Error ensuring grading levels:', err);
    process.exitCode = 1;
  }
})();
