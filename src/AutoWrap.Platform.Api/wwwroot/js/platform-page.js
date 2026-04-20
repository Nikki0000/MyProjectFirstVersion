import { apiRequest, clearAuth, getAuth, roleName, showToast, toStatusCode } from "/js/api.js";

const auth = getAuth();
if (!auth?.token) {
  window.location.href = "/";
}

const pageTitle = document.getElementById("page-title");
const userMeta = document.getElementById("user-meta");
const feedList = document.getElementById("feed-list");
const profileBox = document.getElementById("profile-box");
const detailsCard = document.getElementById("feed-details");
const detailsBox = document.getElementById("feed-details-box");

userMeta.textContent = `${auth.fullName} | ${roleName(auth.role)} | ${auth.email}`;

document.getElementById("logout-btn").addEventListener("click", () => {
  clearAuth();
  window.location.href = "/";
});

for (const menu of document.querySelectorAll(".menu-item")) {
  menu.addEventListener("click", async () => {
    for (const item of document.querySelectorAll(".menu-item")) {
      item.classList.remove("active");
    }

    menu.classList.add("active");
    const tab = menu.dataset.tab;
    switchTab(tab);
    await loadTab(tab);
  });
}

function switchTab(tab) {
  for (const pane of document.querySelectorAll(".tab-pane")) {
    pane.classList.remove("active");
  }

  document.getElementById(`tab-${tab}`).classList.add("active");
  pageTitle.textContent = menuTitle(tab);
}

function menuTitle(tab) {
  if (tab === "feed") return "Лента заказов";
  if (tab === "create") return "Создать заказ";
  if (tab === "my-created") return "Мои заказы";
  if (tab === "my-responded") return "Мои отклики";
  if (tab === "favorites") return "Избранное";
  if (tab === "profile") return "Профиль";
  return "Платформа";
}

document.getElementById("feed-refresh").addEventListener("click", () => loadFeed().catch(handleError));

document.getElementById("create-form").addEventListener("submit", async event => {
  event.preventDefault();

  try {
    await apiRequest("/api/orders", {
      method: "POST",
      authRequired: true,
      body: {
        title: document.getElementById("create-title").value.trim(),
        description: document.getElementById("create-description").value.trim(),
        city: document.getElementById("create-city").value.trim(),
        budget: Number(document.getElementById("create-budget").value),
        plannedDate: document.getElementById("create-date").value || null
      }
    });

    showToast("Заказ опубликован.");
    event.target.reset();
    await loadFeed();
  } catch (error) {
    handleError(error);
  }
});

async function loadTab(tab) {
  if (tab === "feed") return loadFeed();
  if (tab === "my-created") return loadSimpleList("/api/me/created-orders", "my-created-list");
  if (tab === "my-responded") return loadSimpleList("/api/me/responded-orders", "my-responded-list");
  if (tab === "favorites") return loadSimpleList("/api/me/favorites", "favorites-list");
  if (tab === "profile") return loadProfile();
}

async function loadFeed() {
  detailsCard.hidden = true;
  const query = new URLSearchParams();

  const search = document.getElementById("feed-search").value.trim();
  if (search) {
    query.set("query", search);
  }

  const selectedStatus = document.getElementById("feed-status").value;
  const statusCode = toStatusCode(selectedStatus);
  if (statusCode) {
    query.set("status", String(statusCode));
  }

  const path = `/api/orders${query.toString() ? `?${query.toString()}` : ""}`;
  const data = await apiRequest(path, { method: "GET" });
  renderOrders(feedList, data, true);
}

async function loadSimpleList(path, elementId) {
  const element = document.getElementById(elementId);
  const data = await apiRequest(path, { method: "GET", authRequired: true });
  renderOrders(element, data, false);
}

async function loadProfile() {
  const data = await apiRequest("/api/me/profile", { method: "GET", authRequired: true });
  profileBox.textContent = JSON.stringify({
    "Пользователь": data.fullName,
    "Email": data.email,
    "Роль": roleName(data.role),
    "Создано заказов": data.createdOrders,
    "Откликов": data.responses,
    "В избранном": data.favorites
  }, null, 2);
}

function renderOrders(container, items, includeActions) {
  if (!Array.isArray(items) || items.length === 0) {
    container.innerHTML = '<div class="card">Пока нет данных.</div>';
    return;
  }

  container.innerHTML = items.map(item => {
    const actions = includeActions
      ? `<div class="actions">
          <button data-action="details" data-id="${item.id}">Детали</button>
          <button data-action="favorite" data-id="${item.id}" data-fav="${item.isFavoritedByCurrentUser}">${item.isFavoritedByCurrentUser ? "Убрать из избранного" : "В избранное"}</button>
          <button data-action="respond" data-id="${item.id}">Откликнуться</button>
        </div>`
      : "";

    return `<article class="order-item">
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.description)}</p>
      <p class="order-meta">Город: ${escapeHtml(item.city)} | Бюджет: ${item.budget} | Статус: ${statusText(item.status)}</p>
      <p class="order-meta">Автор: ${escapeHtml(item.createdByName)} | Откликов: ${item.responsesCount}</p>
      ${actions}
    </article>`;
  }).join("");

  if (!includeActions) {
    return;
  }

  for (const btn of container.querySelectorAll("button[data-action='details']")) {
    btn.addEventListener("click", async () => {
      try {
        const details = await apiRequest(`/api/orders/${btn.dataset.id}`, { method: "GET" });
        detailsCard.hidden = false;
        detailsBox.textContent = JSON.stringify(details, null, 2);
      } catch (error) {
        handleError(error);
      }
    });
  }

  for (const btn of container.querySelectorAll("button[data-action='favorite']")) {
    btn.addEventListener("click", async () => {
      try {
        const isFav = btn.dataset.fav === "true";
        await apiRequest(`/api/orders/${btn.dataset.id}/favorite`, {
          method: isFav ? "DELETE" : "POST",
          authRequired: true
        });

        showToast(isFav ? "Удалено из избранного." : "Добавлено в избранное.");
        await loadFeed();
      } catch (error) {
        handleError(error);
      }
    });
  }

  for (const btn of container.querySelectorAll("button[data-action='respond']")) {
    btn.addEventListener("click", async () => {
      try {
        const message = prompt("Введите текст отклика:");
        if (!message) return;

        const priceRaw = prompt("Предложенная цена (необязательно):");
        await apiRequest(`/api/orders/${btn.dataset.id}/respond`, {
          method: "POST",
          authRequired: true,
          body: {
            message,
            proposedPrice: priceRaw ? Number(priceRaw) : null
          }
        });

        showToast("Отклик отправлен.");
        await loadFeed();
      } catch (error) {
        handleError(error);
      }
    });
  }
}

function statusText(status) {
  if (status === "Open") return "Открыт";
  if (status === "InProgress") return "В работе";
  if (status === "Completed") return "Завершен";
  if (status === "Cancelled") return "Отменен";
  return status;
}

function escapeHtml(value) {
  if (value == null) return "";
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function handleError(error) {
  const message = typeof error?.message === "string" ? error.message : "Произошла ошибка.";
  showToast(message);
}

loadFeed().catch(handleError);
