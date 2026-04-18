(() => {
  const BASE_URL = "https://love-story-mrnz.onrender.com";
  const MUSIC_JSON_PATH = "./assets/music/music.json";
  const DEFAULT_COVER = "./assets/images/avatar.jpg";
  const tokenKey = "love_token";
  const userKey = "love_user";

  const playlistList = document.getElementById("playlistList");
  const playlistSearchInput = document.getElementById("playlistSearchInput");
  const playlistTracks = document.getElementById("playlistTracks");
  const finderResults = document.getElementById("finderResults");
  const finderInput = document.getElementById("finderInput");
  const clearFinderBtn = document.getElementById("clearFinderBtn");
  const finderHint = document.getElementById("finderHint");
  const finderCount = document.getElementById("finderCount");
  const globalTrackSearchInput = document.getElementById(
    "globalTrackSearchInput",
  );
  const searchSuggest = document.getElementById("searchSuggest");

  const createPlaylistBtn = document.getElementById("createPlaylistBtn");
  const favoritePlaylistBtn = document.getElementById("favoritePlaylistBtn");
  const openEditBtn = document.getElementById("openEditBtn");
  const changeImageBtn = document.getElementById("changeImageBtn");
  const deletePlaylistBtn = document.getElementById("deletePlaylistBtn");
  const playSelectedBtn = document.getElementById("playSelectedBtn");
  const heroImageInput = document.getElementById("heroImageInput");

  const playlistHero = document.getElementById("playlistHero");
  const playlistHeroCover = document.getElementById("playlistHeroCover");
  const playlistHeroTitle = document.getElementById("playlistHeroTitle");
  const playlistHeroMeta = document.getElementById("playlistHeroMeta");

  const nowCover = document.getElementById("nowCover");
  const nowTitle = document.getElementById("nowTitle");
  const nowArtist = document.getElementById("nowArtist");

  const miniCover = document.getElementById("miniCover");
  const miniTitle = document.getElementById("miniTitle");
  const miniArtist = document.getElementById("miniArtist");

  const audio = document.getElementById("audioPlayer");
  const playBtn = document.getElementById("playBtn");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const volumeInput = document.getElementById("volumeInput");
  const backBtn = document.getElementById("backBtn");

  const editModal = document.getElementById("editModal");
  const modalNameInput = document.getElementById("modalNameInput");
  const modalDescriptionInput = document.getElementById(
    "modalDescriptionInput",
  );
  const modalImageInput = document.getElementById("modalImageInput");
  const modalCoverPreview = document.getElementById("modalCoverPreview");
  const saveModalBtn = document.getElementById("saveModalBtn");

  const loginModal = document.getElementById("loginModal");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const submitLoginBtn = document.getElementById("submitLoginBtn");
  const loginUsername = document.getElementById("loginUsername");
  const loginPassword = document.getElementById("loginPassword");
  const userBadge = document.getElementById("userBadge");

  const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
  const editorOnlyEls = Array.from(document.querySelectorAll(".editor-only"));

  const progressInput = document.getElementById("progressInput");
  const currentTimeLabel = document.getElementById("currentTimeLabel");
  const durationLabel = document.getElementById("durationLabel");
  const speedSelect = document.getElementById("speedSelect");

  const state = {
    tracks: [],
    playlists: [],
    selectedPlaylistId: null,
    currentTrackId: null,
    pendingModalImage: "",
    currentFilter: "all",
    user: null,
    activeSuggestIndex: -1,
    currentSuggestions: [],
  };

  function paintRangeProgress(input) {
    if (!input) return;
    const min = Number(input.min || 0);
    const max = Number(input.max || 100);
    const value = Number(input.value || 0);
    const percent = max === min ? 0 : ((value - min) / (max - min)) * 100;
    input.style.setProperty("--range-progress", `${percent}%`);
  }

  function getToken() {
    return localStorage.getItem(tokenKey) || "";
  }

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem(userKey)) || null;
    } catch {
      return null;
    }
  }

  function setAuth(token, user) {
    if (token) localStorage.setItem(tokenKey, token);
    if (user) localStorage.setItem(userKey, JSON.stringify(user));
  }

  function clearAuth() {
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(userKey);
    state.user = null;
  }

  function isEditor() {
    return (
      !!state.user &&
      (state.user.role === "admin" || state.user.role === "editor")
    );
  }

  function applyPermissions() {
    if (userBadge) {
      userBadge.textContent = state.user
        ? `Loveify Admin • ${state.user.role}`
        : "Guest • listener";
    }

    loginBtn?.classList.toggle("hidden", !!state.user);
    logoutBtn?.classList.toggle("hidden", !state.user);

    editorOnlyEls.forEach((el) =>
      el.classList.toggle("disabled-ui", !isEditor()),
    );

    if (finderHint) {
      finderHint.textContent = isEditor()
        ? "Bạn đang dùng tài khoản editor nên có thể thêm bài vào playlist và chỉnh sửa album."
        : "Bạn có thể nghe và tìm kiếm tất cả bài. Đăng nhập editor để thêm bài vào playlist.";
    }
  }

  function requireEditorAction() {
    if (isEditor()) return true;
    alert(
      "Chỉ tài khoản editor đã đăng nhập ở trang chủ mới có thể tạo hoặc chỉnh sửa playlist.",
    );
    return false;
  }

  async function api(path, options = {}) {
    const headers = { ...(options.headers || {}) };

    if (getToken()) {
      headers.Authorization = `Bearer ${getToken()}`;
    }

    if (
      !(options.body instanceof FormData) &&
      options.body &&
      !headers["Content-Type"]
    ) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.message || "Yêu cầu thất bại.");
    }

    return data;
  }

  function normalizeTrack(item, index) {
    const filename = String(item.filename || "").trim();
    const src = item.src
      ? String(item.src).trim()
      : filename
        ? `./assets/music/${filename}`
        : "";

    if (!src) return null;

    return {
      id: String(item.id || filename || `track-${index + 1}`),
      title: String(item.title || `Track ${index + 1}`).trim(),
      artist: String(item.artist || "Unknown artist").trim(),
      duration: String(item.duration || "--:--").trim(),
      cover: String(item.cover || DEFAULT_COVER).trim(),
      filename,
      src,
    };
  }

  async function loadTracks() {
    const response = await fetch(MUSIC_JSON_PATH);
    if (!response.ok) {
      throw new Error(`Không thể tải ${MUSIC_JSON_PATH}`);
    }

    const data = await response.json();

    const rawTracks = Array.isArray(data)
      ? data
      : Array.isArray(data.tracks)
        ? data.tracks
        : [];

    state.tracks = rawTracks.map(normalizeTrack).filter(Boolean);

    if (state.tracks.length && !state.currentTrackId) {
      state.currentTrackId = state.tracks[0].id;
      setCurrentTrack(state.currentTrackId, false);
    }
  }

  async function loadPlaylists() {
    try {
      const data = await api("/api/playlists");
      state.playlists = Array.isArray(data?.playlists) ? data.playlists : [];
    } catch (error) {
      console.warn("Playlist API unavailable:", error);
      state.playlists = [];
    }

    if (
      state.playlists.length &&
      (!state.selectedPlaylistId ||
        !state.playlists.find((p) => p._id === state.selectedPlaylistId))
    ) {
      state.selectedPlaylistId = state.playlists[0]._id;
    }

    if (!state.playlists.length) {
      state.selectedPlaylistId = null;
    }

    renderAll();
  }

  function getSelectedPlaylist() {
    return (
      state.playlists.find((item) => item._id === state.selectedPlaylistId) ||
      null
    );
  }

  function getTrackById(trackId) {
    return state.tracks.find((item) => item.id === trackId) || null;
  }

  function getPlaylistSongs(playlist) {
    return playlist && Array.isArray(playlist.songs) ? playlist.songs : [];
  }

  function getPlaylistArtistLabel(playlist) {
    const s = getPlaylistSongs(playlist)[0];
    return s ? s.artist : "No Artist Yet";
  }

  function findPlaylistContainingTrack(trackId) {
    return (
      state.playlists.find((playlist) =>
        getPlaylistSongs(playlist).some((song) => song.id === trackId),
      ) || null
    );
  }

  function setCurrentTrack(trackId, autoplay = false) {
    const track = getTrackById(trackId);
    if (!track) return;

    state.currentTrackId = trackId;

    if (nowCover) nowCover.src = track.cover || DEFAULT_COVER;
    if (nowTitle) nowTitle.textContent = track.title;
    if (nowArtist) nowArtist.textContent = track.artist;

    if (miniCover) miniCover.src = track.cover || DEFAULT_COVER;
    if (miniTitle) miniTitle.textContent = track.title;
    if (miniArtist) miniArtist.textContent = track.artist;

    audio.src = track.src;
    audio.load();

    if (progressInput) progressInput.value = 0;
    if (currentTimeLabel) currentTimeLabel.textContent = "0:00";
    if (durationLabel) durationLabel.textContent = "0:00";

    audio.playbackRate = Number(speedSelect?.value || 1);
    paintRangeProgress(progressInput);

    if (autoplay) {
      void togglePlay(true);
    }
  }

  async function togglePlay(forcePlay = false) {
    if (!audio.src) return;

    try {
      if (forcePlay || audio.paused) {
        await audio.play();
        if (playBtn) playBtn.textContent = "❚❚";
      } else {
        audio.pause();
        if (playBtn) playBtn.textContent = "▶";
      }
    } catch (e) {
      console.error(e);
      alert("Không thể phát nhạc. Hãy kiểm tra file mp3 và music.json.");
    }
  }

  function playAdjacent(step) {
    if (!state.tracks.length) return;

    const i = state.tracks.findIndex((t) => t.id === state.currentTrackId);
    const next =
      i === -1 ? 0 : (i + step + state.tracks.length) % state.tracks.length;

    setCurrentTrack(state.tracks[next].id, true);
  }

  function filteredPlaylists() {
    const kw = (playlistSearchInput?.value || "").trim().toLowerCase();

    return state.playlists.filter(
      (p) =>
        (state.currentFilter === "favorites" ? p.favorite : true) &&
        p.name.toLowerCase().includes(kw),
    );
  }

  function renderPlaylistList() {
    if (!playlistList) return;

    playlistList.innerHTML = "";
    const items = filteredPlaylists();

    if (!items.length) {
      playlistList.innerHTML =
        '<div class="empty-state">Chưa có playlist nào.</div>';
      return;
    }

    items.forEach((playlist) => {
      const btn = document.createElement("button");
      btn.className = `playlist-card ${
        playlist._id === state.selectedPlaylistId ? "is-active" : ""
      }`;

      btn.innerHTML = `
        <div class="playlist-card__cover" style="${
          playlist.coverImage
            ? `background-image:url('${playlist.coverImage}')`
            : ""
        }">
          ${playlist.coverImage ? "" : "♪"}
        </div>
        <div class="playlist-card__meta">
          <strong>${playlist.name}</strong>
          <small>${getPlaylistArtistLabel(playlist)}</small>
        </div>
      `;

      btn.addEventListener("click", () => {
        state.selectedPlaylistId = playlist._id;
        renderAll();
      });

      playlistList.appendChild(btn);
    });
  }

  function renderHero() {
    const playlist = getSelectedPlaylist();

    if (!playlist) {
      if (playlistHeroTitle) playlistHeroTitle.textContent = "Kho nhạc local";
      if (playlistHeroMeta) {
        playlistHeroMeta.textContent = `${state.tracks.length} bài hát • Phát và tìm kiếm ngay bên dưới`;
      }
      playlistHero?.classList.remove("has-cover");
      if (playlistHeroCover) {
        playlistHeroCover.style.backgroundImage = "";
        playlistHeroCover.textContent = "♫";
      }
      favoritePlaylistBtn?.classList.remove("is-favorite");
      if (favoritePlaylistBtn) favoritePlaylistBtn.textContent = "♡";
      return;
    }

    if (playlistHeroTitle) playlistHeroTitle.textContent = playlist.name;
    if (playlistHeroMeta) {
      playlistHeroMeta.textContent = `${getPlaylistSongs(playlist).length} songs • ${
        playlist.description?.trim() || "No description yet"
      }`;
    }

    favoritePlaylistBtn?.classList.toggle("is-favorite", !!playlist.favorite);
    if (favoritePlaylistBtn) {
      favoritePlaylistBtn.textContent = playlist.favorite ? "♥" : "♡";
    }

    if (playlist.coverImage) {
      playlistHero?.classList.add("has-cover");
      if (playlistHeroCover) {
        playlistHeroCover.style.backgroundImage = `linear-gradient(180deg, rgba(7,7,7,.18), rgba(7,7,7,.28)), url("${playlist.coverImage}")`;
        playlistHeroCover.style.backgroundSize = "cover";
        playlistHeroCover.style.backgroundPosition = "center";
        playlistHeroCover.textContent = "";
      }
    } else {
      playlistHero?.classList.remove("has-cover");
      if (playlistHeroCover) {
        playlistHeroCover.style.backgroundImage = "";
        playlistHeroCover.textContent = "♪";
      }
    }
  }

  function renderPlaylistTracks() {
    if (!playlistTracks) return;

    const playlist = getSelectedPlaylist();
    const songs = getPlaylistSongs(playlist);
    playlistTracks.innerHTML = "";

    if (!playlist || !songs.length) {
      playlistTracks.innerHTML = "";
      return;
    }

    songs.forEach((song, index) => {
      const row = document.createElement("div");
      row.className = "track-row";

      row.innerHTML = `
        <span>${index + 1}</span>
        <span class="track-main">
          <img src="${song.cover || DEFAULT_COVER}" alt="${song.title}">
          <span>
            <b>${song.title}</b>
            <small>${song.artist}</small>
          </span>
        </span>
        <span>${song.artist}</span>
        <span>${song.album || playlist.name}</span>
        <span>${song.duration || "--:--"}</span>
        <button class="row-btn ${isEditor() ? "" : "disabled-ui"}">Xóa</button>
      `;

      row.querySelector(".track-main")?.addEventListener("click", () => {
        setCurrentTrack(song.id, true);
      });

      row.querySelector(".row-btn")?.addEventListener("click", async () => {
        if (!requireEditorAction()) return;

        await updatePlaylist(playlist._id, {
          songs: songs.filter((it) => it.id !== song.id),
        });
      });

      playlistTracks.appendChild(row);
    });
  }

  function renderFinderResults() {
    if (!finderResults) return;

    const playlist = getSelectedPlaylist();
    const keyword = (finderInput?.value || "").trim().toLowerCase();

    const filtered = state.tracks.filter(
      (track) =>
        !keyword ||
        `${track.title} ${track.artist} ${track.filename}`
          .toLowerCase()
          .includes(keyword),
    );

    if (finderCount) {
      finderCount.textContent = `${filtered.length} bài hát`;
    }

    finderResults.innerHTML = "";

    if (!filtered.length) {
      finderResults.innerHTML =
        '<div class="empty-state">No matching song found.</div>';
      return;
    }

    filtered.forEach((track) => {
      const ownerPlaylist = findPlaylistContainingTrack(track.id);
      const inCurrentPlaylist = ownerPlaylist?._id === playlist?._id;
      const alreadyInAnotherPlaylist =
        !!ownerPlaylist && ownerPlaylist?._id !== playlist?._id;

      const playlistLabel = ownerPlaylist
        ? ownerPlaylist.name
        : "Chưa được add vào playlist nào";

      const buttonText = ownerPlaylist ? "Added" : "Listen";
      const buttonDisabled = !isEditor() || !!ownerPlaylist;

      const row = document.createElement("div");
      row.className = "finder-row";

      row.innerHTML = `
        <div><img src="${track.cover || DEFAULT_COVER}" alt="${track.title}"></div>
        <div class="finder-row__main">
          <strong title="${track.title}">${track.title}</strong>
          <small>${track.artist}</small>
        </div>
        <div class="finder-row__meta" title="${playlistLabel}">${playlistLabel}</div>
        <div>${track.duration || "--:--"}</div>
        <button class="row-btn ${buttonDisabled ? "disabled-ui" : ""}">
          ${buttonText}
        </button>
      `;

      row.querySelector(".row-btn")?.addEventListener("click", async () => {
        if (!playlist) return;

        if (!isEditor()) {
          requireEditorAction();
          return;
        }

        if (ownerPlaylist) {
          if (alreadyInAnotherPlaylist) {
            alert(`Bài này đã được add vào playlist "${ownerPlaylist.name}".`);
          }
          return;
        }

        const next = [
          ...getPlaylistSongs(playlist),
          {
            id: track.id,
            title: track.title,
            artist: track.artist,
            album: playlist.name,
            duration: track.duration,
            filename: track.filename,
            src: track.src,
            cover: track.cover,
          },
        ];

        await updatePlaylist(playlist._id, { songs: next });
      });

      row.querySelector(".finder-row__main")?.addEventListener("click", () => {
        setCurrentTrack(track.id, true);
      });

      finderResults.appendChild(row);
    });
  }

  function getSuggestedTracks(keyword) {
    const q = keyword.trim().toLowerCase();
    if (!q) return [];

    return state.tracks
      .filter((track) =>
        `${track.title} ${track.artist} ${track.filename || ""}`
          .toLowerCase()
          .includes(q),
      )
      .slice(0, 8);
  }

  function updateSuggestActiveState() {
    if (!searchSuggest) return;

    const items = Array.from(
      searchSuggest.querySelectorAll(".search-suggest__item"),
    );

    items.forEach((item, index) => {
      item.classList.toggle("is-active", index === state.activeSuggestIndex);
    });
  }

  function applySuggestionSelection(trackId) {
    const track = getTrackById(trackId);
    if (!track) return;

    if (globalTrackSearchInput) globalTrackSearchInput.value = track.title;
    if (finderInput) finderInput.value = track.title;

    setCurrentTrack(track.id, true);
    renderFinderResults();
    hideSearchSuggest();
  }

  function renderSearchSuggest(items) {
    if (!searchSuggest) return;

    state.currentSuggestions = items;
    state.activeSuggestIndex = -1;

    if (!items.length) {
      searchSuggest.innerHTML =
        '<div class="search-suggest__empty">Không có gợi ý phù hợp</div>';
      searchSuggest.classList.remove("hidden");
      return;
    }

    searchSuggest.innerHTML = items
      .map(
        (track, index) => `
          <div class="search-suggest__item" data-track-id="${track.id}" data-index="${index}">
            <img class="search-suggest__cover" src="${track.cover || DEFAULT_COVER}" alt="${track.title}">
            <div>
              <div class="search-suggest__title">${track.title}</div>
              <div class="search-suggest__meta">${track.artist}</div>
            </div>
          </div>
        `,
      )
      .join("");

    searchSuggest.classList.remove("hidden");

    searchSuggest.querySelectorAll(".search-suggest__item").forEach((item) => {
      item.addEventListener("mouseenter", () => {
        state.activeSuggestIndex = Number(item.dataset.index);
        updateSuggestActiveState();
      });

      item.addEventListener("click", () => {
        applySuggestionSelection(item.dataset.trackId);
      });
    });
  }

  function hideSearchSuggest() {
    if (!searchSuggest) return;
    searchSuggest.classList.add("hidden");
    state.activeSuggestIndex = -1;
  }

  function handleTopSearchInput() {
    const value = globalTrackSearchInput?.value || "";
    const suggestions = getSuggestedTracks(value);

    if (finderInput) {
      finderInput.value = value;
    }

    renderFinderResults();

    if (!value.trim()) {
      hideSearchSuggest();
      return;
    }

    renderSearchSuggest(suggestions);
  }

  function handleTopSearchKeydown(event) {
    if (!searchSuggest || searchSuggest.classList.contains("hidden")) {
      return;
    }

    const items = state.currentSuggestions || [];
    if (!items.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      state.activeSuggestIndex =
        state.activeSuggestIndex < items.length - 1
          ? state.activeSuggestIndex + 1
          : 0;
      updateSuggestActiveState();
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      state.activeSuggestIndex =
        state.activeSuggestIndex > 0
          ? state.activeSuggestIndex - 1
          : items.length - 1;
      updateSuggestActiveState();
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const selected =
        state.activeSuggestIndex >= 0
          ? items[state.activeSuggestIndex]
          : items[0];

      if (selected) {
        applySuggestionSelection(selected.id);
      }
      return;
    }

    if (event.key === "Escape") {
      hideSearchSuggest();
    }
  }

  async function createPlaylist() {
    if (!requireEditorAction()) return;

    const data = await api("/api/playlists", {
      method: "POST",
      body: JSON.stringify({
        name: `My Playlist #${state.playlists.length + 1}`,
      }),
    });

    state.selectedPlaylistId = data.playlist._id;
    await loadPlaylists();
    openModal();
  }

  async function updatePlaylist(id, payload) {
    await api(`/api/playlists/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

    await loadPlaylists();
  }

  async function deletePlaylist() {
    if (!requireEditorAction()) return;

    const playlist = getSelectedPlaylist();
    if (!playlist) return;

    if (!confirm(`Xóa playlist "${playlist.name}"?`)) return;

    await api(`/api/playlists/${playlist._id}`, { method: "DELETE" });
    state.selectedPlaylistId = null;
    await loadPlaylists();
  }

  function openModal() {
    const p = getSelectedPlaylist();
    if (!p) return;

    state.pendingModalImage = p.coverImage || "";
    if (modalNameInput) modalNameInput.value = p.name || "";
    if (modalDescriptionInput)
      modalDescriptionInput.value = p.description || "";
    renderModalPreview();
    editModal?.classList.remove("hidden");
  }

  function closeModal() {
    editModal?.classList.add("hidden");
  }

  function renderModalPreview() {
    if (!modalCoverPreview) return;

    if (state.pendingModalImage) {
      modalCoverPreview.style.backgroundImage = `linear-gradient(180deg, rgba(7,7,7,.18), rgba(7,7,7,.28)), url("${state.pendingModalImage}")`;
      modalCoverPreview.style.backgroundSize = "cover";
      modalCoverPreview.style.backgroundPosition = "center";
      modalCoverPreview.textContent = "";
    } else {
      modalCoverPreview.style.backgroundImage = "";
      modalCoverPreview.textContent = "♪";
    }
  }

  async function saveModal() {
    if (!requireEditorAction()) return;

    const p = getSelectedPlaylist();
    if (!p) return;

    const newName = modalNameInput?.value.trim() || p.name;

    const nextSongs = getPlaylistSongs(p).map((song) => ({
      ...song,
      album: newName,
    }));

    await updatePlaylist(p._id, {
      name: newName,
      description: modalDescriptionInput?.value.trim() || "",
      coverImage: state.pendingModalImage,
      songs: nextSongs,
    });

    closeModal();
  }

  function openLoginModal() {
    if (loginUsername) loginUsername.value = state.user?.username || "";
    if (loginPassword) loginPassword.value = "";
    loginModal?.classList.remove("hidden");
  }

  function closeLoginModal() {
    loginModal?.classList.add("hidden");
  }

  async function submitLogin() {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loginUsername?.value.trim(),
          password: loginPassword?.value,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Đăng nhập thất bại.");

      setAuth(data.token, data.user);
      state.user = data.user;
      applyPermissions();
      closeLoginModal();
    } catch (e) {
      alert(e.message || "Đăng nhập thất bại.");
    }
  }

  function logout() {
    clearAuth();
    applyPermissions();
  }

  function renderAll() {
    renderPlaylistList();
    renderHero();
    renderPlaylistTracks();
    renderFinderResults();
    applyPermissions();
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, "0")}`;
  }

  function updateProgressUI() {
    const duration = audio.duration || 0;
    const current = audio.currentTime || 0;

    if (currentTimeLabel) currentTimeLabel.textContent = formatTime(current);
    if (durationLabel) durationLabel.textContent = formatTime(duration);

    if (progressInput) {
      progressInput.value = duration > 0 ? (current / duration) * 100 : 0;
      paintRangeProgress(progressInput);
    }
  }

  function bindEvents() {
    createPlaylistBtn?.addEventListener("click", createPlaylist);

    favoritePlaylistBtn?.addEventListener("click", async () => {
      if (!requireEditorAction()) return;
      const p = getSelectedPlaylist();
      if (p) await updatePlaylist(p._id, { favorite: !p.favorite });
    });

    openEditBtn?.addEventListener("click", () => {
      if (requireEditorAction()) openModal();
    });

    playlistHeroTitle?.addEventListener("click", () => {
      if (requireEditorAction()) openModal();
    });

    changeImageBtn?.addEventListener("click", () => {
      if (requireEditorAction()) heroImageInput?.click();
    });

    deletePlaylistBtn?.addEventListener("click", deletePlaylist);

    playSelectedBtn?.addEventListener("click", () => {
      const p = getSelectedPlaylist();
      const firstId = getPlaylistSongs(p)[0]?.id || state.tracks[0]?.id;
      if (firstId) setCurrentTrack(firstId, true);
    });

    playlistSearchInput?.addEventListener("input", renderPlaylistList);

    finderInput?.addEventListener("input", () => {
      renderFinderResults();
      if (
        globalTrackSearchInput &&
        document.activeElement !== globalTrackSearchInput
      ) {
        globalTrackSearchInput.value = finderInput.value;
      }
    });

    globalTrackSearchInput?.addEventListener("input", handleTopSearchInput);
    globalTrackSearchInput?.addEventListener("keydown", handleTopSearchKeydown);

    globalTrackSearchInput?.addEventListener("focus", () => {
      const value = globalTrackSearchInput.value || "";
      if (!value.trim()) return;
      renderSearchSuggest(getSuggestedTracks(value));
    });

    clearFinderBtn?.addEventListener("click", () => {
      if (finderInput) finderInput.value = "";
      if (globalTrackSearchInput) globalTrackSearchInput.value = "";
      renderFinderResults();
      hideSearchSuggest();
    });

    document.addEventListener("click", (event) => {
      if (!searchSuggest || !globalTrackSearchInput) return;

      const target = event.target;
      const clickedInsideSuggest = searchSuggest.contains(target);
      const clickedOnInput = globalTrackSearchInput.contains(target);

      if (!clickedInsideSuggest && !clickedOnInput) {
        hideSearchSuggest();
      }
    });

    filterButtons.forEach((button) =>
      button.addEventListener("click", () => {
        state.currentFilter = button.dataset.filter;
        filterButtons.forEach((item) =>
          item.classList.toggle("is-active", item === button),
        );
        renderPlaylistList();
      }),
    );

    heroImageInput?.addEventListener("change", (event) => {
      if (!requireEditorAction()) return;
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async () => {
        const p = getSelectedPlaylist();
        if (p) await updatePlaylist(p._id, { coverImage: reader.result });
      };
      reader.readAsDataURL(file);
    });

    modalImageInput?.addEventListener("change", (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        state.pendingModalImage = reader.result;
        renderModalPreview();
      };
      reader.readAsDataURL(file);
    });

    saveModalBtn?.addEventListener("click", saveModal);

    document
      .querySelectorAll("[data-close-modal]")
      .forEach((b) => b.addEventListener("click", closeModal));

    document
      .querySelectorAll("[data-close-login]")
      .forEach((b) => b.addEventListener("click", closeLoginModal));

    loginBtn?.addEventListener("click", openLoginModal);
    logoutBtn?.addEventListener("click", logout);
    submitLoginBtn?.addEventListener("click", submitLogin);

    playBtn?.addEventListener("click", () => togglePlay(false));
    prevBtn?.addEventListener("click", () => playAdjacent(-1));
    nextBtn?.addEventListener("click", () => playAdjacent(1));

    volumeInput?.addEventListener("input", (e) => {
      audio.volume = Number(e.target.value);
      paintRangeProgress(volumeInput);
    });

    progressInput?.addEventListener("input", () => {
      const duration = audio.duration || 0;
      if (!duration) return;
      audio.currentTime = (Number(progressInput.value) / 100) * duration;
      paintRangeProgress(progressInput);
    });

    speedSelect?.addEventListener("change", () => {
      audio.playbackRate = Number(speedSelect.value || 1);
    });

    audio.addEventListener("timeupdate", updateProgressUI);
    audio.addEventListener("loadedmetadata", updateProgressUI);
    audio.addEventListener("durationchange", updateProgressUI);

    audio.addEventListener("ended", () => {
      updateProgressUI();
      playAdjacent(1);
    });

    audio.addEventListener("pause", () => {
      if (playBtn) playBtn.textContent = "▶";
    });

    audio.addEventListener("play", () => {
      if (playBtn) playBtn.textContent = "❚❚";
    });

    backBtn?.addEventListener("click", () => {
      if (document.referrer) {
        window.history.back();
      } else {
        window.location.href = "./index.html";
      }
    });
  }

  async function init() {
    audio.volume = 0.7;
    bindEvents();

    state.user = getUser();
    applyPermissions();

    paintRangeProgress(volumeInput);
    paintRangeProgress(progressInput);

    try {
      await loadTracks();
    } catch (e) {
      console.error(e);
      if (finderResults) {
        finderResults.innerHTML = `<div class="empty-state">${e.message}</div>`;
      }
    }

    await loadPlaylists();
    renderFinderResults();
  }

  init().catch((e) => {
    console.error(e);
    if (finderResults) {
      finderResults.innerHTML = `<div class="empty-state">${e.message}</div>`;
    }
  });
})();
