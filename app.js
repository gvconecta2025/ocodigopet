import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// COLOQUE AS CREDENCIAIS DO NOVO PROJETO 'ocodigopet'
const firebaseConfig = {
    apiKey: "SUA_API_KEY",
    authDomain: "ocodigopet.firebaseapp.com",
    projectId: "ocodigopet",
    storageBucket: "ocodigopet.firebasestorage.app",
    messagingSenderId: "SEU_SENDER",
    appId: "SEU_APP_ID"
};

let db = null;

try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("Sistema Base: Online");
} catch (e) {
    console.error("Erro ao iniciar Firebase:", e);
}

// Registro do Service Worker (PWA)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker Registrado!', reg.scope))
            .catch(err => console.log('Falha no Service Worker:', err));
    });
}

// Roteamento e Captura de Intenção
window.acessarModulo = async (destino) => {
    // Grava a intenção de clique antes de mudar de página
    if (db) {
        try {
            await addDoc(collection(db, "telemetria_entrada"), {
                porta_escolhida: destino,
                data_acesso: serverTimestamp(),
                agente: navigator.userAgent,
                origem: document.referrer || 'Direto'
            });
        } catch (e) {
            console.warn("Telemetria falhou, seguindo rota.");
        }
    }

    // Redireciona o usuário para as respectivas pastas
    if (destino === 'business') {
        window.location.href = '/business/index.html';
    } else if (destino === 'tutores') {
        window.location.href = '/tutores/index.html';
    }
};
