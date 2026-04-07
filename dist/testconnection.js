import pkg from 'pg';
const { Client } = pkg;
const client = new Client({
    user: 'postgres.ahzygltossesuvipbptc',
    host: 'aws-0-eu-west-1.pooler.supabase.com',
    database: 'postgres',
    password: 'RMAhCAsuM3uJcGUx',
    port: 6543,
    ssl: { rejectUnauthorized: false }
});
client.connect()
    .then(() => {
    console.log('✅ Node can connect to Supabase!');
    return client.end();
})
    .catch(err => {
    console.error('❌ Node cannot connect:', err.message);
});
