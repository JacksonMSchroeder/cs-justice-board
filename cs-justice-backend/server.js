const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// 1. CONEXÃO SUPABASE
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// 2. ROTA DE API (DADOS)
app.get('/reports', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('reports')
            .select('*')
            .eq('approved', true) // 👈 SÓ TRAZ O QUE VOCÊ APROVOU NO PAINEL
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        console.error('Erro API:', error);
        res.status(500).json({ error: error.message });
    }
});

//ARQUIVOS ESTÁTICOS
app.use(express.static(path.join(__dirname, 'static')));


app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

//LIGAR SERVIDOR
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

