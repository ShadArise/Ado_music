// script.js
const audioPlayer = document.getElementById('audio-player');
const videoPlayer = document.getElementById('video-player-element');
const albumArt = document.getElementById('album-art');
const songTitle = document.getElementById('song-title');
const songArtist = document.getElementById('song-artist');
const songInfoText = document.getElementById('song-info-text');
const currentTime = document.getElementById('current-time');
const totalTime = document.getElementById('total-time');
const progressBar = document.getElementById('progress-bar');
const progressFill = document.getElementById('progress-fill');
const progressHandle = document.getElementById('progress-handle');
const playPauseBtn = document.getElementById('play-pause-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const shuffleBtn = document.getElementById('shuffle-btn');
const repeatBtn = document.getElementById('repeat-btn');
const favoriteBtn = document.getElementById('favorite-btn');
const volumeRange = document.getElementById('volume-range');
const muteBtn = document.getElementById('mute-btn');
const visualizerCanvas = document.getElementById('visualizer-canvas');
const searchInput = document.getElementById('song-search');
const songsList = document.getElementById('songs-list');
const themeToggle = document.getElementById('theme-toggle');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const modalClose = document.getElementById('modal-close');
const autoPlayToggle = document.getElementById('auto-play');
const crossfadeRange = document.getElementById('crossfade');
const qualitySelect = document.getElementById('quality');
const lyricsContent = document.getElementById('lyrics-content');
const lyricsLang = document.getElementById('lyrics-lang');
const lyricsSync = document.getElementById('lyrics-sync');
const contextMenu = document.getElementById('context-menu');
const toastContainer = document.getElementById('toast-container');
const navBtns = document.querySelectorAll('.nav-btn');
const tabContents = document.querySelectorAll('.tab-content');
const playlistTabs = document.querySelectorAll('.playlist-tabs .tab-btn');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const theaterModeBtn = document.getElementById('theater-mode');

let currentSongId = null;
let isShuffling = false;
let isRepeating = false;
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let recentSongs = JSON.parse(localStorage.getItem('recentSongs')) || [];
let isDraggingProgress = false;
let isLyricsSync = false;
let audioContext = null;  // Se inicializará en initializeAudioVisualizer

const songData = {
    '1': {
        file: 'usseewa.mp3',
        title: 'うっせぇわ (Usseewa)',
        artist: 'Ado',
        info: 'Lanzada en 2020, "Usseewa" es el sencillo debut de Ado...',
        video: 'usseewa_video.mp4'
    },
    '2': {
        file: 'odo.mp3',
        title: '踊 (Odo)',
        artist: 'Ado',
        info: '"Odo", que significa "bailar", es una canción enérgica...',
        video: 'odo_video.mp4'
    }
};

function initializeApp() {
    hideLoader();
    initializeTabs();
    initializeAudioVisualizer();
    initializeKeyboardShortcuts();
    loadUserPreferences();
    setupEventListeners();
    updateFavoritesUI();
}

function hideLoader() {
    const loader = document.getElementById('loader');
    setTimeout(() => {
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.style.display = 'none';
        }, 300);
    }, 1500);
}

function initializeTabs() {
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            navBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`${btn.dataset.tab}-tab`).classList.add('active');
        });
    });
}

function initializeAudioVisualizer() {
    const ctx = visualizerCanvas.getContext('2d');
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaElementSource(audioPlayer);
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    visualizerCanvas.width = visualizerCanvas.offsetWidth;
    visualizerCanvas.height = visualizerCanvas.offsetHeight;

    function drawVisualizer() {
        requestAnimationFrame(drawVisualizer);
        analyser.getByteFrequencyData(dataArray);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
        const barWidth = (visualizerCanvas.width / bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const barHeight = dataArray[i];
            ctx.fillStyle = `rgb(${barHeight + 100}, 50, 150)`;
            ctx.fillRect(x, visualizerCanvas.height - barHeight / 2, barWidth, barHeight / 2);
            x += barWidth + 1;
        }
    }
    drawVisualizer();
}

function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            togglePlayPause();
        }
        if (e.code === 'ArrowRight') nextSong();
        if (e.code === 'ArrowLeft') prevSong();
    });
}

function loadUserPreferences() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.className = savedTheme;
    themeToggle.querySelector('i').className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    autoPlayToggle.checked = JSON.parse(localStorage.getItem('autoPlay')) || false;
    crossfadeRange.value = localStorage.getItem('crossfade') || 3;
    qualitySelect.value = localStorage.getItem('quality') || 'high';
}

function setupEventListeners() {
    playPauseBtn.addEventListener('click', togglePlayPause);
    prevBtn.addEventListener('click', prevSong);
    nextBtn.addEventListener('click', nextSong);
    shuffleBtn.addEventListener('click', toggleShuffle);
    repeatBtn.addEventListener('click', toggleRepeat);
    favoriteBtn.addEventListener('click', () => toggleFavorite(currentSongId));
    volumeRange.addEventListener('input', () => {
        audioPlayer.volume = volumeRange.value / 100;
        muteBtn.querySelector('i').className = audioPlayer.volume === 0 ? 'fas fa-volume-mute' : 'fas fa-volume-up';
    });
    muteBtn.addEventListener('click', toggleMute);
    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('ended', handleSongEnd);
    audioPlayer.addEventListener('error', (e) => {
        console.error('Error al reproducir el audio:', e);
        showToast('Error al reproducir la canción. Verifica el archivo o la conexión.');
    });
    progressBar.addEventListener('click', seek);
    progressHandle.addEventListener('mousedown', () => isDraggingProgress = true);
    document.addEventListener('mousemove', (e) => {
        if (isDraggingProgress) seek(e);
    });
    document.addEventListener('mouseup', () => isDraggingProgress = false);
    searchInput.addEventListener('input', filterSongs);
    themeToggle.addEventListener('click', toggleTheme);
    settingsBtn.addEventListener('click', () => settingsModal.style.display = 'flex');
    modalClose.addEventListener('click', () => settingsModal.style.display = 'none');
    autoPlayToggle.addEventListener('change', () => localStorage.setItem('autoPlay', autoPlayToggle.checked));
    crossfadeRange.addEventListener('input', () => localStorage.setItem('crossfade', crossfadeRange.value));
    qualitySelect.addEventListener('change', () => localStorage.setItem('quality', qualitySelect.value));
    lyricsLang.addEventListener('change', () => loadLyrics(currentSongId));
    lyricsSync.addEventListener('click', toggleLyricsSync);
    playlistTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            playlistTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            updatePlaylist(tab.dataset.playlist);
        });
    });
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const songItem = e.target.closest('.song-item');
        if (songItem) {
            showContextMenu(e, songItem.dataset.songId);
        }
    });
    contextMenu.querySelectorAll('.context-menu-item').forEach(item => {
        item.addEventListener('click', () => {
            const action = item.dataset.action;
            const songId = contextMenu.dataset.songId;
            if (action === 'play') {
                const song = songData[songId];
                playSong(song.file, song.title, song.artist, song.info, songId);
            } else if (action === 'favorite') {
                toggleFavorite(songId);
            } else if (action === 'playlist') {
                showToast('Función de agregar a playlist no implementada');
            } else if (action === 'download') {
                showToast('Función de descarga no implementada');
            }
            contextMenu.style.display = 'none';
        });
    });
    fullscreenBtn.addEventListener('click', toggleFullscreen);
    theaterModeBtn.addEventListener('click', toggleTheaterMode);
}

function playSong(file, title, artist, info, songId) {
    currentSongId = songId;
    const audioSrc = `/static/music/${file}`;
    console.log(`Intentando cargar audio desde: ${audioSrc}`);  // Depuración
    audioPlayer.src = audioSrc;
    audioPlayer.type = 'audio/mpeg';  // Tipo explícito para compatibilidad
    videoPlayer.src = `/static/videos/${file.replace('.mp3', '_video.mp4')}`;
    songTitle.textContent = title;
    songArtist.textContent = artist;
    songInfoText.textContent = info;
    albumArt.src = `/static/images/ado_profile.jpg`;
    audioPlayer.load();  // Recarga el audio para aplicar cambios
    audioPlayer.muted = false;  // Asegura que no esté muteado
    // Reanuda el AudioContext si está suspendido (para habilitar el sonido)
    if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            console.log('AudioContext reanudado exitosamente');
            audioPlayer.play().then(() => {
                showToast(`Reproduciendo: ${title}`);
            }).catch(e => {
                console.error('Error al reproducir:', e);
                showToast('No se pudo reproducir la canción. Verifica el archivo o la conexión.');
            });
        }).catch(e => {
            console.error('Error al reanudar AudioContext:', e);
            showToast('Error al habilitar el sonido. Intenta hacer clic en reproducir nuevamente.');
        });
    } else {
        audioPlayer.play().then(() => {
            showToast(`Reproduciendo: ${title}`);
        }).catch(e => {
            console.error('Error al reproducir:', e);
            showToast('No se pudo reproducir la canción. Verifica el archivo o la conexión.');
        });
    }
    videoPlayer.play().catch(e => console.error('Error al reproducir video:', e));
    playPauseBtn.querySelector('i').className = 'fas fa-pause';
    addToRecent(songId);
    loadLyrics(songId);
}

function togglePlayPause() {
    if (audioPlayer.paused) {
        // Reanuda AudioContext si es necesario antes de reproducir
        if (audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                console.log('AudioContext reanudado en togglePlayPause');
                audioPlayer.play().then(() => {
                    playPauseBtn.querySelector('i').className = 'fas fa-pause';
                }).catch(e => {
                    console.error('Error al reproducir:', e);
                    showToast('No se pudo reproducir la canción. Verifica la conexión o interactúa con la página.');
                });
            });
        } else {
            audioPlayer.play().then(() => {
                playPauseBtn.querySelector('i').className = 'fas fa-pause';
            }).catch(e => {
                console.error('Error al reproducir:', e);
                showToast('No se pudo reproducir la canción. Verifica la conexión o interactúa con la página.');
            });
        }
        videoPlayer.play();
    } else {
        audioPlayer.pause();
        videoPlayer.pause();
        playPauseBtn.querySelector('i').className = 'fas fa-play';
    }
}

function prevSong() {
    const songIds = Object.keys(songData);
    let index = songIds.indexOf(currentSongId);
    index = isShuffling ? Math.floor(Math.random() * songIds.length) : (index - 1 + songIds.length) % songIds.length;
    const song = songData[songIds[index]];
    playSong(song.file, song.title, song.artist, song.info, songIds[index]);
}

function nextSong() {
    const songIds = Object.keys(songData);
    let index = songIds.indexOf(currentSongId);
    index = isShuffling ? Math.floor(Math.random() * songIds.length) : (index + 1) % songIds.length;
    const song = songData[songIds[index]];
    playSong(song.file, song.title, song.artist, song.info, songIds[index]);
}

function handleSongEnd() {
    if (isRepeating) {
        audioPlayer.currentTime = 0;
        audioPlayer.play();
        videoPlayer.currentTime = 0;
        videoPlayer.play();
    } else {
        nextSong();
    }
}

function toggleShuffle() {
    isShuffling = !isShuffling;
    shuffleBtn.classList.toggle('active', isShuffling);
    showToast(isShuffling ? 'Modo aleatorio activado' : 'Modo aleatorio desactivado');
}

function toggleRepeat() {
    isRepeating = !isRepeating;
    repeatBtn.classList.toggle('active', isRepeating);
    showToast(isRepeating ? 'Repetición activada' : 'Repetición desactivada');
}

function toggleFavorite(songId) {
    if (!songId) return;
    const index = favorites.indexOf(songId);
    if (index === -1) {
        favorites.push(songId);
        showToast('Añadido a favoritos');
    } else {
        favorites.splice(index, 1);
        showToast('Eliminado de favoritos');
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavoritesUI();
}

function updateFavoritesUI() {
    document.querySelectorAll('.song-item').forEach(item => {
        const songId = item.dataset.songId;
        const favBtn = item.querySelector('.song-action-btn[title="Favorito"] i');
        favBtn.className = favorites.includes(songId) ? 'fas fa-heart' : 'far fa-heart';
    });
    favoriteBtn.querySelector('i').className = favorites.includes(currentSongId) ? 'fas fa-heart' : 'far fa-heart';
}

function addToRecent(songId) {
    if (!recentSongs.includes(songId)) {
        recentSongs.unshift(songId);
        if (recentSongs.length > 10) recentSongs.pop();
        localStorage.setItem('recentSongs', JSON.stringify(recentSongs));
    }
}

function updateProgress() {
    if (!isDraggingProgress) {
        const current = audioPlayer.currentTime;
        const duration = audioPlayer.duration;
        currentTime.textContent = formatTime(current);
        totalTime.textContent = formatTime(duration);
        const progress = (current / duration) * 100;
        progressFill.style.width = `${progress}%`;
        progressHandle.style.left = `${progress}%`;
    }
}

function seek(e) {
    const rect = progressBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    audioPlayer.currentTime = pos * audioPlayer.duration;
    videoPlayer.currentTime = pos * videoPlayer.duration;
    updateProgress();
}

function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

function toggleMute() {
    audioPlayer.muted = !audioPlayer.muted;
    muteBtn.querySelector('i').className = audioPlayer.muted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
}

function filterSongs() {
    const query = searchInput.value.toLowerCase();
    document.querySelectorAll('.song-item').forEach(item => {
        const title = songData[item.dataset.songId].title.toLowerCase();
        item.style.display = title.includes(query) ? '' : 'none';
    });
}

function toggleTheme() {
    const newTheme = document.body.className === 'light' ? 'dark' : 'light';
    document.body.className = newTheme;
    themeToggle.querySelector('i').className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    localStorage.setItem('theme', newTheme);
}

function updatePlaylist(tab) {
    let songIds = Object.keys(songData);
    if (tab === 'favorites') {
        songIds = favorites;
    } else if (tab === 'recent') {
        songIds = recentSongs;
    }
    songsList.innerHTML = '';
    songIds.forEach((id, index) => {
        const song = songData[id];
        const li = document.createElement('li');
        li.className = 'song-item';
        li.dataset.songId = id;
        li.innerHTML = `
            <div class="song-item-content">
                <div class="song-number">${index + 1}</div>
                <div class="song-details">
                    <div class="song-name">${song.title}</div>
                    <div class="song-meta">${song.artist} • 2024</div>
                </div>
                <div class="song-actions">
                    <button class="song-action-btn" onclick="event.stopPropagation(); toggleFavorite('${id}')" title="Favorito">
                        <i class="${favorites.includes(id) ? 'fas' : 'far'} fa-heart"></i>
                    </button>
                    <button class="song-action-btn" onclick="event.stopPropagation(); showSongMenu('${id}')" title="Más opciones">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                </div>
            </div>
            <div class="song-waveform">
                <div class="wave-bar" style="height: 20%"></div>
                <div class="wave-bar" style="height: 60%"></div>
                <div class="wave-bar" style="height: 40%"></div>
                <div class="wave-bar" style="height: 80%"></div>
                <div class="wave-bar" style="height: 30%"></div>
            </div>
        `;
        li.addEventListener('click', () => playSong(song.file, song.title, song.artist, song.info, id));
        songsList.appendChild(li);
    });
}

function showContextMenu(e, songId) {
    contextMenu.style.top = `${e.pageY}px`;
    contextMenu.style.left = `${e.pageX}px`;
    contextMenu.style.display = 'block';
    contextMenu.dataset.songId = songId;
    document.addEventListener('click', hideContextMenu, { once: true });
}

function hideContextMenu() {
    contextMenu.style.display = 'none';
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

async function loadLyrics(songId) {
    if (!songId) {
        lyricsContent.innerHTML = '<p>Selecciona una canción para ver las letras...</p>';
        return;
    }
    const response = await fetch(`/get_lyrics/${songId}/${lyricsLang.value}`);
    const data = await response.json();
    if (data.lyrics) {
        lyricsContent.innerHTML = `<pre>${data.lyrics}</pre>`;
    } else {
        lyricsContent.innerHTML = '<p>Letras no disponibles</p>';
    }
}

function toggleLyricsSync() {
    isLyricsSync = !isLyricsSync;
    lyricsSync.classList.toggle('active', isLyricsSync);
    showToast(isLyricsSync ? 'Sincronización de letras activada' : 'Sincronización de letras desactivada');
    // Placeholder para lógica de sincronización de letras
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        videoPlayer.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

function toggleTheaterMode() {
    videoPlayer.classList.toggle('theater-mode');
    showToast(videoPlayer.classList.contains('theater-mode') ? 'Modo teatro activado' : 'Modo teatro desactivado');
}

document.addEventListener('DOMContentLoaded', initializeApp);