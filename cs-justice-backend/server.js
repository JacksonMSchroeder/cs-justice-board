require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;
const axios = require('axios');
const cheerio = require('cheerio');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const PORT = process.env.PORT || 5000;
const DOMAIN = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;

// Configurações Básicas
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'cs-justice-secret', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'static')));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));
passport.use(new SteamStrategy({
    returnURL: `${DOMAIN}/auth/steam/return`,
    realm: `${DOMAIN}/`,
    apiKey: process.env.STEAM_API_KEY
}, (identifier, profile, done) => done(null, profile)));

// Status do Usuário
app.get('/api/user-status', (req, res) => {
    if (req.isAuthenticated()) {
        // Pega a foto média/grande do array da Steam
        const avatar = (req.user.photos && req.user.photos.length > 0) 
            ? req.user.photos[req.user.photos.length - 1].value 
            : 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg';

        res.json({
            logged: true,
            user: {
                name: req.user.displayName,
                avatar: avatar
            }
        });
    } else {
        res.json({ logged: false });
    }
});

// ROTA POST: Criação de Denúncia
app.post('/api/reports', upload.single('arquivo'), async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Login necessário." });

    try {
        let { offender_steam_id, description } = req.body;
        let input = offender_steam_id.trim();
        let finalSteamId = "";
        let profileUrl = "";

        // 1. Lógica de Identificação (URL ou ID Direto)
        if (input.includes('steamcommunity.com')) {
            profileUrl = input.endsWith('/') ? input : input + '/';
            const parts = profileUrl.split('/');
            const lastPart = parts[parts.length - 2];

            if (profileUrl.includes('/id/')) {
                const resURL = await axios.get(`https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/`, {
                    params: { key: process.env.STEAM_API_KEY, vanityurl: lastPart }
                });
                finalSteamId = resURL.data.response.success === 1 ? resURL.data.response.steamid : lastPart;
            } else {
                finalSteamId = lastPart;
            }
        } else {
            finalSteamId = input;
            profileUrl = `https://steamcommunity.com/profiles/${finalSteamId}/`;
        }

        // 2. Captura de Dados (API Oficial + Scraping de segurança)
        let offenderName = `SUSPEITO_${finalSteamId.slice(-6)}`;
        let offenderAvatar = "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg";

        try {
            // Tenta pela API Primeiro (Avatar garantido mesmo em perfil privado)
            const steamRes = await axios.get(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/`, {
                params: { key: process.env.STEAM_API_KEY, steamids: finalSteamId }
            });

            if (steamRes.data.response.players.length > 0) {
                const player = steamRes.data.response.players[0];
                offenderName = player.personaname || offenderName;
                offenderAvatar = player.avatarfull || player.avatar || offenderAvatar;
            }

            // Tenta Scraping apenas para o Nick (caso a API demore a atualizar o nome)
            const response = await axios.get(profileUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const $ = cheerio.load(response.data);
            const scrapedName = $('.actual_persona_name').text().trim();
            if (scrapedName) offenderName = scrapedName;
            
        } catch (e) { console.log("Erro na busca de dados Steam (Scraping/API). Usando valores padrão."); }

        // 3. Upload de Evidência (Supabase Storage)
        let fileUrl = null;
        if (req.file) {
            const fileName = `evidencia-${Date.now()}${path.extname(req.file.originalname)}`;
            const { error: upErr } = await supabase.storage.from('evidencias').upload(fileName, req.file.buffer);
            if (!upErr) fileUrl = supabase.storage.from('evidencias').getPublicUrl(fileName).data.publicUrl;
        }

        // 4. Inserção no Banco de Dados
        const { error: dbErr } = await supabase.from('reports').insert([{
            reporter: req.user.displayName,
            offender_steam_id: String(finalSteamId),
            offender_name: offenderName,
            description,
            avatarsteam: offenderAvatar, // Agora garantido pela API
            evidence_url: fileUrl,
            approved: false
        }]);

        if (dbErr) throw dbErr;
        res.status(200).json({ success: true });

    } catch (err) { 
        console.error("Erro Geral:", err);
        res.status(500).json({ error: "Erro interno ao processar denúncia." }); 
    }
});

// ROTA GET: Busca Denúncias Aprovadas
app.get('/api/reports', async (req, res) => {
    const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('approved', true)
        .order('created_at', { ascending: false });
    
    if (error) return res.status(500).json([]);
    res.json(data || []);
});

// Páginas
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'static', 'index.html')));
app.get('/mural', (req, res) => res.sendFile(path.join(__dirname, 'static', 'mural.html')));
app.get('/lei', (req, res) => res.sendFile(path.join(__dirname, 'static', 'lei.html')));
app.get('/contato', (req, res) => res.sendFile(path.join(__dirname, 'static', 'contato.html')));

// Auth Steam
app.get('/auth/steam', passport.authenticate('steam'));
app.get('/auth/steam/return', passport.authenticate('steam', { failureRedirect: '/' }), (req, res) => res.redirect('/mural'));
app.get('/logout', (req, res) => req.logout(() => res.redirect('/')));

app.listen(PORT, () => console.log(`🚀 Servidor CS:Justiça rodando em ${PORT}`));