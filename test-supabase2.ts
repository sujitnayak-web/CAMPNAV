import { supabase } from './src/lib/supabase';

async function run() {
  const { data, error } = await supabase.from('campus_nodes').select('*');
  console.log("NODES:", data?.length);
  console.log("ERROR:", error);
}
run();
