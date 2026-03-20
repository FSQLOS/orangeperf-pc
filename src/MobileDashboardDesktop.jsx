import React, { useEffect, useState, useRef } from 'react';
import Papa from 'papaparse';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import {
    Smartphone, Wifi, Shield, Zap, Home, Activity, RefreshCw,
    TrendingUp, TrendingDown, Target, Leaf, ChevronRight,
    Settings, X, Receipt, Calendar, Clock, Save, Users
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartDataLabels);

export default function MobileDashboardDesktop({ config: initialConfig }) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [statsMonth, setStatsMonth] = useState({});
    const [statsDay, setStatsDay] = useState({});
    const [globalData, setGlobalData] = useState({ ca: 0, assur: 0, counts: {} });
    const [viewMode, setViewMode] = useState('month');
    const [selectedSeller, setSelectedSeller] = useState(null);
    const [activeChart, setActiveChart] = useState('Terminaux');
    const [showConfig, setShowConfig] = useState(false);
    const [teamMap, setTeamMap] = useState({});
    const [config, setConfig] = useState(initialConfig || {});
    const [configDraft, setConfigDraft] = useState(null);

    const FAMILIES = {
        BOX: { label: "🌐 LIVEBOX", color: "#527EDB" },
        FORFAIT: { label: "📱 FORFAIT MOBILE", color: "#FF7900" },
        HOME: { label: "🛡️ CYBER / MAISON P.", color: "#6f42c1" },
        PRET: { label: "🔄 PRÊT MOBILE", color: "#9ca3af" },
        APPLE: { label: "🍎 APPLE", color: "#1a1a1a" },
        SAMSUNG: { label: "🪐 SAMSUNG", color: "#034EA2" },
        DORO: { label: "👴 DORO", color: "#E6007E" },
        XIAOMI: { label: "📱 XIAOMI", color: "#FF6700" },
        HONOR: { label: "📱 HONOR", color: "#FF6800" },
        CROSSCALL: { label: "📱 CROSSCALL", color: "#FF6900" },
        GOOGLE: { label: "📱 GOOGLE", color: "#4285F4" },
        MOTOROLA: { label: "📱 MOTOROLA", color: "#5C6BC0" },
        PROT: { label: "🛡️ PROTECTION", color: "#059669" },
        ACC: { label: "🎧 ACCESSOIRES & CHARGEURS", color: "#4b5563" },
        ACC_HOME: { label: "🏠 ACC. DOMICILE", color: "#9ca3af" },
        TRANSFERTS: { label: "📲 TRANSFERTS", color: "#4F46E5" },
        SERV: { label: "✨ SERVICES / ASSUR", color: "#FF7900" },
        AUTRE: { label: "📦 DIVERS", color: "#9ca3af" }
    };

    const CODES = {
        Broadband: [804284, 805275, 804900, 804285, 804286, 804288, 804540, 804541, 804901, 805111, 805230],
        Mobile: [805315, 805311, 805307, 805278, 805277, 805276, 805261, 805260, 805259, 805234, 805233, 805232, 805110, 805104, 805103, 805102, 805081, 805070, 805068, 805064, 805063, 805062, 805061, 805055, 804287, 804285, 804283, 804266, 804210],
        MIG: [805226, 805228, 805227, 804608, 805243, 805242, 805235, 805241, 804610, 805225, 805224, 805223],
        MEV: [801692], MP: [804411, 804410], Cyber: [805159],
        Assurance: [801410, 801413, 805121, 801411, 805120, 801412, 805118, 805119, 805122, 803105]
    };

    const KEY_STOCKAGE = ["128 GO","128GO","256 GO","256GO","512 GO","512GO","1 TO","1TO","64 GO","64GO","32 GO","32GO"];
    const KEY_MODELE = ["IPHONE","GALAXY A","GALAXY S","GALAXY Z","GLXY","GLKY","S25 FE","XIAOMI 17","XIAOMI 15T","REDMI NOTE","REDMI A","X5C","L30","WIRE","HONOR MAGIC","HONOR 400","HONOR X","GOOGLE PIXEL","MOTOROLA","MOTO G","CROSSCALL STELLAR","15C","A15","A25","A35","A55"];
    const KEY_NOT_TERM = ["DBRAMENTE","PRET","DBRAMANTE","KIT PIETON","FOLIO","COQUE","VT","QDOS","PROTECTION","ETUI","VERRE","FILM","PROT","CHARGEUR","CABLE","ADAPTATEUR","PRISE","ECOUTEUR","AUDIO","BUDS","AIRPODS","FREEBUDS","ENCEINTE","SPEAKER","SOUND","MONTRE","BRACELET","WATCH","BAND","GALAXY FIT","SUPPORT","PACK","LANIERE","TAG","TRACKER","CLE","USB","CARTE","MEMOIRE","DISQUE","HDD","SSD","SDXC","MICROSD","DRIVE","TW","CASQUE","POWERBANK","BASE SECTEUR","PAD INDUCTION","SMARTTAG"];
    const BLACKLIST_CA = ["FIXE","DECT","GIGASET","PARAFOUDRE","MONO","MULTIPRISE","PILE","SAC","KRAFT","CONFIGURATION","ATELIER","FLASH","EXPERTE","TIMBRE","PLANCHE","PHOTO","IDENTITE","MOBICARTE","E-RECH","ALCATEL"];
    const EXCLUDED_PRICES = [9, 24, 39];

    const getMonthInfo = () => {
        const d = new Date();
        const now = d.getDate();
        const total = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        return { now, total, pct: now / total };
    };

    const getFamily = (lib, code) => {
        const l = lib.toUpperCase();
        if (l.includes("PRET")) return "PRET";
        if (l.includes("PARAFOUDRE") || l.includes("MULTIPRISE")) return "ACC_HOME";
        if (l.includes("ALCATEL")) return "ACC_HOME";
        if (l.includes("COQUE") || l.includes("ETUI") || l.includes("FOLIO") || l.includes("DBRAMENTE") || l.includes("DBRAMANTE") || l.includes("VERRE") || l.includes("FILM") || l.includes("PROT") || l.includes("CAMERA LENS") || l.includes("FORCE GLASS") || l.includes("VT") || l.includes("QDOS") || l.includes("FORCE CASE") || l.includes("AOD PROTECTION")) return "PROT";
        if (l.startsWith("CS ") || l.includes("CHARGEUR") || l.includes("CABLE") || l.includes("KIT PIETON") || l.includes("POWERBANK") || l.includes("AUDIO") || l.includes("ENCEINTE") || l.includes("AIRPODS") || l.includes("BANDOULIERE") || l.includes("BUDS") || l.includes("CASQUE") || l.includes("FREEBUDS") || l.includes("TW") || l.includes("MONTRE") || l.includes("WATCH") || l.includes("BAND") || l.includes("GALAXY FIT") || l.includes("SUPPORT") || l.includes("SPRAY") || l.includes("RECHARGE FORCE") || l.includes("RECHARGE SPRAY") || l.includes("BASE SECTEUR") || l.includes("PAD INDUCTION") || l.includes("SMARTTAG") || l.includes("TRACKER") || l.includes("TAG") || l.includes("M/L")) return "ACC";
        if (l.includes("ASSURANCE") || CODES.Assurance.includes(code)) return "SERV";
        if (l.includes("CYBER") || CODES.Cyber.includes(code) || CODES.MP.includes(code)) return "HOME";
        if (l.includes("FLASH") || l.includes("EXPERTE") || l.includes("ATELIER")) return "TRANSFERTS";
        if (CODES.Broadband.includes(code)) return "BOX";
        if (CODES.Mobile.includes(code)) return "FORFAIT";
        if (l.includes("IPHONE") || l.includes("APPLE")) return "APPLE";
        if (l.includes("SAMSUNG") || l.includes("GALAXY")) return "SAMSUNG";
        if (l.includes("DORO")) return "DORO";
        if (l.includes("XIAOMI") || l.includes("REDMI") || l.includes("POCO")) return "XIAOMI";
        if (l.includes("HONOR")) return "HONOR";
        if (l.includes("CROSSCALL") || l.includes("STELLAR")) return "CROSSCALL";
        if (l.includes("GOOGLE PIXEL")) return "GOOGLE";
        if (l.includes("MOTOROLA") || l.includes("MOTO G")) return "MOTOROLA";
        return "AUTRE";
    };

    const fetchData = () => {
        if (!config?.url) return;
        setRefreshing(true);
        const t = new Date().getTime();
        const finalUrl = "https://corsproxy.io/?" + encodeURIComponent(config.url + "&t=" + t);
        fetch(finalUrl)
            .then(r => r.text())
            .then(t => { Papa.parse(t, { header: true, skipEmptyLines: true, complete: r => { processData(r.data); setRefreshing(false); } }); })
            .catch(() => setRefreshing(false));
    };

    useEffect(() => { fetchData(); }, [config?.url]);

    const processData = (data) => {
        let currentTeamMap = {};
        if (config?.team) {
            config.team.trim().split('\n').forEach(line => { if (line.includes(':')) { const [c, n] = line.split(':'); currentTeamMap[c.trim()] = n.trim(); } });
        }
        setTeamMap(currentTeamMap);
        const teamCodes = Object.keys(currentTeamMap);
        let tMonth = {}, tDay = {};
        teamCodes.forEach(code => {
            const empty = { Broadband: 0, Mobile: 0, MIG: 0, MEV: 0, Terminaux: 0, Reco: 0, Cyber: 0, MP: 0, Assurance: 0, CA: 0, nbAcc: 0, tickets: {} };
            tMonth[code] = JSON.parse(JSON.stringify(empty));
            tDay[code] = JSON.parse(JSON.stringify(empty));
        });
        let g_CA = 0, g_Term = 0, g_Assur = 0;
        let g_Counts = { Broadband: 0, Mobile: 0, MIG: 0, MEV: 0, Terminaux: 0, Reco: 0, Cyber: 0, MP: 0, Assurance: 0 };
        const d = new Date();
        const todayFormats = [`${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`, `${d.getDate()}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`];

        data.forEach(row => {
            let cleanRow = {}; Object.keys(row).forEach(k => cleanRow[k.trim()] = row[k]);
            let rowDate = (cleanRow["Date"] || cleanRow["Date de pièce"] || cleanRow["Date Facture"] || "").toString();
            if (!rowDate) return;
            let ticketId = cleanRow["Ticket"] || cleanRow["N° Ticket"] || "SANS_TICKET";
            let isToday = todayFormats.some(f => rowDate.includes(f));
            let vRaw = (cleanRow["Vendeur Doc."] || "").toString().toUpperCase();
            let v = teamCodes.find(code => vRaw.includes(code));
            if (v) {
                let codeArt = parseInt(cleanRow["Code Article"]);
                let lib = (cleanRow["Libellé Article"] || "").toString().toUpperCase().trim();
                let caVal = parseFloat((cleanRow["Montant TTC"] || "0").toString().replace(/[^0-9,.-]/g, '').replace(',', '.')) || 0;
                if (lib.startsWith("WP")) return;
                const isRefund = caVal < 0;
                const absVal = Math.abs(caVal);
                const modifier = isRefund ? -1 : 1;
                const isWatch = lib.includes("WATCH") || lib.includes("MONTRE") || lib.includes("GALAXY FIT") || lib.includes("APPLE WATCH");
                const isPret = lib.includes("PRET");
                const isTransfert = lib.includes("FLASH") || lib.includes("EXPERTE") || lib.includes("ATELIER") || lib.includes("TRANSFERT") || lib.includes("CONFIGURATION");
                const isLabelBlacklisted = BLACKLIST_CA.some(w => lib.includes(w));
                const isPriceExcluded = EXCLUDED_PRICES.includes(absVal);
                let fam = getFamily(lib, codeArt);
                let isTerm = !isPret && fam !== "PROT" && fam !== "ACC" && fam !== "ACC_HOME" && (KEY_STOCKAGE.some(k => lib.includes(k)) || KEY_MODELE.some(k => lib.includes(k))) && !KEY_NOT_TERM.some(k => lib.includes(k)) && !isWatch && !lib.includes("ALCATEL") && absVal > 15 && !isPret;
                let isReco = isTerm && (lib.includes("RECONDITIONNE") || lib.includes("OFFRE 2ND") || lib.includes("RENEWD") || lib.includes("RECOMMERCE") || lib.includes("REC GR") || lib.includes("C REC") || lib.includes("R REC") || lib.includes("L REC") || lib.includes("EF REC") || lib.includes("P REC"));
                let ht = 0;
                if (!isRefund) {
                    if (isWatch) { ht = caVal / 1.2; }
                    else if ((fam === "ACC" || fam === "PROT") && !isLabelBlacklisted && !isTransfert && !isTerm) { ht = caVal / 1.2; }
                }
                tMonth[v].CA += ht; g_CA += ht;
                if (!tMonth[v].tickets[ticketId]) tMonth[v].tickets[ticketId] = { date: rowDate, items: [] };
                tMonth[v].tickets[ticketId].items.push({ lib, fam, ca: (ht > 0 || isPriceExcluded) ? caVal : 0, isReco });
                const updateStat = (key, val = modifier) => { tMonth[v][key] += val; g_Counts[key] += val; if (isToday) tDay[v][key] += val; };
                if (isTerm) { updateStat('Terminaux'); g_Term += modifier; if (isReco) updateStat('Reco'); }
                if ((fam === "ACC" || fam === "PROT" || isWatch) && absVal > 1) { tMonth[v].nbAcc += modifier; if (isToday) tDay[v].nbAcc += modifier; }
                if (CODES.Broadband.includes(codeArt)) updateStat('Broadband');
                if (CODES.Mobile.includes(codeArt)) updateStat('Mobile');
                if (CODES.MIG.includes(codeArt)) updateStat('MIG');
                if (CODES.MEV.includes(codeArt)) updateStat('MEV');
                if (CODES.Cyber.includes(codeArt)) updateStat('Cyber');
                if (CODES.MP.includes(codeArt)) updateStat('MP');
                if (CODES.Assurance.includes(codeArt)) { updateStat('Assurance'); g_Assur += modifier; }
                if (isToday) tDay[v].CA += ht;
            }
        });
        setGlobalData({ ca: g_CA, assur: g_Term > 0 ? Math.round((g_Assur / g_Term) * 100) : 0, counts: g_Counts });
        setStatsMonth(tMonth); setStatsDay(tDay); setLoading(false);
    };

    const currentStats = viewMode === 'month' ? statsMonth : statsDay;
    const sortedTeamCodes = Object.keys(currentStats).sort((a, b) => currentStats[b].CA - currentStats[a].CA);
    const mInfo = getMonthInfo();
    const objTotalCA = config?.objectifs?.CA || 0;
    const prorataTarget = Math.round(objTotalCA * mInfo.pct);
    const diffCA = Math.round(globalData.ca - prorataTarget);
    const isAhead = diffCA >= 0;
    const landingCA = mInfo.now > 0 ? Math.round(globalData.ca / mInfo.now * mInfo.total) : 0;

    const CHART_CATS = ['Terminaux', 'Mobile', 'Broadband', 'MIG', 'MEV', 'Cyber', 'MP'];
    const CAT_COLORS = { Terminaux: '#e5e5e5', Mobile: '#FF7900', Broadband: '#527EDB', MIG: '#FFCC00', MEV: '#d4a017', Cyber: '#6f42c1', MP: '#32C832' };
    const CAT_LABELS = { Terminaux: 'Terminaux', Mobile: 'Mobile', Broadband: 'Box', MIG: 'MIG', MEV: 'MEV', Cyber: 'Cyber', MP: 'Maison P.' };

    const buildChartData = (cat) => {
        const nbVendeurs = Object.keys(teamMap).length || 1;
        const obj = config?.objectifs || {};
        const isTxAssur = cat === 'TxAssur';
        const indivTarget = isTxAssur ? 42 : Math.ceil((obj[cat] || 0) / nbVendeurs);
        const sorted = Object.keys(currentStats)
            .map(code => {
                const s = currentStats[code];
                const done = isTxAssur ? (s.Terminaux > 0 ? Math.round((s.Assurance / s.Terminaux) * 100) : 0) : (s[cat] || 0);
                return { name: teamMap[code] || code, done, remaining: isTxAssur ? 0 : Math.max(0, indivTarget - done), color: done >= indivTarget ? '#10b981' : '#FF7900' };
            })
            .sort((a, b) => b.done - a.done);
        return { sorted, indivTarget, isTxAssur };
    };

    const saveConfig = () => {
        if (!configDraft) return;
        setConfig(configDraft);
        setShowConfig(false);
    };

    const openConfig = () => {
        setConfigDraft({ ...config });
        setShowConfig(true);
    };

    if (loading && !config?.url) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f0f0f', color: '#FF7900', fontFamily: 'sans-serif', flexDirection: 'column', gap: 16 }}>
                <div style={{ fontSize: 32 }}>⚙️</div>
                <div style={{ fontSize: 16, color: '#888' }}>Aucune configuration — cliquez sur l'icône ⚙️ pour démarrer</div>
                <button onClick={openConfig} style={{ marginTop: 8, background: '#FF7900', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 14, cursor: 'pointer', fontWeight: 700 }}>Configurer</button>
                {showConfig && renderConfig()}
            </div>
        );
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f0f0f', color: '#FF7900', fontFamily: 'sans-serif', gap: 12 }}>
                <div style={{ width: 20, height: 20, border: '2px solid #FF7900', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Chargement des données...
            </div>
        );
    }

    const { sorted: chartSorted, indivTarget, isTxAssur } = buildChartData(activeChart === 'TxAssur' ? 'TxAssur' : activeChart);

    const renderConfig = () => (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }} onClick={() => setShowConfig(false)}>
            <div style={{ background: '#1a1a1a', borderRadius: 20, padding: 32, width: 560, maxHeight: '85vh', overflowY: 'auto', border: '1px solid #333' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h2 style={{ color: '#FF7900', fontFamily: 'sans-serif', fontWeight: 800, fontSize: 20 }}>⚙️ Configuration</h2>
                    <X size={20} color="#888" style={{ cursor: 'pointer' }} onClick={() => setShowConfig(false)} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div>
                        <label style={{ color: '#aaa', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>URL Google Sheets</label>
                        <input value={configDraft?.url || ''} onChange={e => setConfigDraft(d => ({ ...d, url: e.target.value }))}
                            style={{ width: '100%', background: '#111', border: '1px solid #333', borderRadius: 10, padding: '10px 14px', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                            placeholder="https://docs.google.com/spreadsheets/d/..." />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>Équipe (CODE:Prénom Nom)</label>
                        <textarea value={configDraft?.team || ''} onChange={e => setConfigDraft(d => ({ ...d, team: e.target.value }))} rows={6}
                            style={{ width: '100%', background: '#111', border: '1px solid #333', borderRadius: 10, padding: '10px 14px', color: '#fff', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'monospace' }}
                            placeholder={"00012345:Jean Dupont\n00067890:Marie Martin"} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 12 }}>Objectifs mensuels boutique</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            {['CA', 'Terminaux', 'Mobile', 'Broadband', 'MIG', 'MEV', 'Cyber', 'MP'].map(key => (
                                <div key={key}>
                                    <label style={{ color: '#666', fontSize: 11, display: 'block', marginBottom: 4 }}>{key}</label>
                                    <input type="number" value={configDraft?.objectifs?.[key] || ''} onChange={e => setConfigDraft(d => ({ ...d, objectifs: { ...(d.objectifs || {}), [key]: parseInt(e.target.value) || 0 } }))}
                                        style={{ width: '100%', background: '#111', border: '1px solid #333', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                                </div>
                            ))}
                        </div>
                    </div>
                    <button onClick={saveConfig} style={{ background: '#FF7900', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <Save size={16} /> Enregistrer et charger
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0f0f0f', color: '#f0f0f0', fontFamily: 'sans-serif', overflow: 'hidden' }}>

            {/* TOP BAR */}
            <div style={{ height: 56, background: '#151515', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF7900', boxShadow: '0 0 8px #FF7900' }} />
                    <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em' }}>Orange Boutique <span style={{ color: '#FF7900' }}>Perf</span></span>
                    <span style={{ color: '#555', fontSize: 12 }}>Dashboard Desktop</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Jour / Mois toggle */}
                    <div style={{ display: 'flex', background: '#222', borderRadius: 10, padding: 3, gap: 2 }}>
                        {[['day', <Clock size={13}/>, 'Jour'], ['month', <Calendar size={13}/>, 'Mois']].map(([mode, icon, label]) => (
                            <button key={mode} onClick={() => setViewMode(mode)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: viewMode === mode ? '#FF7900' : 'transparent', color: viewMode === mode ? '#fff' : '#888', transition: 'all 0.2s' }}>
                                {icon} {label}
                            </button>
                        ))}
                    </div>
                    {/* CA badge */}
                    <div style={{ background: '#1e1e1e', border: `1px solid ${isAhead ? '#10b981' : '#ef4444'}`, borderRadius: 10, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: isAhead ? '#10b981' : '#ef4444', boxShadow: `0 0 6px ${isAhead ? '#10b981' : '#ef4444'}` }} />
                        <span style={{ fontWeight: 800, fontSize: 14 }}>{Math.round(globalData.ca).toLocaleString()}€</span>
                        <span style={{ fontSize: 11, color: isAhead ? '#10b981' : '#ef4444', fontWeight: 600 }}>{isAhead ? '+' : ''}{diffCA.toLocaleString()}€ vs prorata</span>
                    </div>
                    {/* Taux assur */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1e1e1e', borderRadius: 10, padding: '6px 14px', border: '1px solid #2a2a2a' }}>
                        <div style={{ width: 32, height: 32 }}>
                            <CircularProgressbar value={globalData.assur} text={`${globalData.assur}%`}
                                styles={buildStyles({ pathColor: '#FF7900', textColor: '#FF7900', trailColor: '#2a2a2a', textSize: '28px' })} />
                        </div>
                        <span style={{ fontSize: 11, color: '#888' }}>Taux Assur</span>
                    </div>
                    <button onClick={() => { fetchData(); }} style={{ background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center' }}>
                        <RefreshCw size={16} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
                    </button>
                    <button onClick={openConfig} style={{ background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center' }}>
                        <Settings size={16} />
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                {/* LEFT COLUMN — Classement + Tickets */}
                <div style={{ width: 380, flexShrink: 0, borderRight: '1px solid #1e1e1e', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                    {/* Classement */}
                    <div style={{ flex: selectedSeller ? '0 0 auto' : 1, overflowY: 'auto', padding: '16px 16px 8px' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>🏆 Classement</div>
                        {sortedTeamCodes.map((code, index) => {
                            const s = currentStats[code];
                            if (s.CA === 0 && s.Terminaux === 0) return null;
                            const name = teamMap[code] || code;
                            const attachRate = s.Terminaux > 0 ? (s.nbAcc / s.Terminaux).toFixed(1) : 0;
                            const tauxReco = s.Terminaux > 0 ? Math.round((s.Reco / s.Terminaux) * 100) : 0;
                            const tauxAssur = s.Terminaux > 0 ? Math.round((s.Assurance / s.Terminaux) * 100) : 0;
                            const tauxCyber = (s.Broadband + s.MIG + s.MEV + s.Mobile) > 0 ? Math.round((s.Cyber / (s.Broadband + s.MIG + s.MEV + s.Mobile)) * 100) : 0;
                            const isSelected = selectedSeller?.code === code;
                            return (
                                <div key={code} onClick={() => setSelectedSeller(isSelected ? null : { code, name, data: s })}
                                    style={{ background: isSelected ? 'rgba(255,121,0,0.08)' : '#161616', border: `1px solid ${isSelected ? 'rgba(255,121,0,0.3)' : '#222'}`, borderRadius: 14, padding: '12px 14px', marginBottom: 8, cursor: 'pointer', transition: 'all 0.2s' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 22, height: 22, borderRadius: 6, background: isSelected ? '#FF7900' : '#222', color: isSelected ? '#fff' : '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>{index + 1}</div>
                                            <span style={{ fontWeight: 700, fontSize: 14 }}>{name}</span>
                                        </div>
                                        <span style={{ color: '#FF7900', fontWeight: 800, fontSize: 14 }}>{Math.round(s.CA).toLocaleString()}€</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                        <Pill label={`📱 ${s.Terminaux}`} />
                                        <Pill label={`🛡️ ${tauxAssur}%`} highlight={tauxAssur >= 42} />
                                        <Pill label={`ACC ${attachRate}`} />
                                        <Pill label={`♻️ ${tauxReco}% (${s.Reco})`} />
                                        <Pill label={`🔒 ${tauxCyber}%`} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Tickets panel */}
                    {selectedSeller && (
                        <div style={{ flex: 1, overflowY: 'auto', borderTop: '1px solid #1e1e1e', padding: '12px 16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#FF7900', textTransform: 'uppercase', letterSpacing: '0.1em' }}>🧾 Tickets — {selectedSeller.name}</span>
                                <X size={14} color="#555" style={{ cursor: 'pointer' }} onClick={() => setSelectedSeller(null)} />
                            </div>
                            {Object.entries(selectedSeller.data.tickets).reverse().map(([id, ticket]) => (
                                <div key={id} style={{ background: '#161616', border: '1px solid #222', borderRadius: 12, padding: '10px 12px', marginBottom: 8 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid #222' }}>
                                        <span style={{ fontSize: 11, color: '#666', display: 'flex', alignItems: 'center', gap: 5 }}><Receipt size={11}/> #{id}</span>
                                        <span style={{ fontSize: 11, color: '#555' }}>{ticket.date}</span>
                                    </div>
                                    {Object.entries(FAMILIES).map(([famKey, famInfo]) => {
                                        const items = ticket.items.filter(i => i.fam === famKey);
                                        if (!items.length) return null;
                                        return (
                                            <div key={famKey} style={{ marginBottom: 6 }}>
                                                <div style={{ fontSize: 10, fontWeight: 700, color: famInfo.color, marginBottom: 3 }}>{famInfo.label}</div>
                                                {items.map((item, idx) => (
                                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '2px 0', borderBottom: '1px dashed #1e1e1e' }}>
                                                        <span style={{ color: '#aaa', flex: 1, paddingRight: 8 }}>
                                                            {item.lib}
                                                            {item.isReco && <span style={{ background: '#064e3b', color: '#6ee7b7', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4, marginLeft: 5 }}>♻️ REC</span>}
                                                        </span>
                                                        <span style={{ color: '#FF7900', fontWeight: 700, whiteSpace: 'nowrap' }}>{item.ca > 0 ? Math.round(item.ca) + '€' : ''}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN — KPIs + Graphiques */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

                    {/* KPI row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                        <KpiCard label="Objectif total" value={`${objTotalCA.toLocaleString()}€`} sub={`Prorata: ${prorataTarget.toLocaleString()}€`} />
                        <KpiCard label="Atterrissage" value={`${landingCA.toLocaleString()}€`} sub={landingCA >= objTotalCA ? '✅ En bonne voie' : '⚠️ En dessous'} highlight={landingCA >= objTotalCA} />
                        <KpiCard label="Terminaux" value={globalData.counts.Terminaux || 0} sub={`Obj: ${config?.objectifs?.Terminaux || '—'}`} />
                        <KpiCard label="Taux assur équipe" value={`${globalData.assur}%`} sub="Obj: 42%" highlight={globalData.assur >= 42} />
                    </div>

                    {/* Stats row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 20 }}>
                        {['Mobile', 'Broadband', 'MIG', 'MEV', 'Cyber', 'MP'].map(key => {
                            const count = viewMode === 'month' ? (globalData.counts[key] || 0) : Object.values(currentStats).reduce((a, s) => a + (s[key] || 0), 0);
                            const obj = config?.objectifs?.[key] || 0;
                            return (
                                <div key={key} style={{ background: '#161616', border: '1px solid #222', borderRadius: 12, padding: '12px 14px', textAlign: 'center' }}>
                                    <div style={{ fontSize: 20, fontWeight: 800, color: CAT_COLORS[key] || '#fff' }}>{count}</div>
                                    {obj > 0 && <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>/ {obj}</div>}
                                    <div style={{ fontSize: 10, color: '#555', marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{CAT_LABELS[key]}</div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Chart selector */}
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>📊 Comparatif équipe</div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
                        {[...CHART_CATS, 'TxAssur'].map(cat => (
                            <button key={cat} onClick={() => setActiveChart(cat)}
                                style={{ padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, background: activeChart === cat ? '#FF7900' : '#1e1e1e', color: activeChart === cat ? '#fff' : '#888', transition: 'all 0.15s' }}>
                                {cat === 'TxAssur' ? 'Tx Assur' : CAT_LABELS[cat] || cat}
                            </button>
                        ))}
                    </div>

                    {/* Chart */}
                    <div style={{ background: '#161616', border: '1px solid #222', borderRadius: 16, padding: '20px 16px', height: Math.max(280, chartSorted.length * 40 + 60) }}>
                        <Bar
                            data={{
                                labels: chartSorted.map(d => d.name),
                                datasets: [
                                    {
                                        label: 'Fait',
                                        data: chartSorted.map(d => d.done),
                                        backgroundColor: chartSorted.map(d => d.color),
                                        borderRadius: 6, barThickness: 22,
                                        datalabels: { anchor: isTxAssur ? 'end' : 'center', align: isTxAssur ? 'right' : 'center', color: isTxAssur ? '#ccc' : '#fff', font: { weight: '900', size: 12 }, offset: isTxAssur ? 8 : 0 }
                                    },
                                    ...(!isTxAssur ? [{
                                        label: 'Reste',
                                        data: chartSorted.map(d => d.remaining),
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        borderRadius: 6, barThickness: 22,
                                        datalabels: { anchor: 'end', align: 'right', color: '#555', offset: 8, font: { weight: 'bold', size: 11 } }
                                    }] : [])
                                ]
                            }}
                            options={{
                                indexAxis: 'y', responsive: true, maintainAspectRatio: false,
                                layout: { padding: { right: 80, left: 0, top: 5, bottom: 5 } },
                                plugins: {
                                    legend: { display: false },
                                    datalabels: { clip: false, formatter: (value, ctx) => ctx.datasetIndex === 0 ? value + (isTxAssur ? '%' : '') : value > 0 ? `(-${value})` : '✅' }
                                },
                                scales: {
                                    x: { stacked: !isTxAssur, display: false, beginAtZero: true, suggestedMax: Math.max(...chartSorted.map(d => d.done + (isTxAssur ? 0 : d.remaining))) * 1.25 },
                                    y: { stacked: !isTxAssur, grid: { display: false }, ticks: { color: '#888', font: { size: 12, weight: 'bold' } } }
                                }
                            }}
                        />
                    </div>

                </div>
            </div>

            {showConfig && renderConfig()}

            <style>{`
                @keyframes spin { 100% { transform: rotate(360deg); } }
                ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
            `}</style>
        </div>
    );
}

const Pill = ({ label, highlight }) => (
    <span style={{ background: highlight ? 'rgba(16,185,129,0.12)' : '#1e1e1e', color: highlight ? '#10b981' : '#888', border: `1px solid ${highlight ? 'rgba(16,185,129,0.2)' : '#2a2a2a'}`, borderRadius: 6, padding: '2px 7px', fontSize: 10, fontWeight: 600 }}>
        {label}
    </span>
);

const KpiCard = ({ label, value, sub, highlight }) => (
    <div style={{ background: '#161616', border: `1px solid ${highlight ? 'rgba(16,185,129,0.2)' : '#222'}`, borderRadius: 14, padding: '14px 16px' }}>
        <div style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: highlight ? '#10b981' : '#fff', letterSpacing: '-0.02em' }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>{sub}</div>}
    </div>
);
