const {createClient} = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_PUBLISH_KEY;

const supabase = createClient(url, key);

module.exports = supabase;