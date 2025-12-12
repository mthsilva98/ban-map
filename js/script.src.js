/**
 * Gera um código aleatório de 5 caracteres (A–Z, 0–9)
 */
function generateSessionId(length = 5) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < length; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

document.addEventListener('DOMContentLoaded', () => {
    // Referências aos elementos HTML principais
    const setupSection = document.getElementById('setup-section');
    const linksSection = document.getElementById('links-section');
    const continueSessionSection = document.getElementById('continue-session-section');
    const teamSection = document.getElementById('team-section');
    const spectatorSection = document.getElementById('spectator-section');

    // Elementos da Seção de Setup
    const formatCards = document.querySelectorAll('.format-card');
    const startButton = document.getElementById('startButton');
    const selectedFormatText = document.getElementById('selectedFormatText');

    // Elementos da Seção de Links
    const sessionIdDisplay = document.getElementById('sessionIdDisplay');
    const teamALinkInput = document.getElementById('teamALink');
    const teamBLinkInput = document.getElementById('teamBLink');
    const spectatorLinkInput = document.getElementById('spectatorLink');
    const copyButtons = document.querySelectorAll('.copy-btn');
    const openLinkButtons = document.querySelectorAll('.open-link-btn');
    const createNewSessionButton = document.getElementById('createNewSessionButton');

    // Elementos da Seção de Continuar Sessão
    const currentSessionInfo = document.getElementById('currentSessionInfo');
    const continueSessionButton = document.getElementById('continueSessionButton');
    const startNewSessionButton = document.getElementById('startNewSessionButton');

    // Elementos da Seção da Equipe (Team Section)
    const teamNameDisplay = document.getElementById('teamNameDisplay');
    const currentActionDisplay = document.getElementById('currentActionDisplay'); // CORRIGIDO AQUI
    const availableMapsContainer = document.getElementById('availableMaps');
    const actionHistoryList = document.getElementById('actionHistory');
    const finalMapsList = document.getElementById('finalMapsList');

    // Elementos da Seção do Espectador (Spectator Section)
    const spectatorStatus = document.getElementById('spectatorStatus');
    const spectatorMapGrid = document.getElementById('spectatorMapGrid');
    const spectatorHistoryList = document.getElementById('spectatorHistory');
    const spectatorFinalMapsList = document.getElementById('spectatorFinalMaps');

    // Variáveis de estado global (Firestore será a fonte de verdade)
    let selectedFormat = null;
    let currentSessionId = null;
    let currentRole = null; // 'master', 'teamA', 'teamB', 'spectator'
    let currentTeam = null; // 'teamA' ou 'teamB' se for uma interface de equipe

    // Variável para armazenar a função de unsubscribe do listener do Firestore
    window.currentSessionUnsubscribe = null;

    const MAP_IMAGES = {
        "Airport": "img/Airport.png",
        "CrossPort": "img/CrossPort.png",
        "City Cat": "img/City Cat.png",
        "Depot": "img/Depot.png",
        "Desert 2": "img/Desert 2.png",
        "DragonRoad": "img/DragonRoad.png",
        "5th Depot": "img/5th Depot.png",
        "Frozen": "img/Frozen.png",
        "Old Town": "img/Old Town.png",
        "Provence": "img/Provence.png",
        "Western": "img/Western.png",
        "White Squall": "img/White Squall.png",
        "Two Face": "img/Two Face.png"
    };

    /**
 * Exibe o overlay amigável de mapas finais.
 */
function showFinalOverlay(sessionData) {
  const overlay   = document.getElementById('finalOverlay');
  const container = document.getElementById('overlayTeamsContainer');
  container.innerHTML = '';

  // pega só os mapas pickados
  const picks = sessionData.vetoHistory.filter(i => i.action === 'pick');

  // cria o grid horizontal
  const grid = document.createElement('div');
  grid.classList.add('overlay-map-grid');

  // 1) os picks, com nome da equipe acima
  picks.forEach(p => {
    const teamName = p.team === 'teamA' ? 'Equipe A' : 'Equipe B';
    const card = document.createElement('div');
    card.classList.add('overlay-map-item');

    // título da equipe
    const title = document.createElement('div');
    title.classList.add('overlay-map-title');
    title.textContent = teamName;
    card.append(title);

    // imagem e legenda
    const img = document.createElement('img');
    img.src = MAP_IMAGES[p.map];
    img.alt = p.map;
    const caption = document.createElement('span');
    caption.textContent = p.map;
    card.append(img, caption);

    grid.append(card);
  });

  // 2) se houver finalMap e ele não estiver entre os picks, adiciona sem equipe
  if (sessionData.finalMap && !picks.some(p => p.map === sessionData.finalMap)) {
    const card = document.createElement('div');
    card.classList.add('overlay-map-item');

    // placeholder em branco para alinhar
    const placeholder = document.createElement('div');
    placeholder.classList.add('overlay-map-title');
    placeholder.textContent = 'Desempate';
    card.append(placeholder);

    const img = document.createElement('img');
    img.src = MAP_IMAGES[sessionData.finalMap];
    img.alt = sessionData.finalMap;
    const caption = document.createElement('span');
    caption.textContent = sessionData.finalMap;
    card.append(img, caption);

    grid.append(card);
  }

  container.append(grid);
  overlay.classList.remove('hidden');


   // re‑registrar o listener de fechar
  const btn = document.getElementById('closeOverlay');
  if (btn) {
    btn.onclick = () => {
      overlay.classList.add('hidden');
    };
  }

}

/**
 * Cria o elemento <div> de um card de mapa (imagem + legenda).
 */
function buildMapCard(mapName) {
  const item = document.createElement('div');
  item.classList.add('overlay-map-item');
  const img = document.createElement('img');
  img.src = MAP_IMAGES[mapName];
  img.alt = mapName;
  const caption = document.createElement('span');
  caption.textContent = mapName;
  item.append(img, caption);
  return item;
}

// Fecha o overlay ao clicar no botão
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('closeOverlay')
    .addEventListener('click', () => {
      document.getElementById('finalOverlay')
        .classList.add('hidden');
    });
});

/**
 * Verifica se a sessão terminou e dispara o overlay.
 * Chamar esta função no final de displayTeamInterface e displaySpectatorInterface.
 */
function checkSessionEndAndShowOverlay(sessionData) {
  if (sessionData.currentTurn === 'finished') {
    showFinalOverlay(sessionData);
  }
}


    // --- Funções Auxiliares ---

    /**
     * Gera um ID de sessão único e curto.
     */
    function generateSessionId() {
        return Math.random().toString(36).substring(2, 10).toUpperCase();
    }

    /**
     * Extrai parâmetros da URL.
     * @returns {object} Um objeto contendo os parâmetros da URL.
     */
    function getUrlParams() {
        const params = {};
        const queryString = window.location.search.substring(1);
        const urlParams = new URLSearchParams(queryString);
        for (const [key, value] of urlParams.entries()) {
            params[key] = value;
        }
        return params;
    }

    /**
     * Oculta todas as seções principais.
     */
    function hideAllSections() {
        setupSection.classList.add('hidden');
        linksSection.classList.add('hidden');
        continueSessionSection.classList.add('hidden');
        teamSection.classList.add('hidden');
        spectatorSection.classList.add('hidden');
    }

    /**
     * Redireciona para a página principal (limpando parâmetros da URL).
     */
    function goToHomePage() {
        if (window.currentSessionUnsubscribe) {
            window.currentSessionUnsubscribe();
            window.currentSessionUnsubscribe = null;
        }
        window.location.href = window.location.origin + window.location.pathname;
    }

    /**
     * Atualiza a UI com base no papel (role) e estado da sessão.
     * Esta função agora sempre tenta carregar do Firestore e gerencia os listeners.
     * @param {boolean} forceLinksDisplay Se true, força a exibição dos links gerados (após criar nova sessão).
     */
    async function updateUI(forceLinksDisplay = false) {
        hideAllSections();

        const params = getUrlParams();
        currentSessionId = params.session || null;
        currentRole = params.role || 'master';

        let sessionData = null;
        let sessionIdToLoad = currentSessionId;

        // Se na tela master e sem ID na URL, tenta carregar o último ID conhecido do localStorage
        if (currentRole === 'master' && !currentSessionId && sessionStorage.getItem('lastSessionId')) {
            sessionIdToLoad = sessionStorage.getItem('lastSessionId');
        }

        // Se há um ID para carregar, tenta buscar a sessão no Firestore
        if (sessionIdToLoad) {
            try {
                const docRef = db.collection('vetoSessions').doc(sessionIdToLoad);
                const docSnap = await docRef.get();
                if (docSnap.exists) {
                    sessionData = docSnap.data();
                    currentSessionId = sessionIdToLoad; // Confirma o ID da sessão atual
                } else {
                    console.warn("Sessão não encontrada no Firestore:", sessionIdToLoad);
                    sessionStorage.removeItem('lastSessionId'); // Limpa a referência local
                    if (currentRole !== 'master') { // Se não é master, erro e redireciona
                        alert('Sessão não encontrada ou expirada. Por favor, gere um novo link na página principal.');
                        goToHomePage();
                        return;
                    }
                }
            } catch (error) {
                console.error("Erro ao carregar sessão do Firestore:", error);
                alert("Ocorreu um erro ao carregar a sessão. Tente novamente.");
                sessionStorage.removeItem('lastSessionId');
                if (currentRole !== 'master') {
                    goToHomePage();
                    return;
                }
            }
        }

        // Lógica para a tela principal ('master')
        if (currentRole === 'master') {
            if (sessionData && !forceLinksDisplay) {
                // Se encontramos uma sessão (via lastSessionId ou URL) e não estamos forçando links, mostra a tela de continuar
                currentSessionInfo.textContent = `Uma sessão MD${sessionData.format.slice(2)} (${sessionData.id}) está em andamento.`;
                continueSessionSection.classList.remove('hidden');
            } else if (sessionData && forceLinksDisplay) {
                // Se a sessão foi criada/continuada e forçado o display de links
                displayLinks(sessionData);
            } else {
                // Nenhuma sessão ativa para continuar, mostra a tela de configuração
                setupSection.classList.remove('hidden');
                resetSetupSection();
            }
        }
        // Lógica para as interfaces de Equipe ou Espectador
        else {
            if (!sessionData || sessionData.id !== currentSessionId) {
                alert('Sessão não encontrada ou expirada. Por favor, gere um novo link na página principal.');
                goToHomePage();
                return;
            }

            // Garante que o listener anterior seja removido antes de adicionar um novo.
            if (window.currentSessionUnsubscribe) {
                window.currentSessionUnsubscribe();
                window.currentSessionUnsubscribe = null;
            }

            if (currentRole === 'teamA' || currentRole === 'teamB') {
                currentTeam = currentRole;
                displayTeamInterface(sessionData, currentTeam); // Passa sessionData
                window.currentSessionUnsubscribe = db.collection('vetoSessions').doc(currentSessionId)
                  .onSnapshot((doc) => {
                      if (doc.exists) {
                          const updatedSessionData = doc.data();
                          displayTeamInterface(updatedSessionData, currentTeam); // Re-renderiza a UI com os dados atualizados
                      } else {
                          alert('Sessão foi encerrada ou removida. Redirecionando...');
                          goToHomePage();
                      }
                  }, (error) => {
                      console.error("Erro no listener da sessão para equipe:", error);
                      alert("Erro de conexão com a sessão. Tente recarregar.");
                  });

            } else if (currentRole === 'spectator') {
                displaySpectatorInterface(sessionData); // Passa sessionData
                window.currentSessionUnsubscribe = db.collection('vetoSessions').doc(currentSessionId)
                  .onSnapshot((doc) => {
                      if (doc.exists) {
                          const updatedSessionData = doc.data();
                          displaySpectatorInterface(updatedSessionData); // Re-renderiza a UI com os dados atualizados
                      } else {
                          alert('Sessão foi encerrada ou removida. Redirecionando...');
                          goToHomePage();
                      }
                  }, (error) => {
                      console.error("Erro no listener da sessão para espectador:", error);
                      alert("Erro de conexão com a sessão. Tente recarregar.");
                  });
            }
        }
    }

    /**
     * Reseta a tela de setup.
     */
    function resetSetupSection() {
        selectedFormat = null;
        formatCards.forEach(card => card.classList.remove('selected'));
        startButton.disabled = true;
        startButton.textContent = 'Iniciar Veto';
        selectedFormatText.textContent = '';
    }

    /**
     * Exibe a seção de links gerados com os dados da sessão.
     * @param {object} sessionData Dados da sessão.
     */
    function displayLinks(sessionData) {
        currentSessionId = sessionData.id;
        selectedFormat = sessionData.format;

        sessionIdDisplay.textContent = currentSessionId;
        const baseUrl = window.location.origin + window.location.pathname;

        teamALinkInput.value = `${baseUrl}?session=${currentSessionId}&role=teamA`;
        teamBLinkInput.value = `${baseUrl}?session=${currentSessionId}&role=teamB`;
        spectatorLinkInput.value = `${baseUrl}?session=${currentSessionId}&role=spectator`;

        openLinkButtons.forEach(button => {
            const targetId = button.dataset.target;
            const input = document.getElementById(targetId);
            button.href = input.value;
        });

        linksSection.classList.remove('hidden');
    }

    /**
     * Copia o texto de um input para a área de transferência.
     * @param {string} inputId O ID do input a ser copiado.
     */
    function copyToClipboard(inputId) {
        const input = document.getElementById(inputId);
        input.select();
        input.setSelectionRange(0, 99999);
        document.execCommand('copy');

        const originalText = input.value;
        input.value = 'Copiado!';
        setTimeout(() => {
            input.value = originalText;
        }, 1000);
    }

    /**
     * Renderiza a interface da equipe.
     * @param {object} sessionData Dados da sessão.
     * @param {string} team 'teamA' ou 'teamB'.
     */
    function displayTeamInterface(sessionData, team) {
        teamSection.classList.remove('hidden');
        teamNameDisplay.textContent = `Equipe ${team === 'teamA' ? 'A' : 'B'}`;

        let statusMessage = '';
        if (sessionData.currentTurn === 'finished') {
            statusMessage = 'Veto Finalizado!';
        } else if (sessionData.currentTurn === team) {
            if (sessionData.nextAction === 'veto') {
                statusMessage = `Sua vez de VETAR um mapa!`;
            } else {
                statusMessage = `Sua vez de ESCOLHER um mapa!`;
            }
        } else {
            statusMessage = `Aguardando a Equipe ${sessionData.currentTurn === 'teamA' ? 'A' : 'B'}...`;
        }
        currentActionDisplay.textContent = statusMessage;

        renderMapPool(sessionData, team);
        renderHistory(sessionData.vetoHistory, actionHistoryList, true);
        renderFinalMaps(sessionData.pickedMaps, sessionData.format, finalMapsList, sessionData); // Passa sessionData completa
        checkSessionEndAndShowOverlay(sessionData);
    
    }

    /**
     * Renderiza a interface do espectador.
     * @param {object} sessionData Dados da sessão.
     */
    function displaySpectatorInterface(sessionData) {
        spectatorSection.classList.remove('hidden');

        let statusMessage = '';
        if (sessionData.currentTurn === 'finished') {
            statusMessage = 'Veto Finalizado!';
        } else {
            const currentTurnName = sessionData.currentTurn === 'teamA' ? 'Equipe A' : 'Equipe B';
            const nextActionText = sessionData.nextAction === 'veto' ? 'vetando' : 'escolhendo';
            statusMessage = `${currentTurnName} ${nextActionText}...`;
        }
        spectatorStatus.textContent = statusMessage;

        renderSpectatorMapPool(sessionData);
        renderHistory(sessionData.vetoHistory, spectatorHistoryList, false);
        renderFinalMaps(sessionData.pickedMaps, sessionData.format, spectatorFinalMapsList, sessionData); // Passa sessionData completa
        checkSessionEndAndShowOverlay(sessionData);
    }

    /**
     * Renderiza o pool de mapas para a interface da equipe.
     * @param {object} sessionData Dados da sessão.
     * @param {string} team A equipe atual ('teamA' ou 'teamB').
     */
    function renderMapPool(sessionData, team) {
        availableMapsContainer.innerHTML = '';
        const isSessionFinished = sessionData.currentTurn === 'finished';

        sessionData.maps.forEach(mapName => {
            const isBanned = sessionData.bannedMaps.includes(mapName);
            const isPicked = sessionData.pickedMaps.includes(mapName);
            const isFinalMap = sessionData.finalMap && sessionData.finalMap === mapName;

            const mapCard = document.createElement('div');
            mapCard.classList.add('map-card');
            mapCard.dataset.mapName = mapName;

            if (isBanned) {
                mapCard.classList.add('banned');
            } else if (isPicked) {
                mapCard.classList.add('picked');
            } else if (isFinalMap) {
                mapCard.classList.add('final-map');
            }

            mapCard.innerHTML = `
                <img src="${MAP_IMAGES[mapName]}" alt="${mapName}">
                <div class="map-name">${mapName}</div>
                <div class="actions">
                    <button class="veto-btn" data-action="veto">VETAR</button>
                    <button class="pick-btn" data-action="pick">ESCOLHER</button>
                </div>
            `;

            const vetoButton = mapCard.querySelector('.veto-btn');
            const pickButton = mapCard.querySelector('.pick-btn');

            const isMyTurn = sessionData.currentTurn === team;
            const canVeto = isMyTurn && sessionData.nextAction === 'veto' && !isBanned && !isPicked;
            const canPick = isMyTurn && sessionData.nextAction === 'pick' && !isBanned && !isPicked;

            vetoButton.disabled = !canVeto || isSessionFinished;
            pickButton.disabled = !canPick || isSessionFinished;

            // Para evitar múltiplos event listeners em re-renders, clonamos o nó e o substituímos.
            // Isso remove todos os listeners antigos eficientemente.
            const oldVetoButton = vetoButton;
            const newVetoButton = oldVetoButton.cloneNode(true);
            oldVetoButton.parentNode.replaceChild(newVetoButton, oldVetoButton);

            const oldPickButton = pickButton;
            const newPickButton = oldPickButton.cloneNode(true);
            oldPickButton.parentNode.replaceChild(newPickButton, oldPickButton);


            if (!isSessionFinished && !isBanned && !isPicked) {
                if (canVeto) {
                    newVetoButton.addEventListener('click', () => handleMapAction(mapName, 'veto', team));
                }
                if (canPick) {
                    newPickButton.addEventListener('click', () => handleMapAction(mapName, 'pick', team));
                }
            } else {
                const actionsDiv = mapCard.querySelector('.actions');
                if (actionsDiv) {
                    actionsDiv.style.display = 'none';
                }
            }
            
            availableMapsContainer.appendChild(mapCard);
        });
    }

    /**
     * Renderiza o pool de mapas para a interface do espectador.
     * @param {object} sessionData Dados da sessão.
     */
    function renderSpectatorMapPool(sessionData) {
        spectatorMapGrid.innerHTML = '';
        sessionData.maps.forEach(mapName => {
            const isBanned = sessionData.bannedMaps.includes(mapName);
            const isPicked = sessionData.pickedMaps.includes(mapName);
            const isFinalMap = sessionData.finalMap && sessionData.finalMap === mapName;

            const mapCard = document.createElement('div');
            mapCard.classList.add('map-card');
            if (isBanned) {
                mapCard.classList.add('banned');
            } else if (isPicked) {
                mapCard.classList.add('picked');
            } else if (isFinalMap) {
                mapCard.classList.add('final-map');
            }

            mapCard.innerHTML = `
                <img src="${MAP_IMAGES[mapName]}" alt="${mapName}">
                <div class="map-name">${mapName}</div>
            `;
            spectatorMapGrid.appendChild(mapCard);
        });
    }


    /**
     * Manipula a ação de veto ou escolha de um mapa.
     * @param {string} mapName O nome do mapa.
     * @param {string} actionType 'veto' ou 'pick'.
     * @param {string} actingTeam A equipe realizando a ação ('teamA' ou 'teamB').
     */
    async function handleMapAction(mapName, actionType, actingTeam) {
        let sessionData = null;
        try {
            const docRef = db.collection('vetoSessions').doc(currentSessionId);
            const docSnap = await docRef.get();
            if (docSnap.exists) {
                sessionData = docSnap.data();
            } else {
                alert('Erro: Sessão não encontrada no Firestore para realizar a ação.');
                goToHomePage();
                return;
            }
        } catch (error) {
            console.error("Erro ao carregar sessão do Firestore para handleMapAction:", error);
            alert("Erro de conexão ao tentar realizar a ação. Tente recarregar.");
            return;
        }

        if (sessionData.currentTurn === 'finished') {
            alert('A sessão de veto já foi finalizada!');
            return;
        }
        if (sessionData.currentTurn !== actingTeam) {
            alert(`Não é a sua vez, Equipe ${actingTeam === 'teamA' ? 'A' : 'B'}!`);
            return;
        }
        if (sessionData.nextAction !== actionType) {
            alert(`Você precisa ${sessionData.nextAction === 'veto' ? 'VETAR' : 'ESCOLHER'} um mapa, não ${actionType}ar.`);
            return;
        }
        if (sessionData.bannedMaps.includes(mapName) || sessionData.pickedMaps.includes(mapName)) {
            alert('Este mapa já foi vetado ou escolhido.');
            return;
        }

        const newSessionData = { ...sessionData };

        if (actionType === 'veto') {
            newSessionData.bannedMaps.push(mapName);
            newSessionData.vetoHistory.push({ team: actingTeam, map: mapName, action: 'veto', timestamp: new Date().toLocaleTimeString('pt-BR') });
        } else if (actionType === 'pick') {
            newSessionData.pickedMaps.push(mapName);
            newSessionData.vetoHistory.push({ team: actingTeam, map: mapName, action: 'pick', timestamp: new Date().toLocaleTimeString('pt-BR') });

            if (actingTeam === 'teamA') newSessionData.teamAPickCount++;
            else newSessionData.teamBPickCount++;
        }

        processNextTurn(newSessionData);
           
        try {
            await db.collection('vetoSessions').doc(currentSessionId).set(newSessionData);
            console.log("Sessão atualizada no Firestore com sucesso!");
        } catch (error) {
            console.error("Erro ao salvar sessão no Firestore:", error);
            alert("Ocorreu um erro ao salvar sua ação. Tente novamente.");
        }
    }

    /**
     * Processa o próximo turno/ação da partida com base no formato.
     * @param {object} sessionData Dados da sessão a serem atualizados.
     */
    function processNextTurn(sessionData) {
        const totalMaps = sessionData.maps.length;
        const currentPicked = sessionData.pickedMaps.length;
        const currentBanned = sessionData.bannedMaps.length;
        const remainingMaps = sessionData.maps.filter(map => !sessionData.bannedMaps.includes(map) && !sessionData.pickedMaps.includes(map));

        // MD1 Logic
        if (sessionData.format === 'md1') {
            const requiredActions = totalMaps - 1;

            if (sessionData.vetoHistory.length < requiredActions) {
                sessionData.currentTurn = sessionData.currentTurn === 'teamA' ? 'teamB' : 'teamA';
                sessionData.nextAction = 'veto';
            } else {
                sessionData.finalMap = remainingMaps[0];
                sessionData.currentTurn = 'finished';
            }
        }
        // MD3 Logic
        else if (sessionData.format === 'md3') {
            const totalActions = sessionData.vetoHistory.length;
            
            if (totalActions === 1) { // A vetou 1
                sessionData.currentTurn = 'teamB';
                sessionData.nextAction = 'veto';
            } else if (totalActions === 2) { // B vetou 1
                sessionData.currentTurn = 'teamA';
                sessionData.nextAction = 'pick';
            } else if (totalActions === 3) { // A escolheu 1
                sessionData.currentTurn = 'teamB';
                sessionData.nextAction = 'pick';
            } else if (totalActions === 4) { // B escolheu 1
                const neededBansAfterPicks = totalMaps - sessionData.pickedMaps.length - 1; 
                if (sessionData.bannedMaps.length < neededBansAfterPicks) {
                    sessionData.currentTurn = 'teamA';
                    sessionData.nextAction = 'veto';
                } else {
                    sessionData.finalMap = remainingMaps[0];
                    sessionData.currentTurn = 'finished';
                }
            } else if (sessionData.currentTurn !== 'finished') {
                const neededBansAfterPicks = totalMaps - sessionData.pickedMaps.length - 1;
                if (sessionData.bannedMaps.length < neededBansAfterPicks) {
                    sessionData.currentTurn = sessionData.currentTurn === 'teamA' ? 'teamB' : 'teamA';
                    sessionData.nextAction = 'veto';
                } else {
                    sessionData.finalMap = remainingMaps[0];
                    sessionData.currentTurn = 'finished';
                }
            }
        }
        // MD5 Logic (CORRIGIDA DE NOVO)
        else if (sessionData.format === 'md5') {
            const totalActionsSoFar = sessionData.vetoHistory.length;

            if (sessionData.currentTurn === 'finished') {
                return; // Sessão já finalizada, não faz mais nada.
            }

            switch (totalActionsSoFar) {
                case 0: // 1ª Ação: Equipe A VETA
                    sessionData.currentTurn = 'teamA';
                    sessionData.nextAction = 'veto';
                    break;
                case 1: // 2ª Ação: Equipe B VETA
                    sessionData.currentTurn = 'teamB';
                    sessionData.nextAction = 'veto';
                    break;
                case 2: // 3ª Ação: Equipe A ESCOLHE (1ª de A)
                    sessionData.currentTurn = 'teamA';
                    sessionData.nextAction = 'pick';
                    break;
                case 3: // 4ª Ação: Equipe B ESCOLHE (1ª de B)
                    sessionData.currentTurn = 'teamB';
                    sessionData.nextAction = 'pick';
                    break;
                case 4: // 5ª Ação: Equipe A VETA (2ª de A)
                    sessionData.currentTurn = 'teamA';
                    sessionData.nextAction = 'veto';
                    break;
                case 5: // 6ª Ação: Equipe B VETA (2ª de B)
                    sessionData.currentTurn = 'teamB';
                    sessionData.nextAction = 'veto';
                    break;
                case 6: // 7ª Ação: Equipe A ESCOLHE (2ª de A)
                    sessionData.currentTurn = 'teamA';
                    sessionData.nextAction = 'pick';
                    break;
                case 7:
                     
                    sessionData.currentTurn = 'teamB';
                    sessionData.nextAction = 'pick'; 
                 

                    
                    break;
                default: // Do 9º passo em diante, são apenas vetos alternados
                    const finalBansRemaining = totalMaps - 5 - sessionData.bannedMaps.length;
                    if (finalBansRemaining > 0) {
                        sessionData.currentTurn = sessionData.currentTurn === 'teamA' ? 'teamB' : 'teamA';
                        sessionData.nextAction = 'veto';
                    } else {
                        sessionData.finalMap = remainingMaps[0];
                        sessionData.currentTurn = 'finished';
                    }
                    break;
            }
        }
        
        // Lógica de finalização genérica como fallback
        // Verifica se sobrou apenas um mapa e se o número de picks esperados para o formato já foi atingido.
        if (sessionData.currentTurn !== 'finished' && remainingMaps.length === 1) {
            const expectedPicksForFormat = (sessionData.format === 'md1' ? 0 : (sessionData.format === 'md3' ? 2 : (sessionData.format === 'md5' ? 4 : 0)));
            if (sessionData.pickedMaps.length === expectedPicksForFormat) {
                sessionData.finalMap = remainingMaps[0];
                sessionData.currentTurn = 'finished';
            }
        } 
        
        if (sessionData.currentTurn === 'finished') {
            const finalMapsInState = sessionData.pickedMaps.length + (sessionData.finalMap ? 1 : 0);
            const targetMapsCount = (sessionData.format === 'md1' ? 1
                                     : (sessionData.format === 'md3' ? 3 : 5));
            if (finalMapsInState !== targetMapsCount) {
                console.warn(`Veto finalizado, mas número de mapas finais inesperado (${finalMapsInState}/${targetMapsCount}).`);
            }

            // 1. Limpa o lastSessionId do localStorage
            sessionStorage.removeItem('lastSessionId');

            // 2. Se for o master, avisa e volta para a tela de setup
            if (currentRole === 'master') {
                alert('🟢 Partida concluída! Você pode iniciar uma nova.');
                updateUI(false);
            }
  }
    }


    /**
     * Renderiza o histórico de ações.
     * @param {Array<object>} history O array de histórico.
     * @param {HTMLElement} listElement O elemento UL onde o histórico será renderizado.
     * @param {boolean} showOnlyMyTeam Se true, mostra apenas as ações da equipe atual.
     */
    function renderHistory(history, listElement, showOnlyMyTeam) {
        listElement.innerHTML = '';
        const displayHistory = showOnlyMyTeam ? history.filter(item => item.team === currentTeam) : history;

        displayHistory.forEach(item => {
            const listItem = document.createElement('li');
            listItem.classList.add(item.action === 'veto' ? 'vetoed' : 'picked');
            const teamName = item.team === 'teamA' ? 'Equipe A' : 'Equipe B';
            const actionText = item.action === 'veto' ? 'vetou' : 'escolheu';
            listItem.innerHTML = `<i class="fas fa-${item.action === 'veto' ? 'ban' : 'check'}"></i> ${teamName} ${actionText} ${item.map} (${item.timestamp})`;
            listElement.appendChild(listItem);
        });
        listElement.scrollTop = listElement.scrollHeight;
    }

    /**
     * Renderiza a lista de mapas finais.
     * @param {Array<string>} pickedMaps Os mapas que foram escolhidos.
     * @param {string} format O formato da partida.
     * @param {HTMLElement} listElement O elemento UL onde os mapas finais serão renderizados.
     * @param {object} sessionData A sessionData atual para verificar o estado de finalização.
     */
    function renderFinalMaps(pickedMaps, format, listElement, sessionData) { // Agora recebe sessionData
        listElement.innerHTML = '';
        
        const finalMap = sessionData ? sessionData.finalMap : null; // Usa sessionData recebida

        let mapsToShow = [...pickedMaps];
        if (finalMap && !pickedMaps.includes(finalMap)) {
            mapsToShow.push(finalMap);
        }

        const targetMapsCount = (format === 'md1' ? 1 : (format === 'md3' ? 3 : 5));
        
        // Somente exibe mapas finais se a sessão está finalizada E a contagem corresponde
        if (sessionData.currentTurn === 'finished' && mapsToShow.length === targetMapsCount) {
            mapsToShow.sort();

            mapsToShow.forEach(mapName => {
                const listItem = document.createElement('li');
                listItem.classList.add('final-map-item'); 
                listItem.textContent = mapName;
                listElement.appendChild(listItem);
            });
        } else if (sessionData.currentTurn === 'finished' && mapsToShow.length !== targetMapsCount) {
             listElement.innerHTML = `<li>Veto concluído, mas número de mapas finais inesperado (${mapsToShow.length}/${targetMapsCount}).</li>`;
        } else {
             listElement.innerHTML = '<li>Aguardando finalização do veto...</li>';
        }
    }

    // --- Event Listeners ---

    // 1. Seleção do Formato da Partida (na tela de setup)
    formatCards.forEach(card => {
        card.addEventListener('click', () => {
            formatCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');

            selectedFormat = card.dataset.format;
            startButton.disabled = false;
            startButton.textContent = `Iniciar Veto ${selectedFormat.toUpperCase()}`;
            selectedFormatText.textContent = selectedFormat.toUpperCase();
        });
    });

    // 2. Iniciar Veto (Cria uma Nova Sessão no Firestore)
    startButton.addEventListener('click', async () => {
        if (!selectedFormat) {
            alert('Por favor, selecione um formato de partida (MD1, MD3 ou MD5).');
            return;
        }


            let sessionId, newSessionRef, exists;
            do {
         sessionId = generateSessionId();
         newSessionRef = db.collection('vetoSessions').doc(sessionId);
            const snap = await newSessionRef.get();
            exists = snap.exists;
         } while (exists);
            currentSessionId = sessionId;
       

        const mapsPool = [
            //"Airport",
            "CrossPort", 
            "City Cat", 
            //"Depot", 
            //"Desert 2", 
            "DragonRoad", 
            "5th Depot", 
            //"Frozen", 
            "Old Town", 
            "Provence", 
            //"Western", 
            "White Squall",
            "Two Face"
        ];
        
        const sessionData = {
            id: currentSessionId,
            format: selectedFormat,
            maps: mapsPool,
            bannedMaps: [],
            pickedMaps: [],
            finalMap: null,
            vetoHistory: [],
            currentTurn: 'teamA',
            nextAction: 'veto',
            teamAPickCount: 0,
            teamBPickCount: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            await newSessionRef.set(sessionData);
            sessionStorage.setItem('lastSessionId', currentSessionId); // Apenas guarda o ID para "continuar sessão"
            updateUI(true); // Força a exibição dos links
        } catch (error) {
            console.error("Erro ao criar nova sessão no Firestore:", error);
            alert("Não foi possível iniciar a sessão. Tente novamente.");
        }
    });

    // 3. Copiar Links
    copyButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.target;
            copyToClipboard(targetId);
        });
    });

    // 4. Criar Nova Sessão (Botão de Reset da tela de Links Gerados)
    createNewSessionButton.addEventListener('click', async () => {
        if (confirm('Tem certeza que deseja criar uma nova sessão? A sessão atual será perdida.')) {
            if (currentSessionId) {
                try {
                    await db.collection('vetoSessions').doc(currentSessionId).delete();
                    console.log("Sessão ativa deletada do Firestore:", currentSessionId);
                } catch (error) {
                    console.error("Erro ao deletar sessão ativa do Firestore:", error);
                }
            }
            sessionStorage.removeItem('lastSessionId'); // Limpa a referência local da última sessão
            goToHomePage();
        }
    });

    // 5. Botões da tela de continuação (Carregam do Firestore)
    if (continueSessionButton) {
        continueSessionButton.addEventListener('click', () => {
    const lastSessionId = sessionStorage.getItem('lastSessionId');
    if (!lastSessionId) {
        alert('Nenhuma sessão anterior encontrada para continuar.');
        return;
    }
    // atualiza a variável global e já exibe a tela de links:
    currentSessionId = lastSessionId;
    updateUI(true);
});
    }

    if (startNewSessionButton) {
        startNewSessionButton.addEventListener('click', async () => {
            if (confirm('Tem certeza que deseja iniciar uma nova sessão? A sessão atual será perdida.')) {
                const lastSessionId = sessionStorage.getItem('lastSessionId');
                if (lastSessionId) {
                    try {
                        await db.collection('vetoSessions').doc(lastSessionId).delete();
                        console.log("Sessão antiga (última) deletada do Firestore:", lastSessionId);
                    } catch (error) {
                        console.error("Erro ao deletar sessão antiga (última) do Firestore:", error);
                    }
                }
                sessionStorage.removeItem('lastSessionId');
                goToHomePage();
            }
        });
    }

    // --- Inicialização ---
    updateUI(false);
});

function processNextTurn() {
  // Nova lógica MD5: escolhe, escolhe, veta, veta, escolhe, escolhe, veta (ciclo de 7)
  const md5Sequence = ['choose', 'choose', 'veto', 'veto', 'choose', 'choose', 'veto'];
  const nextIndex = (vetoHistory.length) % md5Sequence.length;
  const expectedAction = md5Sequence[nextIndex];

  // Atualiza estado esperado para uso pelo restante do código/UI
  sessionData.expectedAction = expectedAction; // "choose" ou "veto"
  sessionData.isVetoTurn = expectedAction === 'veto';

  // Ajuste de instruções na UI — garante que a UI passe a refletir a nova regra
  if (typeof updateUI === 'function') {
    updateUI();
  }
}