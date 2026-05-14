// Configuração Visual de Data
const dt = new Date();
document.getElementById('data-hoje').innerText = dt.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// COLOQUE AS SUAS CREDENCIAIS DO NOVO PROJETO FIREBASE (ocodigopet)
const firebaseConfig = {
    apiKey: "SUA_API_KEY",
    authDomain: "ocodigopet.firebaseapp.com",
    projectId: "ocodigopet",
    storageBucket: "ocodigopet.firebasestorage.app",
    messagingSenderId: "SEU_SENDER",
    appId: "SEU_APP_ID"
};

let db;
let artigosCache = [];
let guiaAtual = 'tutores';

// Registro PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW Falhou:', err));
    });
}

try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    carregarPortal();
} catch(e) {
    console.error("Firebase não configurado ainda.", e);
    document.getElementById('loader').innerHTML = "<p class='text-amber-500 font-bold'>Base de Dados não conectada. Configure o Firebase no app.js.</p>";
}

async function carregarPortal() {
    try {
        const q = query(collection(db, "artigos"), orderBy("data_publicacao", "desc"));
        const qs = await getDocs(q);
        
        let tutoresHtml = '';
        let negociosHtml = '';

        qs.forEach(docSnap => {
            const art = { id: docSnap.id, ...docSnap.data() };
            artigosCache.push(art);

            const card = `
                <div onclick="abrirArtigo('${art.id}', '${art.publico_alvo}')" class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 cursor-pointer group flex flex-col">
                    <div class="h-40 rounded-xl bg-slate-200 overflow-hidden mb-4 relative">
                        <img src="${art.imagem}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">
                        ${art.publico_alvo === 'gestor' ? '<div class="absolute top-2 right-2 bg-amber-400 text-amber-900 text-[9px] font-black px-2 py-1 rounded shadow"><i class="fa-solid fa-lock"></i> PRO</div>' : ''}
                    </div>
                    <span class="text-[10px] text-blue-600 font-black uppercase tracking-widest mb-1">${art.caderno || 'Geral'}</span>
                    <h3 class="text-lg font-black text-slate-900 font-serif leading-snug group-hover:text-blue-600 transition mb-2">${art.titulo}</h3>
                    <p class="text-xs text-slate-500 leading-relaxed line-clamp-3">${art.resumo}</p>
                </div>
            `;

            if(art.publico_alvo === 'gestor' || art.publico_alvo === 'funcionario') {
                negociosHtml += card;
            } else {
                tutoresHtml += card;
            }
        });

        document.getElementById('grid-dinamico-tutores').innerHTML = tutoresHtml || '<p class="text-slate-400">Em breve...</p>';
        document.getElementById('grid-dinamico-negocios').innerHTML = negociosHtml || '<p class="text-slate-400">Em breve...</p>';

        document.getElementById('loader').classList.add('hidden');
        document.getElementById('modulo-tutores').classList.remove('hidden');

    } catch(e) {
        console.error(e);
    }
}

// Navegação de Abas
window.mudarGuia = (guia) => {
    guiaAtual = guia;
    document.getElementById('tab-tutores').classList.remove('active');
    document.getElementById('tab-negocios').classList.remove('active');
    document.getElementById('modulo-tutores').classList.add('hidden');
    document.getElementById('modulo-negocios').classList.add('hidden');
    document.getElementById('tela-leitura').classList.add('hidden');

    document.getElementById(`tab-${guia}`).classList.add('active');
    document.getElementById(`modulo-${guia}`).classList.remove('hidden');
    window.scrollTo(0,0);
};

// Leitura de Artigo
window.abrirArtigo = (id, tipo) => {
    const art = artigosCache.find(a => a.id === id);
    if(!art) return;

    document.getElementById('modulo-tutores').classList.add('hidden');
    document.getElementById('modulo-negocios').classList.add('hidden');
    
    document.getElementById('leitura-img').src = art.imagem;
    document.getElementById('leitura-titulo').innerText = art.titulo;
    document.getElementById('leitura-resumo').innerText = art.resumo;
    
    const divConteudo = document.getElementById('leitura-conteudo');
    const divPaywall = document.getElementById('paywall-negocios');
    const isVip = localStorage.getItem('ocodigopet_vip') === 'true';

    // REGRA DE OURO B2B
    if(tipo === 'gestor' && !isVip) {
        divConteudo.innerHTML = (art.conteudo.substring(0, 300) + '<br><br><br><br><br><br>').replace(/\n/g, '<br>');
        divConteudo.classList.add('blur-content');
        divPaywall.classList.remove('hidden');
    } else {
        divConteudo.innerHTML = art.conteudo.replace(/\n/g, '<br>');
        divConteudo.classList.remove('blur-content');
        divPaywall.classList.add('hidden');
    }

    document.getElementById('tela-leitura').classList.remove('hidden');
    window.scrollTo(0,0);
};

window.voltarHome = () => mudarGuia(guiaAtual);

// Desbloqueio (Captura de Lead)
window.liberarLeadVIP = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-liberar');
    btn.innerText = "VALIDANDO...";
    btn.disabled = true;

    const lead = {
        nome: document.getElementById('lead-nome').value,
        nomeLoja: document.getElementById('lead-loja').value,
        telefone: document.getElementById('lead-zap').value,
        status_funil: "Novos",
        origem: "Portal PRO - Leitura VIP",
        data_atualizacao: serverTimestamp()
    };

    try {
        await addDoc(collection(db, "leads"), lead);
        localStorage.setItem('ocodigopet_vip', 'true');
        alert("Acesso Liberado!");
        
        document.getElementById('leitura-conteudo').classList.remove('blur-content');
        document.getElementById('paywall-negocios').classList.add('hidden');
        
        const tituloAtivo = document.getElementById('leitura-titulo').innerText;
        const art = artigosCache.find(a => a.titulo === tituloAtivo);
        if(art) document.getElementById('leitura-conteudo').innerHTML = art.conteudo.replace(/\n/g, '<br>');

    } catch(erro) {
        alert("Falha na validação. Verifique a internet.");
        btn.innerText = "DESBLOQUEAR ARTIGO VIP";
        btn.disabled = false;
    }
};
