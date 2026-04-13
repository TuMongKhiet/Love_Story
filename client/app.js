const BASE_URL = "https://love-story-mrnz.onrender.com";
// Khi deploy, đổi thành domain backend của bạn, ví dụ:
// const BASE_URL = "https://your-backend.onrender.com";

const $ = (id) => document.getElementById(id);

function showMessage(element, text) {
  if (!element) {
    console.warn(text);
    return;
  }
  element.textContent = text;
  element.classList.add("show");
}

function hideMessage(element) {
  if (!element) return;
  element.textContent = "";
  element.classList.remove("show");
}

function getToken() {
  return localStorage.getItem("love_token") || "";
}

function setToken(token) {
  localStorage.setItem("love_token", token);
}

function removeToken() {
  localStorage.removeItem("love_token");
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("love_user")) || null;
  } catch {
    return null;
  }
}

function setUser(user) {
  localStorage.setItem("love_user", JSON.stringify(user));
}

function removeUser() {
  localStorage.removeItem("love_user");
}

function getAuthHeaders(withJson = false) {
  const headers = {};

  if (withJson) {
    headers["Content-Type"] = "application/json";
  }

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function formatDate(dateString) {
  if (!dateString) return "Chưa cập nhật";
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return "Chưa cập nhật";
  return parsed.toLocaleDateString("vi-VN");
}

function formatDateForInput(dateString) {
  if (!dateString) return "";

  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return "";

  const localDate = new Date(
    parsed.getTime() - parsed.getTimezoneOffset() * 60000,
  );
  return localDate.toISOString().split("T")[0];
}

function getImageSrc(img) {
  if (!img) return "";
  if (img.startsWith("http") || img.startsWith("data:")) return img;
  return `${BASE_URL}${img}`;
}

function appendNewLine(oldValue, newValue) {
  const oldText =
    !oldValue || oldValue === "Chua cap nhat" || oldValue === "No Updated"
      ? ""
      : oldValue.trim();
  const newText = (newValue || "").trim();

  if (!newText) return oldText;
  if (!oldText) return newText;

  return `${oldText}\n${newText}`;
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char] || char;
  });
}

const TIMELINE_MODE_KEY = "love_timeline_mode_v1";
const TIMELINE_STICKERS = ["💖", "🎀", "🧸", "✨", "🌷", "🍓", "🌙", "🫶"];

function createTimelineId() {
  return `timeline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createEmptyTimelineEvent(overrides = {}) {
  return {
    id: createTimelineId(),
    eventDate: "",
    description: "",
    icon: "💖",
    ...overrides,
  };
}

function createStarterTimelineEvents() {
  return [
    createEmptyTimelineEvent({
      icon: "💖",
      description: "Ngày đầu tiên tụi mình gặp nhau...",
    }),
    createEmptyTimelineEvent({
      icon: "🎀",
      description: "Một kỷ niệm mà cả hai muốn nhớ thật lâu...",
    }),
    createEmptyTimelineEvent({
      icon: "✨",
      description: "Một lời nhắn ngắn ngọt dành cho nhau...",
    }),
  ];
}

function normalizeTimelineEvent(event = {}) {
  const title = (event.title || "").trim();
  const description = (event.description || event.content || "").trim();
  const mergedDescription = [title, description].filter(Boolean).join("\n");

  return {
    id: event.id || event._id || createTimelineId(),
    eventDate: formatDateForInput(event.eventDate || event.date || ""),
    description: mergedDescription,
    icon: event.icon || event.sticker || "💖",
  };
}

function sortTimelineEvents(events = []) {
  return [...events].sort((a, b) => {
    const timeA = a.eventDate
      ? new Date(a.eventDate).getTime()
      : Number.MAX_SAFE_INTEGER;
    const timeB = b.eventDate
      ? new Date(b.eventDate).getTime()
      : Number.MAX_SAFE_INTEGER;
    return timeA - timeB;
  });
}

function readTimelineMode() {
  const stored = localStorage.getItem(TIMELINE_MODE_KEY);
  return stored === "edit" ? "edit" : "view";
}

function saveTimelineMode(mode) {
  localStorage.setItem(TIMELINE_MODE_KEY, mode === "edit" ? "edit" : "view");
}

function canEditTimeline() {
  return !!getToken();
}

/* =========================
   DOM
========================= */

const authModal = $("authModal");
const openAuthBtn = $("openAuthBtn");
const closeModalBtn = $("closeModalBtn");
const logoutBtn = $("logoutBtn");
const modalMessage = $("modalMessage");
const authMessage = $("authMessage");
const authStatus = $("authStatus");

const profileEditorPanel = $("profileEditorPanel");
const openProfileModalBtn = $("openProfileModalBtn");
let audioUnlocked = false;
let hasUserGesture = false;

const bgMusic = $("bgMusic");
const toggleMusicBtn = $("toggleMusicBtn");
const prevSongBtn = $("prevSongBtn");
const nextSongBtn = $("nextSongBtn");
const currentTrackNameEl = $("currentTrackName");
const musicPlayingIcon = $("musicPlayingIcon");

const toggleMemoryLayoutBtn = $("toggleMemoryLayoutBtn");
const slideshowImage = $("slideshowImage");
const slideshowEmpty = $("slideshowEmpty");
const prevSlideBtn = $("prevSlideBtn");
const nextSlideBtn = $("nextSlideBtn");

const timelineList = $("timelineList");
const timelineScrollWrap = $("timelineScrollWrap");
const addTimelineCardBtn = $("addTimelineCardBtn");
const resetTimelineBtn = $("resetTimelineBtn");
const timelineModeToggleBtn = $("timelineModeToggleBtn");
const timelineEditorActions = $("timelineEditorActions");
const timelineEditorHint = $("timelineEditorHint");
const timelineStatus = $("timelineStatus");

/* =========================
   STATE
========================= */

let loveStartDate = new Date("2026-03-08T00:00:00");

let currentProfile = {
  quote: "",
  maleHobbies: "",
  femaleHobbies: "",
  maleMessage: "",
  femaleMessage: "",
};

let activeProfileFieldId = null;
let profileSaveMode = "append";

let memoryCache = [];
const commentsCache = {};
let currentSlideIndex = 0;
let slideInterval = null;
let memoryViewMode = "cards";

let timelineCache = [];
let timelineMode = readTimelineMode();
let timelineAutoFrame = null;
let timelineAutoOffset = 0;
let timelineStatusTimer = null;
let timelineUpdateTimers = new Map();

let isMusicPlaying = false;
let shuffledPlaylist = [];
let currentTrackIndex = 0;
let hasPreparedPlaylist = false;

const PROFILE_FIELD_MAP = {
  profileQuote: "quote",
  profileMaleHobbies: "maleHobbies",
  profileFemaleHobbies: "femaleHobbies",
  profileMaleMessage: "maleMessage",
  profileFemaleMessage: "femaleMessage",
};

/* =========================
   AUTH UI
========================= */

function updateAuthUI() {
  const user = getUser();
  const editorArea = $("editorArea");
  const canEdit = !!user;

  if (authStatus) {
    authStatus.textContent = user
      ? `Currently logged in to editing mode: ${user.username}`
      : "Not logged in";
  }

  if (openAuthBtn) {
    openAuthBtn.style.display = user ? "none" : "inline-block";
  }

  if (logoutBtn) {
    logoutBtn.style.display = user ? "inline-block" : "none";
  }

  if (editorArea) {
    editorArea.style.display = canEdit ? "block" : "none";
  }

  if (openProfileModalBtn) {
    openProfileModalBtn.style.display = canEdit ? "inline-block" : "none";
  }
}

if (openAuthBtn) {
  openAuthBtn.addEventListener("click", () => {
    authModal?.classList.add("show");
  });
}

if (closeModalBtn) {
  closeModalBtn.addEventListener("click", () => {
    authModal?.classList.remove("show");
    hideMessage(modalMessage);
  });
}

if (authModal) {
  authModal.addEventListener("click", (event) => {
    if (event.target === authModal) {
      authModal.classList.remove("show");
      hideMessage(modalMessage);
    }
  });
}

const loginForm = $("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      const username = $("loginUsername")?.value.trim() || "";
      const password = $("loginPassword")?.value.trim() || "";

      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        showMessage(modalMessage, data.message || "Login failed.");
        return;
      }

      setToken(data.token);
      setUser(data.user);

      loginForm.reset();
      hideMessage(modalMessage);
      authModal?.classList.remove("show");

      updateAuthUI();
      syncTimelineEditorUI();
      await reloadWholePageData();
      showMessage(authMessage, "Login successful.");
    } catch (error) {
      console.error("Login error:", error);
      showMessage(
        modalMessage,
        "Unable to connect to the server. Please check the backend.",
      );
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    removeToken();
    removeUser();

    Object.keys(commentsCache).forEach((key) => delete commentsCache[key]);

    currentProfile = {
      quote: "",
      maleHobbies: "",
      femaleHobbies: "",
      maleMessage: "",
      femaleMessage: "",
    };

    activeProfileFieldId = null;
    profileSaveMode = "append";
    timelineMode = "view";
    saveTimelineMode(timelineMode);

    updateAuthUI();
    syncTimelineEditorUI();
    resetProfileUI();

    currentSlideIndex = 0;
    await reloadWholePageData();
    showMessage(authMessage, "You have logged out.");
  });
}

/* =========================
   PROFILE
========================= */

function clearProfileInputFields() {
  if ($("profileQuote")) $("profileQuote").value = "";
  if ($("profileMaleHobbies")) $("profileMaleHobbies").value = "";
  if ($("profileFemaleHobbies")) $("profileFemaleHobbies").value = "";
  if ($("profileMaleMessage")) $("profileMaleMessage").value = "";
  if ($("profileFemaleMessage")) $("profileFemaleMessage").value = "";
}

function renderProfile(profile) {
  if ($("heroQuote")) {
    $("heroQuote").textContent = `“${
      profile.quote || "Every moment with you is a miracle."
    }”`;
  }

  if ($("maleHobbies")) {
    $("maleHobbies").textContent = profile.maleHobbies || "Not updated yet";
  }
  if ($("femaleHobbies")) {
    $("femaleHobbies").textContent = profile.femaleHobbies || "Not updated yet";
  }
  if ($("maleMessage")) {
    $("maleMessage").textContent = profile.maleMessage || "Not updated";
  }
  if ($("femaleMessage")) {
    $("femaleMessage").textContent = profile.femaleMessage || "Not updated";
  }

  if (profile?.loveStartDate) {
    const parsedDate = new Date(profile.loveStartDate);
    if (!Number.isNaN(parsedDate.getTime())) {
      loveStartDate = parsedDate;
    }
  }
}

function fillProfileForm(profile) {
  if ($("profileQuote")) $("profileQuote").value = profile.quote || "";
  if ($("profileMaleHobbies")) {
    $("profileMaleHobbies").value = profile.maleHobbies || "";
  }
  if ($("profileFemaleHobbies")) {
    $("profileFemaleHobbies").value = profile.femaleHobbies || "";
  }
  if ($("profileMaleMessage")) {
    $("profileMaleMessage").value = profile.maleMessage || "";
  }
  if ($("profileFemaleMessage")) {
    $("profileFemaleMessage").value = profile.femaleMessage || "";
  }
}

function resetProfileUI() {
  if ($("heroQuote")) {
    $("heroQuote").textContent = "“Every moment with you is a miracle.”";
  }
  if ($("maleHobbies")) $("maleHobbies").textContent = "Not updated yet";
  if ($("femaleHobbies")) $("femaleHobbies").textContent = "Not updated yet";
  if ($("maleMessage")) $("maleMessage").textContent = "Not updated";
  if ($("femaleMessage")) $("femaleMessage").textContent = "Not updated";

  clearProfileInputFields();

  if (profileEditorPanel) {
    profileEditorPanel.classList.remove("show");
  }
  if (openProfileModalBtn) {
    openProfileModalBtn.textContent = "Edit profile";
  }
}

async function loadProfile() {
  try {
    const res = await fetch(`${BASE_URL}/api/profile`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) return;

    const data = await res.json();

    currentProfile = {
      quote: data.quote || "",
      maleHobbies: data.maleHobbies || "",
      femaleHobbies: data.femaleHobbies || "",
      maleMessage: data.maleMessage || "",
      femaleMessage: data.femaleMessage || "",
    };

    renderProfile(data);

    if (getToken()) {
      fillProfileForm(data);
    }
  } catch (error) {
    console.error("Load profile error:", error);
  }
}

function openProfileEditorAndFocus(fieldId) {
  const user = getUser();

  if (!user) {
    authModal?.classList.add("show");
    showMessage(modalMessage, "You need to log in first.");
    return;
  }

  if (profileEditorPanel && !profileEditorPanel.classList.contains("show")) {
    profileEditorPanel.classList.add("show");
  }

  if (openProfileModalBtn) {
    openProfileModalBtn.textContent = "Hide profile editor";
  }

  clearProfileInputFields();
  activeProfileFieldId = fieldId;
  profileSaveMode = "overwrite";

  const fieldKey = PROFILE_FIELD_MAP[fieldId];
  const field = $(fieldId);

  if (field && fieldKey) {
    field.value = currentProfile[fieldKey] || "";
  }

  document.getElementById("vault")?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });

  setTimeout(() => {
    if (field) {
      field.focus();
      field.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, 250);
}

if (openProfileModalBtn && profileEditorPanel) {
  openProfileModalBtn.addEventListener("click", () => {
    const isOpen = profileEditorPanel.classList.toggle("show");
    openProfileModalBtn.textContent = isOpen
      ? "Hide profile editor"
      : "Edit profile";

    if (isOpen) {
      activeProfileFieldId = null;
      profileSaveMode = "append";
      clearProfileInputFields();

      profileEditorPanel.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
}

const profileForm = $("profileForm");
if (profileForm) {
  profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const token = getToken();
    if (!token) {
      showMessage(authMessage, "You need to log in first.");
      authModal?.classList.add("show");
      return;
    }

    try {
      const quoteInput = $("profileQuote")?.value.trim() || "";
      const maleHobbiesInput = $("profileMaleHobbies")?.value || "";
      const femaleHobbiesInput = $("profileFemaleHobbies")?.value || "";
      const maleMessageInput = $("profileMaleMessage")?.value || "";
      const femaleMessageInput = $("profileFemaleMessage")?.value || "";

      let payload = {
        quote: quoteInput || currentProfile.quote || "",
        maleHobbies: appendNewLine(
          currentProfile.maleHobbies,
          maleHobbiesInput,
        ),
        femaleHobbies: appendNewLine(
          currentProfile.femaleHobbies,
          femaleHobbiesInput,
        ),
        maleMessage: appendNewLine(
          currentProfile.maleMessage,
          maleMessageInput,
        ),
        femaleMessage: appendNewLine(
          currentProfile.femaleMessage,
          femaleMessageInput,
        ),
      };

      if (profileSaveMode === "overwrite" && activeProfileFieldId) {
        const fieldKey = PROFILE_FIELD_MAP[activeProfileFieldId];
        const activeField = $(activeProfileFieldId);

        if (fieldKey === "quote") {
          payload.quote = quoteInput;
        } else if (fieldKey && activeField) {
          payload[fieldKey] = activeField.value.trim();
        }
      }

      const res = await fetch(`${BASE_URL}/api/profile`, {
        method: "PUT",
        headers: getAuthHeaders(true),
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        showMessage(authMessage, data.message || "Unable to update profile.");
        return;
      }

      currentProfile = {
        quote: data.profile?.quote || "",
        maleHobbies: data.profile?.maleHobbies || "",
        femaleHobbies: data.profile?.femaleHobbies || "",
        maleMessage: data.profile?.maleMessage || "",
        femaleMessage: data.profile?.femaleMessage || "",
      };

      renderProfile(data.profile || {});
      clearProfileInputFields();
      activeProfileFieldId = null;
      profileSaveMode = "append";

      showMessage(authMessage, "Profile saved successfully.");
    } catch (error) {
      console.error("Update profile error:", error);
      showMessage(authMessage, "Server connection error.");
    }
  });
}

/* =========================
   MEMORIES + COMMENTS
========================= */

async function loadMemories() {
  try {
    const res = await fetch(`${BASE_URL}/api/memories`, {
      headers: getAuthHeaders(),
    });

    const data = await res.json().catch(() => []);
    if (!res.ok) return;

    memoryCache = Array.isArray(data) ? data : [];
    renderMemories(memoryCache);
    updateSlideshow();
  } catch (error) {
    console.error("Load memories error:", error);
  }
}

function getSlideshowItems() {
  return memoryCache.flatMap((memory) =>
    (memory.images || []).map((img, imageIndex) => ({
      memoryId: memory._id,
      imageIndex,
      src: getImageSrc(img),
      title: memory.title,
      description: memory.description || "No description.",
      memoryDate: memory.memoryDate,
    })),
  );
}

function getCurrentSlideMemoryId() {
  const items = getSlideshowItems();
  return items[currentSlideIndex]?.memoryId || null;
}

function getCommentsPreviewHtml(memoryId) {
  const comments = commentsCache[memoryId] || [];

  if (!comments.length) {
    return "No comments yet.";
  }

  return comments
    .slice(0, 3)
    .map(
      (comment) => `
        <div class="slideshow-comment-line">
          <strong>${escapeHtml(comment.user?.username || "Ẩn danh")}:</strong>
          ${escapeHtml(comment.content || "")}
        </div>
      `,
    )
    .join("");
}

function getCommentsHtml(memoryId) {
  const comments = commentsCache[memoryId] || [];
  const currentUser = getUser();

  if (!comments.length) {
    return `<div class="comment-item empty-comment">No comments yet.</div>`;
  }

  return comments
    .map((comment) => {
      const canDelete =
        currentUser &&
        (currentUser.role === "admin" ||
          currentUser.id === comment.user?._id ||
          currentUser.username === comment.user?.username);

      return `
        <div class="comment-item">
          <div class="comment-item-head">
            <strong>${escapeHtml(comment.user?.username || "Anonymous")}</strong>
            ${
              canDelete
                ? `<button
                    type="button"
                    class="comment-delete-btn"
                    onclick="event.stopPropagation(); deleteComment('${comment._id}', '${memoryId}')"
                  >
                    Delete
                  </button>`
                : ""
            }
          </div>
          <div class="comment-item-body">${escapeHtml(comment.content || "")}</div>
        </div>
      `;
    })
    .join("");
}

function updateSlideshowInfo(item) {
  const titleEl = $("slideshowTitleText");
  const descEl = $("slideshowDescText");
  const dateEl = $("slideshowDateText");
  const previewEl = $("slideshowCommentsPreview");

  if (dateEl) dateEl.textContent = formatDate(item.memoryDate);
  if (titleEl) titleEl.textContent = item.title || "No memories yet.";
  if (descEl) descEl.textContent = item.description || "No description.";
  if (previewEl) {
    previewEl.innerHTML = getCommentsPreviewHtml(item.memoryId);
  }
}

function showSlide(index) {
  const items = getSlideshowItems();

  if (!items.length) {
    if (slideshowImage) {
      slideshowImage.classList.remove("show");
      slideshowImage.src = "";
    }
    if (slideshowEmpty) {
      slideshowEmpty.style.display = "grid";
    }
    if ($("slideshowDateText"))
      $("slideshowDateText").textContent = "No date yet";
    if ($("slideshowTitleText"))
      $("slideshowTitleText").textContent = "No memories yet";
    if ($("slideshowDescText")) {
      $("slideshowDescText").textContent =
        "Please add a moment to display here.";
    }
    if ($("slideshowCommentsPreview")) {
      $("slideshowCommentsPreview").innerHTML = "No comments yet.";
    }
    clearInterval(slideInterval);
    return;
  }

  if (index < 0) {
    currentSlideIndex = items.length - 1;
  } else if (index >= items.length) {
    currentSlideIndex = 0;
  } else {
    currentSlideIndex = index;
  }

  const currentItem = items[currentSlideIndex];

  if (slideshowImage) {
    slideshowImage.src = currentItem.src;
    slideshowImage.classList.add("show");
  }
  if (slideshowEmpty) {
    slideshowEmpty.style.display = "none";
  }

  updateSlideshowInfo(currentItem);
  renderMemoryModeHighlight();
}

function startSlideshowAuto() {
  clearInterval(slideInterval);

  const items = getSlideshowItems();
  if (!items.length) return;

  slideInterval = setInterval(() => {
    showSlide(currentSlideIndex + 1);
  }, 4000);
}

function updateSlideshow() {
  showSlide(currentSlideIndex);
  startSlideshowAuto();
}

function focusSlideshowByMemory(memoryId, shouldScroll = true) {
  const items = getSlideshowItems();
  const targetIndex = items.findIndex((item) => item.memoryId === memoryId);
  if (targetIndex === -1) return;

  showSlide(targetIndex);
  startSlideshowAuto();

  if (shouldScroll) {
    document.getElementById("gallery")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}

function focusSlideshowByImage(memoryId, imageIndex = 0, shouldScroll = true) {
  const items = getSlideshowItems();
  const targetIndex = items.findIndex(
    (item) => item.memoryId === memoryId && item.imageIndex === imageIndex,
  );
  if (targetIndex === -1) return;

  showSlide(targetIndex);
  startSlideshowAuto();

  if (shouldScroll) {
    document.getElementById("gallery")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}

function renderMemoryModeHighlight() {
  const currentMemoryId = getCurrentSlideMemoryId();

  document.querySelectorAll(".memory-title-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.memoryId === currentMemoryId);
  });

  document.querySelectorAll(".memory-card-clickable").forEach((card) => {
    card.classList.toggle("active", card.dataset.memoryId === currentMemoryId);
  });
}

async function loadComments(memoryId) {
  const token = getToken();

  if (!token) {
    commentsCache[memoryId] = [];
    const listEl = document.getElementById(`comments-${memoryId}`);
    if (listEl) {
      listEl.innerHTML = getCommentsHtml(memoryId);
    }

    const items = getSlideshowItems();
    const currentItem = items[currentSlideIndex];
    if (currentItem && currentItem.memoryId === memoryId) {
      updateSlideshowInfo(currentItem);
    }
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/api/comments/${memoryId}`, {
      headers: getAuthHeaders(),
    });

    const data = await res.json().catch(() => []);
    if (!res.ok) return;

    commentsCache[memoryId] = Array.isArray(data) ? data : [];

    const listEl = document.getElementById(`comments-${memoryId}`);
    if (listEl) {
      listEl.innerHTML = getCommentsHtml(memoryId);
    }

    const items = getSlideshowItems();
    const currentItem = items[currentSlideIndex];
    if (currentItem && currentItem.memoryId === memoryId) {
      updateSlideshowInfo(currentItem);
    }
  } catch (error) {
    console.error("Load comments error:", error);
  }
}

function renderMemories(memories) {
  const memoryGrid = $("memoryGrid");
  const isLoggedIn = !!getToken();
  const currentMemoryId = getCurrentSlideMemoryId();

  if (!memoryGrid) return;

  if (!memories.length) {
    memoryGrid.innerHTML = `
      <div class="memory-card memory-card-empty">
        <div class="memory-content">
          <h4>Chưa có khoảnh khắc nào</h4>
          <p>Add some of your first memories together.</p>
        </div>
      </div>
    `;
    return;
  }

  if (memoryViewMode === "titles") {
    memoryGrid.innerHTML = `
      <div class="memory-title-list">
        ${memories
          .map(
            (memory) => `
              <button
                type="button"
                class="memory-title-btn ${
                  currentMemoryId === memory._id ? "active" : ""
                }"
                data-memory-id="${memory._id}"
                onclick="focusSlideshowByMemory('${memory._id}')"
              >
                <span>${escapeHtml(memory.title)}</span>
                <small>${formatDate(memory.memoryDate)}</small>
              </button>
            `,
          )
          .join("")}
      </div>
    `;
  } else {
    memoryGrid.innerHTML = memories
      .map((memory) => {
        const firstImage =
          memory.images && memory.images.length > 0
            ? getImageSrc(memory.images[0])
            : "https://via.placeholder.com/600x400?text=Memory";

        const actionButtons = isLoggedIn
          ? `
            <div class="card-actions" onclick="event.stopPropagation()">
              <button
                type="button"
                class="btn btn-secondary"
                onclick="startEditMemory('${memory._id}')"
              >
                Edit
              </button>
              <button
                type="button"
                class="btn btn-primary delete-btn"
                onclick="deleteMemory('${memory._id}')"
              >
                Delete
              </button>
            </div>
          `
          : "";

        return `
          <div
            class="memory-card memory-card-clickable ${
              currentMemoryId === memory._id ? "active" : ""
            }"
            data-memory-id="${memory._id}"
            onclick="focusSlideshowByMemory('${memory._id}')"
          >
            <img src="${firstImage}" alt="${escapeHtml(memory.title)}" />

            <div class="memory-content">
              <div class="memory-head">
                <h4>${escapeHtml(memory.title)}</h4>
                <div class="memory-meta">${formatDate(memory.memoryDate)}</div>
              </div>

              <p>${escapeHtml(memory.description || "No description.")}</p>

              <div class="comment-box" onclick="event.stopPropagation()">
                <div id="comments-${memory._id}" class="comment-list">
                  ${getCommentsHtml(memory._id)}
                </div>

                <div class="comment-form">
                  <input
                    type="text"
                    id="comment-input-${memory._id}"
                    placeholder="${
                      isLoggedIn ? "Write a comment..." : "Log in to comment"
                    }"
                    ${isLoggedIn ? "" : "disabled"}
                  />
                  <button
                    type="button"
                    class="btn btn-secondary"
                    onclick="submitComment('${memory._id}')"
                    ${isLoggedIn ? "" : "disabled"}
                  >
                    Send
                  </button>
                </div>
              </div>

              ${actionButtons}
            </div>
          </div>
        `;
      })
      .join("");
  }

  memories.forEach((memory) => {
    loadComments(memory._id);
  });
}

if (toggleMemoryLayoutBtn) {
  toggleMemoryLayoutBtn.addEventListener("click", () => {
    memoryViewMode = memoryViewMode === "cards" ? "titles" : "cards";

    toggleMemoryLayoutBtn.textContent =
      memoryViewMode === "cards" ? "Show titles only" : "Show photo card";

    renderMemories(memoryCache);
  });
}

if (prevSlideBtn) {
  prevSlideBtn.addEventListener("click", () => {
    showSlide(currentSlideIndex - 1);
    startSlideshowAuto();
  });
}

if (nextSlideBtn) {
  nextSlideBtn.addEventListener("click", () => {
    showSlide(currentSlideIndex + 1);
    startSlideshowAuto();
  });
}

const memoryImageInput = $("memoryImage");
if (memoryImageInput) {
  memoryImageInput.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    const previewImage = $("previewImage");
    const previewText = $("previewText");

    if (!previewImage || !previewText) return;

    if (!file) {
      previewImage.classList.remove("show");
      previewImage.src = "";
      previewText.style.display = "block";
      return;
    }

    const reader = new FileReader();
    reader.onload = function (readerEvent) {
      previewImage.src = readerEvent.target?.result || "";
      previewImage.classList.add("show");
      previewText.style.display = "none";
    };
    reader.readAsDataURL(file);
  });
}

function resetMemoryForm() {
  $("memoryForm")?.reset();
  if ($("editingMemoryId")) $("editingMemoryId").value = "";
  if ($("memoryFormTitle")) {
    $("memoryFormTitle").textContent = "Add a new memory";
  }
  if ($("saveMemoryBtn")) {
    $("saveMemoryBtn").textContent = "Save memory";
  }

  if ($("previewImage")) {
    $("previewImage").src = "";
    $("previewImage").classList.remove("show");
  }
  if ($("previewText")) {
    $("previewText").style.display = "block";
  }
}

function startEditMemory(id) {
  const memory = memoryCache.find((item) => item._id === id);
  if (!memory) return;

  if ($("editingMemoryId")) $("editingMemoryId").value = memory._id;
  if ($("memoryTitle")) $("memoryTitle").value = memory.title || "";
  if ($("memoryDate")) {
    $("memoryDate").value = memory.memoryDate
      ? new Date(memory.memoryDate).toISOString().split("T")[0]
      : "";
  }
  if ($("memoryDescription")) {
    $("memoryDescription").value = memory.description || "";
  }
  if ($("memoryFormTitle")) {
    $("memoryFormTitle").textContent = "Edit the moment";
  }
  if ($("saveMemoryBtn")) {
    $("saveMemoryBtn").textContent = "Update the moment";
  }

  const firstImage =
    memory.images && memory.images.length > 0 ? memory.images[0] : "";

  if (firstImage) {
    $("previewImage").src = getImageSrc(firstImage);
    $("previewImage").classList.add("show");
    $("previewText").style.display = "none";
  } else {
    $("previewImage").src = "";
    $("previewImage").classList.remove("show");
    $("previewText").style.display = "block";
  }

  document.getElementById("vault")?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

async function deleteMemory(id) {
  const token = getToken();
  if (!token) {
    alert("Bạn cần đăng nhập.");
    return;
  }

  const confirmed = window.confirm(
    "Are you sure you want to delete this memory?",
  );
  if (!confirmed) return;

  try {
    const res = await fetch(`${BASE_URL}/api/memories/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      showMessage(authMessage, data.message || "Delete failed.");
      return;
    }

    showMessage(authMessage, data.message || "Deleted successfully.");
    await loadMemories();
    resetMemoryForm();
  } catch (error) {
    console.error("Delete memory error:", error);
    showMessage(authMessage, "Server connection error.");
  }
}

const memoryForm = $("memoryForm");
if (memoryForm) {
  memoryForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const token = getToken();
    if (!token) {
      showMessage(authMessage, "You need to log in before adding a moment.");
      authModal?.classList.add("show");
      return;
    }

    try {
      const editingId = $("editingMemoryId")?.value || "";
      const formData = new FormData();

      formData.append("title", $("memoryTitle")?.value.trim() || "");
      formData.append(
        "description",
        $("memoryDescription")?.value.trim() || "",
      );
      formData.append("memoryDate", $("memoryDate")?.value || "");

      const imageFiles = $("memoryImage")?.files || [];
      for (const file of imageFiles) {
        formData.append("images", file);
      }

      const url = editingId
        ? `${BASE_URL}/api/memories/${editingId}`
        : `${BASE_URL}/api/memories`;

      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        showMessage(authMessage, data.message || "Unable to save the moment.");
        return;
      }

      showMessage(authMessage, data.message || "Moment saved successfully.");
      resetMemoryForm();
      await loadMemories();
    } catch (error) {
      console.error("Save memory error:", error);
      showMessage(authMessage, "Server connection error.");
    }
  });
}

const cancelEditBtn = $("cancelEditBtn");
if (cancelEditBtn) {
  cancelEditBtn.addEventListener("click", () => {
    resetMemoryForm();
  });
}

async function submitComment(memoryId) {
  const token = getToken();
  if (!token) {
    alert("You need to log in to comment.");
    return;
  }

  const input = document.getElementById(`comment-input-${memoryId}`);
  const content = input?.value.trim();
  if (!content) return;

  try {
    const res = await fetch(`${BASE_URL}/api/comments/${memoryId}`, {
      method: "POST",
      headers: getAuthHeaders(true),
      body: JSON.stringify({ content }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert(data.message || "Comment creation failed.");
      return;
    }

    if (input) input.value = "";
    await loadComments(memoryId);
  } catch (error) {
    console.error("Submit comment error:", error);
    alert("Connection error when submitting a comment.");
  }
}

async function deleteComment(commentId, memoryId) {
  const token = getToken();
  if (!token) {
    alert("You need to log in.");
    return;
  }

  const confirmed = window.confirm(
    "Are you sure you want to delete this comment?",
  );
  if (!confirmed) return;

  try {
    const res = await fetch(`${BASE_URL}/api/comments/${commentId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert(data.message || "Deleting comments failed.");
      return;
    }

    await loadComments(memoryId);
  } catch (error) {
    console.error("Delete comment error:", error);
    alert("Connection error when deleting comments.");
  }
}

/* =========================
   TIMELINE
========================= */

function showTimelineStatus(text) {
  if (!timelineStatus || !text) return;

  clearTimeout(timelineStatusTimer);
  timelineStatus.textContent = text;
  timelineStatus.classList.add("show");

  timelineStatusTimer = setTimeout(() => {
    timelineStatus.classList.remove("show");
  }, 1800);
}

function ensureTimelineEditor() {
  if (canEditTimeline()) return true;

  authModal?.classList.add("show");
  showMessage(modalMessage, "Đăng nhập để chỉnh Love Timeline.");
  return false;
}

function syncTimelineEditorUI() {
  const loggedIn = canEditTimeline();
  const isEditMode = timelineMode === "edit" && loggedIn;

  if (timelineModeToggleBtn) {
    timelineModeToggleBtn.textContent = isEditMode
      ? "View timeline"
      : "Edit timeline";
  }

  if (timelineEditorActions) {
    timelineEditorActions.style.display = isEditMode ? "flex" : "none";
  }

  if (timelineEditorHint) {
    if (!loggedIn) {
      timelineEditorHint.textContent =
        "You are in view mode. Log in to edit the Love Timeline.";
    } else if (isEditMode) {
      timelineEditorHint.textContent =
        "You are in edit mode. You can drag, type, choose stickers, add boxes, and delete boxes.";
    } else {
      timelineEditorHint.textContent =
        "You are in view mode. The timeline auto-scrolls continuously.";
    }
  }

  if (timelineScrollWrap) {
    timelineScrollWrap.classList.toggle("timeline-view-mode", !isEditMode);
    timelineScrollWrap.classList.toggle("timeline-edit-mode", isEditMode);
    timelineScrollWrap.style.overflowX = isEditMode ? "auto" : "hidden";
    timelineScrollWrap.style.pointerEvents = "auto";
  }
}

function stopTimelineAutoScroll() {
  if (timelineAutoFrame) {
    cancelAnimationFrame(timelineAutoFrame);
    timelineAutoFrame = null;
  }

  const track = timelineList?.querySelector(".timeline-tape");
  if (track) {
    track.style.willChange = "auto";
  }
}

function startTimelineAutoScroll() {
  stopTimelineAutoScroll();

  if (!timelineScrollWrap || timelineMode !== "view") return;

  const track = timelineList?.querySelector(".timeline-tape");
  if (!track || track.dataset.loop !== "true") return;

  const loopWidth = track.scrollWidth / 2;
  if (!loopWidth || !Number.isFinite(loopWidth)) return;

  const speed = 0.45;
  track.style.willChange = "transform";

  const step = () => {
    if (timelineMode !== "view") {
      stopTimelineAutoScroll();
      return;
    }

    timelineAutoOffset += speed;

    if (timelineAutoOffset >= loopWidth) {
      timelineAutoOffset = 0;
    }

    track.style.transform = `translateX(-${timelineAutoOffset}px)`;
    timelineAutoFrame = requestAnimationFrame(step);
  };

  timelineAutoFrame = requestAnimationFrame(step);
}

function setTimelineMode(mode, options = {}) {
  const requestedMode = mode === "edit" ? "edit" : "view";

  if (requestedMode === "edit" && !ensureTimelineEditor()) {
    timelineMode = "view";
  } else {
    timelineMode = requestedMode;
  }

  saveTimelineMode(timelineMode);
  syncTimelineEditorUI();

  if (options.rerender) {
    renderTimeline(timelineCache);
    return;
  }

  const track = timelineList?.querySelector(".timeline-tape");

  if (timelineMode === "edit") {
    stopTimelineAutoScroll();
    if (track) track.style.transform = "translateX(0px)";
  } else {
    timelineAutoOffset = 0;
    if (track) track.style.transform = "translateX(0px)";
    startTimelineAutoScroll();
  }
}

function getTimelinePayload(event = {}) {
  return {
    title: "",
    description: (event.description || "").trim(),
    eventDate: event.eventDate || null,
    icon: event.icon || "💖",
  };
}

async function fetchTimelineEventsFromApi() {
  const res = await fetch(`${BASE_URL}/api/timeline`, {
    headers: getAuthHeaders(),
  });

  const data = await res.json().catch(() => []);
  if (!res.ok) {
    throw new Error(data.message || "Không thể tải timeline.");
  }

  return Array.isArray(data)
    ? data.map((event) => normalizeTimelineEvent(event))
    : [];
}

async function createTimelineEventOnServer(event = {}) {
  const res = await fetch(`${BASE_URL}/api/timeline`, {
    method: "POST",
    headers: getAuthHeaders(true),
    body: JSON.stringify(getTimelinePayload(event)),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Không thể tạo box timeline.");
  }

  return normalizeTimelineEvent(data.event || data);
}

async function updateTimelineEventOnServer(id, event = {}) {
  const res = await fetch(`${BASE_URL}/api/timeline/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(true),
    body: JSON.stringify(getTimelinePayload(event)),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Không thể cập nhật timeline.");
  }

  return normalizeTimelineEvent(data.event || data);
}

async function deleteTimelineEventOnServer(id) {
  const res = await fetch(`${BASE_URL}/api/timeline/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Không thể xóa timeline.");
  }

  return data;
}

async function loadTimeline() {
  try {
    const remoteEvents = await fetchTimelineEventsFromApi();
    timelineCache = sortTimelineEvents(remoteEvents);
    renderTimeline(timelineCache);
  } catch (error) {
    console.error("Load timeline error:", error);
    timelineCache = [];
    renderTimeline(timelineCache);
  }
}

function renderTimeline(events) {
  if (!timelineList) return;

  const sortedEvents = sortTimelineEvents(events || []);
  const isEditMode = timelineMode === "edit" && canEditTimeline();

  timelineCache = sortedEvents;
  syncTimelineEditorUI();

  if (!sortedEvents.length) {
    timelineList.innerHTML = `
      <div class="timeline-empty-card">
        <div class="timeline-empty-icon">♡</div>
        <h4>Love Timeline is empty</h4>
        <p>${
          isEditMode
            ? "Click Add box to create the first milestone."
            : "Log in to create and edit timeline boxes."
        }</p>
      </div>
    `;
    stopTimelineAutoScroll();
    return;
  }

  const cardsHtml = sortedEvents
    .map(
      (event, index) => `
        <article
          class="timeline-card timeline-card-editable ${isEditMode ? "is-editing" : "is-viewing"}"
          data-timeline-id="${event.id}"
        >
          <div class="timeline-card-top">
            <div class="timeline-pin"></div>
            <div class="timeline-order">#${String(index + 1).padStart(2, "0")}</div>
          </div>

          <div class="timeline-sticker-row">
            <div class="timeline-sticker-preview" title="Current sticker">
              ${escapeHtml(event.icon || "💖")}
            </div>

            ${
              isEditMode
                ? `
                  <div class="timeline-sticker-picker">
                    ${TIMELINE_STICKERS.map(
                      (sticker) => `
                        <button
                          type="button"
                          class="timeline-sticker-btn ${
                            sticker === (event.icon || "💖") ? "active" : ""
                          }"
                          onclick="selectTimelineSticker('${event.id}', '${sticker}')"
                        >
                          ${escapeHtml(sticker)}
                        </button>
                      `,
                    ).join("")}
                  </div>
                `
                : ""
            }
          </div>

          <label class="timeline-label">Important date</label>
          <input
            type="date"
            class="timeline-input timeline-date-input"
            value="${escapeHtml(event.eventDate || "")}"
            onchange="updateTimelineField('${event.id}', 'eventDate', this.value, this)"
            ${isEditMode ? "" : "disabled"}
          />

          <label class="timeline-label">Content</label>
          <textarea
            class="timeline-input timeline-textarea"
            placeholder="Write your special memory here..."
            oninput="updateTimelineField('${event.id}', 'description', this.value, this)"
            ${isEditMode ? "" : "disabled"}
          >${escapeHtml(event.description || "")}</textarea>

          <div class="timeline-card-footer">
            <div class="timeline-mini-date">
              ${event.eventDate ? formatDate(event.eventDate) : "No date selected"}
            </div>

            ${
              isEditMode
                ? `<button
                    type="button"
                    class="timeline-delete-btn"
                    onclick="removeTimelineCard('${event.id}')"
                  >
                    Delete box
                  </button>`
                : ""
            }
          </div>
        </article>
      `,
    )
    .join("");

  const loopContent = isEditMode ? cardsHtml : `${cardsHtml}${cardsHtml}`;

  timelineList.innerHTML = `
    <div class="timeline-tape" data-loop="${isEditMode ? "false" : "true"}">
      ${loopContent}
    </div>
  `;

  const textareas = timelineList.querySelectorAll(".timeline-textarea");
  textareas.forEach((textarea) => {
    textarea.style.height = "auto";
    textarea.style.height = `${Math.max(textarea.scrollHeight, 110)}px`;
  });

  const track = timelineList.querySelector(".timeline-tape");

  if (isEditMode) {
    stopTimelineAutoScroll();
    if (track) track.style.transform = "translateX(0px)";
  } else {
    timelineAutoOffset = 0;
    if (track) track.style.transform = "translateX(0px)";
    startTimelineAutoScroll();
  }
}

async function addTimelineCard() {
  if (!ensureTimelineEditor()) return;

  try {
    const createdEvent = await createTimelineEventOnServer(
      createEmptyTimelineEvent(),
    );
    timelineCache = sortTimelineEvents([...timelineCache, createdEvent]);
    renderTimeline(timelineCache);
    showTimelineStatus("Đã thêm một box timeline mới.");
  } catch (error) {
    console.error("Add timeline error:", error);
    showTimelineStatus(error.message || "Không thể thêm box timeline.");
  }
}

async function seedTimelineStarterCards() {
  if (!ensureTimelineEditor()) return;

  try {
    const starterEvents = createStarterTimelineEvents();
    const created = [];

    for (const starter of starterEvents) {
      const event = await createTimelineEventOnServer(starter);
      created.push(event);
    }

    timelineCache = sortTimelineEvents(created);
    renderTimeline(timelineCache);
    showTimelineStatus("Đã tạo 3 box mẫu cho Love Timeline.");
  } catch (error) {
    console.error("Seed timeline error:", error);
    showTimelineStatus(error.message || "Không thể tạo box mẫu.");
  }
}

async function resetTimelineCards() {
  if (!ensureTimelineEditor()) return;

  const confirmed = window.confirm(
    "Bạn có muốn thay timeline hiện tại bằng 3 box mẫu mới không?",
  );
  if (!confirmed) return;

  try {
    for (const item of timelineCache) {
      clearTimeout(timelineUpdateTimers.get(item.id));
      timelineUpdateTimers.delete(item.id);
      await deleteTimelineEventOnServer(item.id);
    }

    timelineCache = [];
    renderTimeline([]);
    await seedTimelineStarterCards();
  } catch (error) {
    console.error("Reset timeline error:", error);
    showTimelineStatus(error.message || "Không thể reset timeline.");
  }
}

async function removeTimelineCard(id) {
  if (!ensureTimelineEditor()) return;

  try {
    clearTimeout(timelineUpdateTimers.get(id));
    timelineUpdateTimers.delete(id);

    await deleteTimelineEventOnServer(id);
    timelineCache = timelineCache.filter((event) => event.id !== id);
    renderTimeline(timelineCache);
    showTimelineStatus("Đã xóa một box timeline.");
  } catch (error) {
    console.error("Remove timeline error:", error);
    showTimelineStatus(error.message || "Không thể xóa box timeline.");
  }
}

function updateTimelineField(id, field, value, element = null) {
  if (!ensureTimelineEditor()) return;

  if (field === "description" && element) {
    element.style.height = "auto";
    element.style.height = `${Math.max(element.scrollHeight, 110)}px`;
  }

  timelineCache = timelineCache.map((event) =>
    event.id === id
      ? {
          ...event,
          [field]: value,
        }
      : event,
  );

  if (field === "eventDate") {
    renderTimeline(timelineCache);
  }

  const found = timelineCache.find((event) => event.id === id);
  if (!found) return;

  clearTimeout(timelineUpdateTimers.get(id));

  const timer = setTimeout(async () => {
    try {
      const updated = await updateTimelineEventOnServer(id, found);
      timelineCache = timelineCache.map((item) =>
        item.id === id ? updated : item,
      );
      renderTimeline(timelineCache);
      showTimelineStatus("Đã cập nhật timeline.");
    } catch (error) {
      console.error("Update timeline error:", error);
      showTimelineStatus(error.message || "Không thể cập nhật timeline.");
    }
  }, 300);

  timelineUpdateTimers.set(id, timer);
}

async function selectTimelineSticker(id, sticker) {
  if (!ensureTimelineEditor()) return;

  timelineCache = timelineCache.map((event) =>
    event.id === id
      ? {
          ...event,
          icon: sticker,
        }
      : event,
  );

  renderTimeline(timelineCache);

  const found = timelineCache.find((event) => event.id === id);
  if (!found) return;

  try {
    const updated = await updateTimelineEventOnServer(id, found);
    timelineCache = timelineCache.map((item) =>
      item.id === id ? updated : item,
    );
    renderTimeline(timelineCache);
    showTimelineStatus("Đã đổi sticker cho box timeline.");
  } catch (error) {
    console.error("Update sticker error:", error);
    showTimelineStatus(error.message || "Không thể đổi sticker.");
  }
}

if (timelineModeToggleBtn) {
  timelineModeToggleBtn.addEventListener("click", () => {
    const nextMode = timelineMode === "view" ? "edit" : "view";
    setTimelineMode(nextMode, { rerender: true });
  });
}

if (addTimelineCardBtn) {
  addTimelineCardBtn.addEventListener("click", () => {
    addTimelineCard();
  });
}

if (resetTimelineBtn) {
  resetTimelineBtn.addEventListener("click", () => {
    resetTimelineCards();
  });
}

/* =========================
   MUSIC
========================= */

const musicPlaylist = [
  "./assets/music/[MV] Crush - Love You With All My Heart(미안해 미워해 사랑해).mp3",
  "./assets/music/[MV] Kim Na Young(김나영) - From Bottom of My Heart(일기).mp3",
  "./assets/music/[MV] YOON MI RAE(윤미래) _ You are my world(그대라는 세상) (The Legend of The Blue Sea(푸른 바다의 전설) OST Part.2).mp3",
  "./assets/music/[Vietsub] Năm mươi năm về sau (五十年以后) - Hải Lai A Mộc.mp3",
  "./assets/music/Chờ Anh Nhé (feat. Hoàng Rob).mp3",
  "./assets/music/Ellie Goulding - Love Me Like You Do (Lyrics).mp3",
  "./assets/music/EM ĐỒNG Ý (I DO) - ĐỨC PHÚC x 911 x KHẮC HƯNG  OFFICIAL MUSIC VIDEO  VALENTINE 2023.mp3",
  "./assets/music/I Will Go To You Like The First Snow - Ailee Lyrics [Han,Rom,Eng].mp3",
  "./assets/music/LỄ ĐƯỜNG của Hải Long & Salim  KAI ĐINH  Official MV.mp3",
  "./assets/music/Nothing's Gonna Change My Love For You - Music Travel Love ft. Bugoy Drilon.mp3",
  "./assets/music/Pretty Boy Lyrics M2M (Lyrics).mp3",
  "./assets/music/Proud of You  - Fiona Fung (Vietsub)  LEE Speak.mp3",
  "./assets/music/Shane Filan - Beautiful In White (Official Video).mp3",
  "./assets/music/Shayne Ward - Until You (Audio).mp3",
  "./assets/music/Taylor Swift - Enchanted (Taylor's Version) (Lyric Video).mp3",
  "./assets/music/Taylor Swift - Love Story (Lyrics).mp3",
  "./assets/music/vietsub + lyrics  𝑶𝒏𝒍𝒚 𝑳𝒐𝒗𝒆  Trademark  七元 (Thất Nguyên) Cover.mp3",
  "./assets/music/Vạn Vật Như Muốn Ta Bên Nhau - RIO  Lyrics Video.mp3",
  "./assets/music/Vợ Yêu.mp3",
  "./assets/music/Westlife - My Love (Lyrics).mp3",
  "./assets/music/Zack Tabudlo - Give Me Your Forever (Lyric Video).mp3",
  "./assets/music/王灝兒 JW - Wish.mp3",
  "./assets/music/Stephanie Poetri - I Love You 3000 (Official Music Video).mp3",
  "./assets/music/Ed Sheeran - Perfect (Official Music Video).mp3",
  "./assets/music/Alex Warren - Ordinary (Wedding Version) [Official Music Video].mp3",
];

function extractTrackTitle(path) {
  if (!path) return "No songs have been played yet.";

  const fileName = decodeURIComponent(path.split("/").pop() || "");
  return fileName
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]+/g, " ")
    .trim();
}

function shuffleArray(array) {
  const arr = [...array];

  for (let i = arr.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[randomIndex]] = [arr[randomIndex], arr[i]];
  }

  return arr;
}

function updateMusicUI() {
  const currentTrack = shuffledPlaylist[currentTrackIndex] || "";

  if (currentTrackNameEl) {
    currentTrackNameEl.textContent = currentTrack
      ? extractTrackTitle(currentTrack)
      : "No songs have been played yet.";
  }

  if (toggleMusicBtn) {
    toggleMusicBtn.textContent = isMusicPlaying ? "Pause music" : "Play music";
  }

  if (musicPlayingIcon) {
    musicPlayingIcon.classList.toggle("active", isMusicPlaying);
  }
}

function prepareMusicPlaylist(forceShuffle = false) {
  if (!musicPlaylist.length) return;

  if (!hasPreparedPlaylist || forceShuffle) {
    shuffledPlaylist = shuffleArray(musicPlaylist);
    currentTrackIndex = 0;
    hasPreparedPlaylist = true;
  }
}

function loadCurrentTrack() {
  if (!bgMusic || !shuffledPlaylist.length) return;

  bgMusic.src = shuffledPlaylist[currentTrackIndex];
  bgMusic.load();
  updateMusicUI();
}
async function unlockAudioOnce() {
  if (!bgMusic || audioUnlocked) return true;

  try {
    if (!hasPreparedPlaylist || !shuffledPlaylist.length) {
      prepareMusicPlaylist(true);
      loadCurrentTrack();
    }

    await bgMusic.play();
    bgMusic.pause();
    bgMusic.currentTime = 0;

    audioUnlocked = true;
    updateMusicUI();
    return true;
  } catch (error) {
    console.warn("Audio unlock failed:", error);
    return false;
  }
}

function registerUserGesture() {
  hasUserGesture = true;
}

document.addEventListener("touchstart", registerUserGesture, { passive: true });
document.addEventListener("click", registerUserGesture, { passive: true });

async function playNextTrack() {
  if (!musicPlaylist.length || !bgMusic) return;

  prepareMusicPlaylist();
  currentTrackIndex += 1;

  if (currentTrackIndex >= shuffledPlaylist.length) {
    shuffledPlaylist = shuffleArray(musicPlaylist);
    currentTrackIndex = 0;
  }

  loadCurrentTrack();

  try {
    await bgMusic.play();
    isMusicPlaying = true;
    updateMusicUI();
  } catch (error) {
    console.error("Next track error:", error);
  }
}

async function playPrevTrack() {
  if (!musicPlaylist.length || !bgMusic) return;

  prepareMusicPlaylist();
  currentTrackIndex -= 1;

  if (currentTrackIndex < 0) {
    currentTrackIndex = shuffledPlaylist.length - 1;
  }

  loadCurrentTrack();

  try {
    await bgMusic.play();
    isMusicPlaying = true;
    updateMusicUI();
  } catch (error) {
    console.error("Prev track error:", error);
  }
}

if (bgMusic) {
  bgMusic.addEventListener("ended", () => {
    playNextTrack();
  });

  bgMusic.addEventListener("pause", () => {
    isMusicPlaying = false;
    updateMusicUI();
  });

  bgMusic.addEventListener("play", () => {
    isMusicPlaying = true;
    audioUnlocked = true;
    updateMusicUI();
  });
}

if (toggleMusicBtn && bgMusic) {
  toggleMusicBtn.addEventListener("click", async () => {
    try {
      if (!hasPreparedPlaylist || !shuffledPlaylist.length) {
        prepareMusicPlaylist(true);
        loadCurrentTrack();
      }

      if (!audioUnlocked) {
        const unlocked = await unlockAudioOnce();
        if (!unlocked) {
          showMessage(
            authMessage,
            "Safari trên iPhone đang chặn audio. Hãy chạm lại nút Play một lần nữa.",
          );
          return;
        }
      }

      if (!isMusicPlaying) {
        await bgMusic.play();
        isMusicPlaying = true;
      } else {
        bgMusic.pause();
        isMusicPlaying = false;
      }

      updateMusicUI();
    } catch (error) {
      console.error("Music play error:", error);
      showMessage(
        authMessage,
        "Không thể phát nhạc lúc này. Hãy chạm lại nút Play.",
      );
    }
  });
}

if (nextSongBtn) {
  nextSongBtn.addEventListener("click", () => {
    playNextTrack();
  });
}

if (prevSongBtn) {
  prevSongBtn.addEventListener("click", () => {
    playPrevTrack();
  });
}

/* =========================
   COUNTER
========================= */

function calculateLoveDuration(startDate, endDate) {
  let temp = new Date(startDate);
  let years = 0;
  let months = 0;

  while (true) {
    const nextYear = new Date(temp);
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    if (nextYear <= endDate) {
      years += 1;
      temp = nextYear;
    } else {
      break;
    }
  }

  while (true) {
    const nextMonth = new Date(temp);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    if (nextMonth <= endDate) {
      months += 1;
      temp = nextMonth;
    } else {
      break;
    }
  }

  let diff = endDate - temp;
  const dayMs = 24 * 60 * 60 * 1000;
  const hourMs = 60 * 60 * 1000;
  const minuteMs = 60 * 1000;
  const secondMs = 1000;

  const days = Math.floor(diff / dayMs);
  diff -= days * dayMs;

  const hours = Math.floor(diff / hourMs);
  diff -= hours * hourMs;

  const minutes = Math.floor(diff / minuteMs);
  diff -= minutes * minuteMs;

  const seconds = Math.floor(diff / secondMs);

  return { years, months, days, hours, minutes, seconds };
}

function updateCounter() {
  if (
    !(loveStartDate instanceof Date) ||
    Number.isNaN(loveStartDate.getTime())
  ) {
    return;
  }

  const now = new Date();
  const result = calculateLoveDuration(loveStartDate, now);

  if ($("years")) $("years").textContent = result.years;
  if ($("months")) $("months").textContent = result.months;
  if ($("days")) $("days").textContent = result.days;
  if ($("hours")) $("hours").textContent = result.hours;
  if ($("minutes")) $("minutes").textContent = result.minutes;
  if ($("seconds")) $("seconds").textContent = result.seconds;
}

/* =========================
   GLOBAL EXPORTS FOR INLINE HTML
========================= */

window.openProfileEditorAndFocus = openProfileEditorAndFocus;
window.focusSlideshowByMemory = focusSlideshowByMemory;
window.focusSlideshowByImage = focusSlideshowByImage;
window.startEditMemory = startEditMemory;
window.deleteMemory = deleteMemory;
window.submitComment = submitComment;
window.deleteComment = deleteComment;
window.selectTimelineSticker = selectTimelineSticker;
window.updateTimelineField = updateTimelineField;
window.removeTimelineCard = removeTimelineCard;

/* =========================
   INIT
========================= */

async function reloadWholePageData() {
  await loadProfile();
  await loadMemories();
  await loadTimeline();
}

async function init() {
  updateAuthUI();
  syncTimelineEditorUI();
  prepareMusicPlaylist(true);
  updateMusicUI();

  try {
    await reloadWholePageData();
  } catch (error) {
    console.error("Init error:", error);
  }

  updateCounter();
}

setInterval(updateCounter, 1000);
init();
