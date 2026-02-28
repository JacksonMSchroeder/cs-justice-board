const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet'); // <--- proteçao
require('dotenv').config();

const app = express();

// Segurança Básica
app.use(helmet({
    contentSecurityPolicy: false, //  scripts externos
}));
app.use(cors());
app.use(express.json());

// CONEXÃO SUPABASE
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// 2. ROTA DE API (DADOS)
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
        console.error('Erro na busca de reports:', error.message);
        res.status(500).json({ error: "Erro interno no servidor" }); // Não expor dados
    }
});

// ARQUIVOS ESTÁTICOS
app.use(express.static(path.join(__dirname, 'static')));

// SPA Fallback 
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

// LIGAR SERVIDOR
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor em Produção na porta ${PORT}`);
});