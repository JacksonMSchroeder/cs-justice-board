const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const helmet = require('helmet'); // 1. Importar o helmet
const path = require('path');
require('dotenv').config();

const app = express();

// --- CONFIGURAÇÃO DE SEGURANÇA (HELMET) ---
// Configurado para aceitar os scripts e imagens do seu projeto
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https://*.supabase.co"], 
            connectSrc: ["'self'", "https://*.supabase.co"], 
        },
    },
}));

app.use(cors());
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// --- ROTAS DA API ---
app.get('/api/reports', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('reports')
            .select('*')
            .eq('approved', true)
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        console.error("Erro GET:", error.message);
        res.status(500).json({ error: "Erro ao buscar dados" });
    }
});

app.post('/api/reports', async (req, res) => {
    try {
        const { offender_steam_id, description, image, reporter } = req.body;
        const { data, error } = await supabase
            .from('reports')
            .insert([{ 
                offender_steam_id, 
                description, 
                image, 
                reporter, 
                approved: false 
            }]);
        
        if (error) throw error;
        res.status(201).json({ success: true });
    } catch (error) {
        console.error("Erro POST:", error.message);
        res.status(500).json({ error: "Erro ao salvar denúncia" });
    }
});

// --- ENTREGA DO FRONT-END (PASTA STATIC) ---
app.use(express.static(path.join(__dirname, 'static')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

app.get('/mural', (req, res) => res.sendFile(path.join(__dirname, 'static', 'mural.html')));
app.get('/contato', (req, res) => res.sendFile(path.join(__dirname, 'static', 'contato.html')));
app.get('/lei', (req, res) => res.sendFile(path.join(__dirname, 'static', 'lei.html')));

app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

// --- INICIALIZAÇÃO DO SERVIDOR ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 ==========================================`);
    console.log(`   TERMINAL CS:JUSTIÇA ATIVO NA PORTA ${PORT}`);
    console.log(`   LOCAL: http://localhost:${PORT}`);
    console.log(`==========================================\n`);
});