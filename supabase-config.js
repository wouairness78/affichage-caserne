// Infos Supabase : Project Settings > API
// Utilise uniquement la clé anon/public. Ne mets jamais la clé service_role ici.
const SUPABASE_URL = "https://fvszumgisgksxwdgjijt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2c3p1bWdpc2drc3h3ZGdqaWp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNzQ4NjksImV4cCI6MjA5NDk1MDg2OX0.1b0gNvnWK36H34rmykFNEtjM4ExUeKOaM7po8ImIf3s";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
