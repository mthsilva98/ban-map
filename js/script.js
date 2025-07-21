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
    const currentActionDisplay = document.getElementById('currentActionDisplay');
    const availableMapsContainer = document.getElementById('availableMaps');
    const actionHistoryList = document.getElementById('actionHistory');
    const finalMapsList = document.getElementById('finalMapsList');

    // Elementos da Seção do Espectador (Spectator Section)
    const spectatorStatus = document.getElementById('spectatorStatus');
    const spectatorMapGrid = document.getElementById('spectatorMapGrid');
    const spectatorHistoryList = document.getElementById('spectatorHistory');
    const spectatorFinalMapsList = document.getElementById('spectatorFinalMaps');

    // Variáveis de estado global (serão carregadas/salvas no localStorage)
    let selectedFormat = null;
    let currentSessionId = null;
    let currentRole = null; // 'master', 'teamA', 'teamB', 'spectator'
    let currentTeam = null; // 'teamA' ou 'teamB' se for uma interface de equipe

    // **** ATENÇÃO: OBJETO MAP_IMAGES ATUALIZADO COM SEUS NOVOS MAPAS ****
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
        // Certifique-se que o nome do arquivo .png corresponde EXATAMENTE ao nome da chave aqui.
        // Por exemplo, se seu arquivo é "Desert2.png", mude a chave para "Desert2".
        // Se você não tiver uma imagem para algum desses mapas, crie um "placeholder.png" na pasta img/
    };

    // --- Funções Auxiliares ---

    /**
     * Gera um ID de sessão único e curto.
     * @returns {string} O ID da sessão.
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
        window.location.href = window.location.origin + window.location.pathname;
    }

    /**
     * Atualiza a UI com base no papel (role) e estado da sessão.
     * @param {boolean} forceLinksDisplay Se true, vai direto para a tela de links. Usado após iniciar ou continuar.
     */
    function updateUI(forceLinksDisplay = false) {
        hideAllSections(); // Esconde tudo primeiro

        const params = getUrlParams();
        currentSessionId = params.session || null;
        currentRole = params.role || 'master'; // 'master' é a tela inicial

        const storedSession = localStorage.getItem('vetoSession');
        let sessionData = storedSession ? JSON.parse(storedSession) : null;

        // Lógica para a tela principal ('master')
        if (currentRole === 'master') {
            if (sessionData && !forceLinksDisplay) {
                // Existe sessão salva, mas não foi forçado a mostrar links (usuário abriu a página master)
                currentSessionInfo.textContent = `Uma sessão MD${sessionData.format.slice(2)} (${sessionData.id}) está em andamento.`;
                continueSessionSection.classList.remove('hidden');
            } else if (sessionData && forceLinksDisplay) {
                // Sessão criada ou continuada, mostra os links
                displayLinks(sessionData);
            } else {
                // Nenhuma sessão ativa, mostra a tela de configuração
                setupSection.classList.remove('hidden');
                resetSetupSection();
            }
        }
        // Lógica para as interfaces de Equipe ou Espectador
        else {
            if (!sessionData || sessionData.id !== currentSessionId) {
                // Sessão não encontrada ou ID da URL não corresponde - Redirecionar para home ou mostrar erro
                alert('Sessão não encontrada ou expirada. Por favor, gere um novo link na página principal.');
                goToHomePage();
                return;
            }

            // Garante que o sessionData está sempre atualizado para outras roles
            sessionData = JSON.parse(localStorage.getItem('vetoSession'));

            if (currentRole === 'teamA' || currentRole === 'teamB') {
                currentTeam = currentRole;
                displayTeamInterface(sessionData, currentTeam);
            } else if (currentRole === 'spectator') {
                displaySpectatorInterface(sessionData);
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

        // Lógica de turno e mensagem
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
        renderHistory(sessionData.vetoHistory, actionHistoryList, true); // true para mostrar apenas histórico da equipe
        renderFinalMaps(sessionData.pickedMaps, sessionData.format, finalMapsList);
    }

    /**
     * Renderiza a interface do espectador.
     * @param {object} sessionData Dados da sessão.
     */
    function displaySpectatorInterface(sessionData) {
        spectatorSection.classList.remove('hidden');

        // Lógica de status
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
        renderHistory(sessionData.vetoHistory, spectatorHistoryList, false); // false para mostrar histórico completo
        renderFinalMaps(sessionData.pickedMaps, sessionData.format, spectatorFinalMapsList);
    }

    /**
     * Renderiza o pool de mapas para a interface da equipe.
     * @param {object} sessionData Dados da sessão.
     * @param {string} team A equipe atual ('teamA' ou 'teamB').
     */
    function renderMapPool(sessionData, team) {
        availableMapsContainer.innerHTML = ''; // Limpa antes de renderizar
        const isSessionFinished = sessionData.currentTurn === 'finished'; // Verifica uma vez fora do loop

        sessionData.maps.forEach(mapName => {
            const isBanned = sessionData.bannedMaps.includes(mapName);
            const isPicked = sessionData.pickedMaps.includes(mapName);
            const isFinalMap = sessionData.finalMap && sessionData.finalMap === mapName;

            const mapCard = document.createElement('div');
            mapCard.classList.add('map-card');
            mapCard.dataset.mapName = mapName;

            // Adiciona classes de estado para estilização
            if (isBanned) {
                mapCard.classList.add('banned');
            } else if (isPicked) {
                mapCard.classList.add('picked');
            } else if (isFinalMap) {
                mapCard.classList.add('final-map');
            }

            mapCard.innerHTML = `
                <img src="${MAP_IMAGES[mapName] || 'img/placeholder.png'}" alt="${mapName}">
                <div class="map-name">${mapName}</div>
                <div class="actions">
                    <button class="veto-btn" data-action="veto">VETAR</button>
                    <button class="pick-btn" data-action="pick">ESCOLHER</button>
                </div>
            `;

            const vetoButton = mapCard.querySelector('.veto-btn');
            const pickButton = mapCard.querySelector('.pick-btn');

            // Habilita/Desabilita botões
            const isMyTurn = sessionData.currentTurn === team;
            const canVeto = isMyTurn && sessionData.nextAction === 'veto' && !isBanned && !isPicked;
            const canPick = isMyTurn && sessionData.nextAction === 'pick' && !isBanned && !isPicked;

            vetoButton.disabled = !canVeto || isSessionFinished;
            pickButton.disabled = !canPick || isSessionFinished;

            // Adiciona event listeners APENAS se o botão estiver habilitado e a sessão não terminou
            if (!isSessionFinished && !isBanned && !isPicked) { // Só permite interação com mapas não finalizados
                if (canVeto) {
                    // Remove listeners antigos para evitar duplicação em re-renders
                    vetoButton.removeEventListener('click', () => handleMapAction(mapName, 'veto', team)); 
                    vetoButton.addEventListener('click', () => handleMapAction(mapName, 'veto', team));
                }
                if (canPick) {
                    // Remove listeners antigos para evitar duplicação em re-renders
                    pickButton.removeEventListener('click', () => handleMapAction(mapName, 'pick', team));
                    pickButton.addEventListener('click', () => handleMapAction(mapName, 'pick', team));
                }
            } else {
                 // Se o mapa está banido/escolhido ou a sessão finalizou, esconde os botões de ação
                 const actionsDiv = mapCard.querySelector('.actions');
                 if (actionsDiv) {
                    actionsDiv.style.display = 'none'; // Esconde a div de ações
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
                <img src="${MAP_IMAGES[mapName] || 'img/placeholder.png'}" alt="${mapName}">
                <div class="map-name">${mapName}</div>
            `;
            // Espectador não tem botões de ação
            //mapCard.querySelector('.map-name').style.borderTop = 'none'; // Não é necessário se não há div de actions

            spectatorMapGrid.appendChild(mapCard);
        });
    }


    /**
     * Manipula a ação de veto ou escolha de um mapa.
     * @param {string} mapName O nome do mapa.
     * @param {string} actionType 'veto' ou 'pick'.
     * @param {string} actingTeam A equipe realizando a ação ('teamA' ou 'teamB').
     */
    function handleMapAction(mapName, actionType, actingTeam) {
        // SEMPRE pega a versão mais recente do localStorage ao iniciar a ação
        let sessionData = JSON.parse(localStorage.getItem('vetoSession'));

        // Validação básica de turno e ação
        if (!sessionData) {
            alert('Erro: Sessão não encontrada. Por favor, recarregue a página principal.');
            goToHomePage();
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

        const newSessionData = { ...sessionData }; // Cria uma cópia para modificar

        if (actionType === 'veto') {
            newSessionData.bannedMaps.push(mapName);
            newSessionData.vetoHistory.push({ team: actingTeam, map: mapName, action: 'veto', timestamp: new Date().toLocaleTimeString('pt-BR') });
        } else if (actionType === 'pick') {
            newSessionData.pickedMaps.push(mapName);
            newSessionData.vetoHistory.push({ team: actingTeam, map: mapName, action: 'pick', timestamp: new Date().toLocaleTimeString('pt-BR') });

            // Incrementar contadores de pick para MD3/MD5 (manteremos, pode ser útil para outras lógicas)
            if (actingTeam === 'teamA') newSessionData.teamAPickCount++;
            else newSessionData.teamBPickCount++;
        }

        // Lógica de transição de turno/ação baseada no formato
        processNextTurn(newSessionData);

        localStorage.setItem('vetoSession', JSON.stringify(newSessionData));
        
        // Disparar o evento storage manualmente para forçar atualização imediata em todas as abas,
        // pois o evento 'storage' só dispara se a mudança for feita por outra aba do mesmo domínio.
        // Isso é crucial para sincronização em tempo real sem um backend.
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'vetoSession',
            newValue: JSON.stringify(newSessionData),
            oldValue: JSON.stringify(sessionData),
            url: window.location.href,
            storageArea: localStorage
        }));
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

        // MD1 Logic (no change)
        if (sessionData.format === 'md1') {
            const requiredActions = totalMaps - 1; // 11 vetos para 12 mapas

            if (sessionData.vetoHistory.length < requiredActions) {
                sessionData.currentTurn = sessionData.currentTurn === 'teamA' ? 'teamB' : 'teamA';
                sessionData.nextAction = 'veto';
            } else {
                sessionData.finalMap = remainingMaps[0];
                sessionData.currentTurn = 'finished'; // Marca como terminado
            }
        }
        // MD3 Logic (no change)
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
                // 2 vetos e 2 picks feitos. Agora vetos restantes até sobrar 1 para desempate
                const neededBansAfterPicks = totalMaps - sessionData.pickedMaps.length - 1; 
                if (sessionData.bannedMaps.length < neededBansAfterPicks) {
                    sessionData.currentTurn = 'teamA'; // Começa A vetando novamente
                    sessionData.nextAction = 'veto';
                } else {
                    sessionData.finalMap = remainingMaps[0];
                    sessionData.currentTurn = 'finished';
                }
            } else if (sessionData.currentTurn !== 'finished') { // Continua vetando após os picks iniciais
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
        // MD5 Logic (UPDATED as requested)
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
                case 7: // 8ª Ação: Equipe B ESCOLHE (2ª de B)
                    // Total de 8 ações concluídas (4 vetos e 4 picks).
                    // Agora, fase de vetos alternados até sobrar 1 mapa para desempate.
                    const totalVetosNeededMD5 = totalMaps - 5; // Precisamos de 5 mapas finais (4 picks + 1 tiebreaker)
                    const currentVetosCount = sessionData.bannedMaps.length; // Já temos 4 vetos feitos

                    if (currentVetosCount < totalVetosNeededMD5) {
                        sessionData.currentTurn = 'teamA'; // Inicia a fase de vetos alternados
                        sessionData.nextAction = 'veto';
                    } else {
                        // Se não há mais vetos necessários, o mapa restante é o final
                        sessionData.finalMap = remainingMaps[0];
                        sessionData.currentTurn = 'finished';
                    }
                    break;
                default: // Ações a partir da 9ª: vetos alternados
                    const currentTotalVetos = sessionData.bannedMaps.length;
                    const totalVetosRequired = totalMaps - 5; // 5 mapas finais

                    if (currentTotalVetos < totalVetosRequired) {
                        sessionData.currentTurn = sessionData.currentTurn === 'teamA' ? 'teamB' : 'teamA';
                        sessionData.nextAction = 'veto';
                    } else {
                        sessionData.finalMap = remainingMaps[0];
                        sessionData.currentTurn = 'finished';
                    }
                    break;
            }
        }
        
        // Lógica de finalização genérica, caso falhe na lógica específica do formato
        // Esta condição tenta capturar o final se a lógica de switch/case não o fez.
        if (sessionData.currentTurn !== 'finished' && remainingMaps.length === 1 && 
           ((sessionData.format === 'md1' && sessionData.pickedMaps.length === 0) || // MD1: 1 final map, 0 picks
            (sessionData.format === 'md3' && sessionData.pickedMaps.length === 2) || // MD3: 1 final map, 2 picks
            (sessionData.format === 'md5' && sessionData.pickedMaps.length === 4))) { // MD5: 1 final map, 4 picks
            
            sessionData.finalMap = remainingMaps[0];
            sessionData.currentTurn = 'finished';
        } else if (sessionData.currentTurn === 'finished') {
            // Se já está marcado como finished, verificar se a contagem final está correta
            const targetMapsCount = (sessionData.format === 'md1' ? 1 : (sessionData.format === 'md3' ? 3 : 5));
            const finalMapsInState = sessionData.pickedMaps.length + (sessionData.finalMap ? 1 : 0);
            if (finalMapsInState !== targetMapsCount) {
                 console.warn(`Veto finalizado, mas o número de mapas finais não corresponde ao formato (${finalMapsInState}/${targetMapsCount}). Verifique a lógica do formato.`);
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
        listElement.scrollTop = listElement.scrollHeight; // Rola para o final
    }

    /**
     * Renderiza a lista de mapas finais.
     * @param {Array<string>} pickedMaps Os mapas que foram escolhidos.
     * @param {string} format O formato da partida.
     * @param {HTMLElement} listElement O elemento UL onde os mapas finais serão renderizados.
     */
    function renderFinalMaps(pickedMaps, format, listElement) {
        listElement.innerHTML = '';
        
        const sessionData = JSON.parse(localStorage.getItem('vetoSession'));
        const finalMap = sessionData ? sessionData.finalMap : null;

        let mapsToShow = [...pickedMaps];
        if (finalMap && !pickedMaps.includes(finalMap)) {
            mapsToShow.push(finalMap);
        }

        // Para MD1, o finalMap é o único mapa. Para MD3 e MD5, é o conjunto de pickedMaps + finalMap
        const targetMapsCount = (format === 'md1' ? 1 : (format === 'md3' ? 3 : 5));
        
        if (mapsToShow.length === 0 && sessionData.currentTurn !== 'finished') {
            listElement.innerHTML = '<li>Nenhum mapa final ainda.</li>';
            return;
        }

        // Se a sessão está finalizada e o número de mapasToShow é o esperado, exibe-os.
        if (sessionData.currentTurn === 'finished' && mapsToShow.length === targetMapsCount) {
            // Ordena os mapas finais para consistência visual
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

    // 2. Iniciar Veto (Cria uma Nova Sessão)
    startButton.addEventListener('click', () => {
        if (!selectedFormat) {
            alert('Por favor, selecione um formato de partida (MD1, MD3 ou MD5).');
            return;
        }

        currentSessionId = generateSessionId();
        // **** SUA NOVA LISTA DE MAPAS ****
        const mapsPool = [
            "Airport", "CrossPort", "City Cat", "Depot", "Desert 2", "DragonRoad", 
            "5th Depot", "Frozen", "Old Town", "Provence", "Western", "White Squall"
        ];
        
        const sessionData = {
            id: currentSessionId,
            format: selectedFormat,
            maps: mapsPool, // Lista completa de mapas
            bannedMaps: [],
            pickedMaps: [],
            finalMap: null, // O mapa que sobra no MD1 ou o desempate
            vetoHistory: [],
            currentTurn: 'teamA', // Equipe que começa
            nextAction: 'veto', // 'veto' ou 'pick'
            teamAPickCount: 0,
            teamBPickCount: 0,
        };

        localStorage.setItem('vetoSession', JSON.stringify(sessionData));
        updateUI(true); // Força a exibição dos links após criar nova sessão
    });

    // 3. Copiar Links
    copyButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.target;
            copyToClipboard(targetId);
        });
    });

    // 4. Criar Nova Sessão (Botão de Reset da tela de Links Gerados)
    createNewSessionButton.addEventListener('click', () => {
        if (confirm('Tem certeza que deseja criar uma nova sessão? A sessão atual será perdida.')) {
            localStorage.removeItem('vetoSession'); // Limpa os dados da sessão
            goToHomePage(); // Redireciona para a home limpa
        }
    });

    // 5. Botões da tela de continuação
    if (continueSessionButton) {
        continueSessionButton.addEventListener('click', () => {
            updateUI(true); // Continua para a sessão existente e mostra os links
        });
    }

    if (startNewSessionButton) {
        startNewSessionButton.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja iniciar uma nova sessão? A sessão atual será perdida.')) {
                localStorage.removeItem('vetoSession'); // Limpa a sessão existente
                goToHomePage(); // Redireciona para a home limpa
            }
        });
    }

    // --- Inicialização ---
    // Este ponto de entrada determina qual interface mostrar ao carregar a página
    updateUI(false); // Não força a exibição dos links na carga inicial, permite ver a tela de continuar
    
    // Escuta mudanças no localStorage de outras abas/janelas para sincronização
    window.addEventListener('storage', (event) => {
        if (event.key === 'vetoSession' || event.key === null) { // key === null para qualquer mudança
            console.log('Dados da sessão atualizados em outra aba, atualizando UI...');
            // Quando a página é atualizada por 'storage', precisamos buscar o novo estado e renderizar
            const sessionData = JSON.parse(localStorage.getItem('vetoSession'));
            if (sessionData) {
                if (currentRole === 'teamA' || currentRole === 'teamB') {
                    displayTeamInterface(sessionData, currentTeam);
                } else if (currentRole === 'spectator') {
                    displaySpectatorInterface(sessionData);
                } else if (currentRole === 'master') {
                    updateUI(false); // Atualiza a tela master para refletir a sessão
                }
            } else {
                 // Sessão foi limpa em outra aba, volte para a home
                 if (currentRole !== 'master') { // Se não estiver na home, redirecione
                    goToHomePage();
                 } else { // Se já estiver na home, apenas resete a UI
                     updateUI(false);
                 }
            }
        }
    });
});