require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const axios = require('axios'); 
const multer = require('multer'); 
const session = require('express-session');
const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;

const app = express();


app.set('trust proxy', 1);


console.log("------------------------------------------");
console.log("SISTEMA DE CHECAGEM DE CHAVES:");
console.log("SUPABASE URL:", process.env.SUPABASE_URL ? "CONFIGURADO ✅" : "FALTANDO ❌");
console.log("STEAM API KEY:", process.env.STEAM_API_KEY ? "CONFIGURADA ✅" : "FALTANDO ❌");
console.log("------------------------------------------");

// MULTER 
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 } 
});

// HELMET 
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https://*.supabase.co", "https://avatars.steamstatic.com", "https://*.steampowered.com", "https://*.steamstatic.com", "https://community.cloudflare.steamstatic.com"], 
            mediaSrc: ["'self'", "https://*.supabase.co", "data:"],
            connectSrc: ["'self'", "https://*.supabase.co", "'self'", "https://api.steampowered.com"],
            formAction: ["'self'", "https://steamcommunity.com"],
            upgradeInsecureRequests: null,
        },
    },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
}));

// - RENDER -
app.use(session({
    secret: 'justica_cs2_secret_key', 
    resave: false,
    saveUninitialized: false,
    proxy: true, 
    cookie: { 
        maxAge: 24 * 60 * 60 * 1000, 
        secure: process.env.NODE_ENV === 'production',   
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' 
    }
}));

app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'static')));

// Banco de dados
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// --- PASSPORT STEAM ---
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new SteamStrategy({
    returnURL: 'https://cs-justice-board.onrender.com',
    realm: 'https://cs-justice-board.onrender.com',
    apiKey: process.env.STEAM_API_KEY
  },
  (identifier, profile, done) => {
    process.nextTick(() => {
        profile.identifier = identifier;
        return done(null, profile);
    });
  }
));

// --- ROTAS DE AUTENTICAÇÃO ---
app.get('/auth/steam', passport.authenticate('steam'));

app.get('/auth/steam/return', 
    passport.authenticate('steam', { failureRedirect: '/' }), 
    (req, res) => {
        console.log("🚀 LOGIN SUCESSO:", req.user.displayName);
        res.redirect('/'); 
    }
);

app.get('/api/user-status', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({ 
            logged: true, 
            user: {
                name: req.user.displayName,
                avatar: req.user._json.avatarfull,
                steamid: req.user.id
            } 
        });
    } else {
        res.json({ logged: false });
    }
});

app.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/');
    });
});

// API REPORTS lista
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
        res.status(500).json({ error: "Erro ao buscar dados" });
    }
});

// API REPORTS POST
app.post('/api/reports', upload.single('arquivo'), async (req, res) => { 
    try {
        const { offender_steam_id, description, reporter } = req.body;
        const file = req.file;
        const KEY = process.env.STEAM_API_KEY;

        if (!offender_steam_id) return res.status(400).json({ error: "Steam ID obrigatório." });

        let inputSteam = offender_steam_id.trim();
        let finalSteamID = inputSteam;

        // Resolução de URL Steam
        if (inputSteam.includes('steamcommunity.com') || isNaN(inputSteam)) {
            let vanityPart = inputSteam;
            if (inputSteam.includes('/id/')) vanityPart = inputSteam.split('/id/')[1].split('/')[0];
            else if (inputSteam.includes('/profiles/')) finalSteamID = inputSteam.split('/profiles/')[1].split('/')[0];

            if (isNaN(finalSteamID)) {
                const resResolve = await axios.get(`http://api.steampowered.com{KEY}&vanityurl=${vanityPart}`);
                if (resResolve.data.response.success === 1) {
                    finalSteamID = resResolve.data.response.steamid;
                }
            }
        }

        let finalEvidenceUrl = null;
        if (file) {
            const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
            const { data: storageData, error: storageError } = await supabase.storage
                .from('evidencias')
                .upload(fileName, file.buffer, { contentType: file.mimetype });
            
            if (storageError) throw storageError;
            finalEvidenceUrl = supabase.storage.from('evidencias').getPublicUrl(fileName).data.publicUrl;
        }

        let offender_name = "Não Identificado";
        let avatarsteam = "https://avatars.steamstatic.com";
        let vac_status = "Limpa";

        try {
            const [resSteam, resBans] = await Promise.all([
                axios.get(`http://api.steampowered.com{KEY}&steamids=${finalSteamID}`),
                axios.get(`http://api.steampowered.com{KEY}&steamids=${finalSteamID}`)
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
        } catch (e) { console.error("Erro Valve API:", e.message); }

        const { error: dbError } = await supabase
            .from('reports')
            .insert([{ 
                offender_steam_id: finalSteamID, 
                description, 
                evidence_url: finalEvidenceUrl, 
                reporter: reporter || "Anônimo", 
                offender_name,
                avatarsteam,
                vac_status, 
                approved: false 
            }]);
        
        if (dbError) throw dbError;
        res.status(201).json({ success: true });

    } catch (error) {
        console.error("Erro Crítico:", error.message);
        res.status(500).json({ error: "Erro interno." });
    }
});

// --- SERVIR FRONT-END ---
app.get('/mural', (req, res) => res.sendFile(path.join(__dirname, 'static', 'mural.html')));
app.get('/contato', (req, res) => res.sendFile(path.join(__dirname, 'static', 'contato.html')));
app.get('/lei', (req, res) => res.sendFile(path.join(__dirname, 'static', 'lei.html')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'static', 'index.html')));

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
