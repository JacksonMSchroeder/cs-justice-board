const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const helmet = require('helmet'); //segurança
const path = require('path');
const axios = require('axios'); 
const multer = require('multer'); //audio e video 
require('dotenv').config();

const app = express();


const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 } // Limite de 25MB
});

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https://*.supabase.co", "https://avatars.steamstatic.com", "https://*.steampowered.com", "https://*.steamstatic.com", "https://community.cloudflare.steamstatic.com"], 
            mediaSrc: ["'self'", "https://*.supabase.co", "data:"],
            connectSrc: ["'self'", "https://*.supabase.co", "https://cs-justice-board.onrender.com"], 
        },
    },
}));

app.use(cors());
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'static')))

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// ROTAS DA API

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

// ROTA POST 
app.post('/api/reports', upload.single('arquivo'), async (req, res) => { 
    try {
        const { offender_steam_id, description, reporter } = req.body;
        const file = req.file; // arquivo
        const STEAM_API_KEY = process.env.STEAM_API_KEY;
        
        let finalEvidenceUrl = null;

        // 1. SE HOUVER ARQUIVO, FAZ UPLOAD PRO STORAGE
        if (file) {
            const fileName = `${Date.now()}-${file.originalname}`;
            const { data: storageData, error: storageError } = await supabase.storage
                .from('evidencias') // storage
                .upload(fileName, file.buffer, {
                    contentType: file.mimetype,
                    upsert: false
                });

            if (storageError) throw storageError;

            //  link 
            const { data: urlData } = supabase.storage
                .from('evidencias')
                .getPublicUrl(fileName);
            
            finalEvidenceUrl = urlData.publicUrl;
        }

        // NOME, AVATAR E BANS
        let offender_name = "Não Identificado";
        let avatarsteam = "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg";
        let vac_status = "Limpa";

        try {
            const [resSteam, resBans] = await Promise.all([
                axios.get(`http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${offender_steam_id}`),
                axios.get(`http://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?key=${STEAM_API_KEY}&steamids=${offender_steam_id}`)
            ]);

            const player = resSteam.data.response.players[0];
            if (player) {
                offender_name = player.personaname;
                avatarsteam = player.avatarfull;
            }

            const banData = resBans.data.players[0];
            if (banData && (banData.VACBanned || banData.NumberOfGameBans > 0)) {
                vac_status = "Banido";
            }
        } catch (e) { console.error("Erro na comunicação com a API da Valve"); }

        // 'reports'
        const { error: dbError } = await supabase
            .from('reports')
            .insert([{ 
                offender_steam_id, 
                description, 
                evidence_url: finalEvidenceUrl, // link arq
                reporter, 
                offender_name,
                avatarsteam,
                vac_status, 
                approved: false 
            }]);
        
        if (dbError) throw dbError;
        res.status(201).json({ success: true });

    } catch (error) {
        console.error("Erro POST:", error.message);
        res.status(500).json({ error: "Erro ao salvar denúncia" });
    }
    
});

// --- FRONT-END ---
app.use(express.static(path.join(__dirname, 'static')));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'static', 'index.html')));
app.get('/mural', (req, res) => res.sendFile(path.join(__dirname, 'static', 'mural.html')));
app.get('/contato', (req, res) => res.sendFile(path.join(__dirname, 'static', 'contato.html')));
app.get('/lei', (req, res) => res.sendFile(path.join(__dirname, 'static', 'lei.html')));

app.get(/^\/(?!api).*/, (req, res) => res.sendFile(path.join(__dirname, 'static', 'index.html')));

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 ==========================================`);
    console.log(`   TERMINAL CS:JUSTIÇA ATIVO NA PORTA ${PORT}`);
    console.log(`   PROCESSAMENTO DE MÍDIA: ATIVADO`);
    console.log(`==========================================\n`);
});