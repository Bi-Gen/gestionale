require('dotenv').config({path:'.env.local'});
const {createClient}=require('@supabase/supabase-js');
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);

(async()=>{
  const {data}=await s.from('aliquota_iva').select('*').order('percentuale');
  console.log('Aliquote IVA presenti:');
  if(data && data.length>0){
    data.forEach(a=>console.log(`  - ${a.percentuale}% ${a.descrizione} (ID:${a.id})`));
  }else{
    console.log('  Nessuna aliquota trovata - tabella vuota!');
  }
})();
