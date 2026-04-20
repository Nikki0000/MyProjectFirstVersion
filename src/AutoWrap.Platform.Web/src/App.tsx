import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiRequest, clearAuth, getAuth, saveAuth } from "./api";
import type { AuthResponse, OrderStatus, OrderView, ProfileView } from "./types";

type TabId = "feed" | "create" | "my-created" | "my-responded" | "favorites" | "profile";
type StatusFilter = "" | OrderStatus;

const tabTitles: Record<TabId, string> = {
  feed: "Лента заказов",
  create: "Создать заказ",
  "my-created": "Мои заказы",
  "my-responded": "Мои отклики",
  favorites: "Избранное",
  profile: "Профиль"
};

const orderStatusLabels: Record<OrderStatus, string> = {
  Open: "Открыт",
  InProgress: "В работе",
  Completed: "Завершен",
  Cancelled: "Отменен"
};

function App() {
  const [auth, setAuth] = useState<AuthResponse | null>(() => getAuth());

  if (!auth) {
    return <AuthScreen onAuthenticated={setAuth} />;
  }

  return (
    <Dashboard
      auth={auth}
      onLogout={() => {
        clearAuth();
        setAuth(null);
      }}
    />
  );
}

interface AuthScreenProps {
  onAuthenticated: (auth: AuthResponse) => void;
}

function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<1 | 2>(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const title = mode === "login" ? "Войти в систему" : "Создать аккаунт";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const path = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload = mode === "login"
        ? {
            email: email.trim(),
            password
          }
        : {
            fullName: fullName.trim(),
            email: email.trim(),
            password,
            role
          };

      const response = await apiRequest<AuthResponse>(path, {
        method: "POST",
        body: payload
      });

      onAuthenticated(saveAuth(response));
    } catch (requestError) {
      setError(toErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-layout">
      <section className="brand-panel">
        <h1>AutoWrap</h1>
        <p>Платформа для владельцев авто, точек оклейки и рекламодателей.</p>
        <ul>
          <li>Публикация и поиск заказов</li>
          <li>Отклики, избранное, личный кабинет</li>
          <li>Ролевой доступ и прозрачная воронка</li>
        </ul>
      </section>

      <section className="auth-panel">
        <div className="tabs">
          <button
            className={mode === "login" ? "tab active" : "tab"}
            onClick={() => setMode("login")}
            type="button"
          >
            Вход
          </button>
          <button
            className={mode === "register" ? "tab active" : "tab"}
            onClick={() => setMode("register")}
            type="button"
          >
            Регистрация
          </button>
        </div>

        <form className="stack" onSubmit={submit}>
          <h2>{title}</h2>

          {mode === "register" && (
            <label>
              Имя
              <input
                type="text"
                placeholder="Иван Иванов"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
              />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label>
            Пароль
            <input
              type="password"
              placeholder="Минимум 6 символов"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {mode === "register" && (
            <label>
              Роль
              <select value={role} onChange={(event) => setRole(Number(event.target.value) as 1 | 2)}>
                <option value={1}>Заказчик</option>
                <option value={2}>Исполнитель</option>
              </select>
            </label>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Выполняю..." : mode === "login" ? "Войти" : "Зарегистрироваться"}
          </button>
        </form>

        <p className="hint">Демо: customer@demo.local / Demo123!</p>
        {error && <p className="error-text">{error}</p>}
      </section>
    </div>
  );
}

interface DashboardProps {
  auth: AuthResponse;
  onLogout: () => void;
}

function Dashboard({ auth, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>("feed");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [feedSearch, setFeedSearch] = useState("");
  const [feedStatus, setFeedStatus] = useState<StatusFilter>("");
  const [feedOrders, setFeedOrders] = useState<OrderView[]>([]);
  const [createdOrders, setCreatedOrders] = useState<OrderView[]>([]);
  const [respondedOrders, setRespondedOrders] = useState<OrderView[]>([]);
  const [favoriteOrders, setFavoriteOrders] = useState<OrderView[]>([]);
  const [profile, setProfile] = useState<ProfileView | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderView | null>(null);

  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createCity, setCreateCity] = useState("");
  const [createBudget, setCreateBudget] = useState("");
  const [createDate, setCreateDate] = useState("");

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(""), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    void loadCurrentTab(activeTab);
  }, [activeTab]);

  const pageTitle = useMemo(() => tabTitles[activeTab], [activeTab]);

  async function run(action: () => Promise<void>, withLoader = true) {
    setError("");
    if (withLoader) {
      setBusy(true);
    }

    try {
      await action();
    } catch (requestError) {
      const message = toErrorMessage(requestError);
      setError(message);
      setToast(message);
    } finally {
      if (withLoader) {
        setBusy(false);
      }
    }
  }

  async function loadCurrentTab(tab: TabId) {
    await run(async () => {
      if (tab === "feed") {
        await loadFeed();
        return;
      }

      if (tab === "my-created") {
        const data = await apiRequest<OrderView[]>("/api/me/created-orders", { authRequired: true });
        setCreatedOrders(data);
        return;
      }

      if (tab === "my-responded") {
        const data = await apiRequest<OrderView[]>("/api/me/responded-orders", { authRequired: true });
        setRespondedOrders(data);
        return;
      }

      if (tab === "favorites") {
        const data = await apiRequest<OrderView[]>("/api/me/favorites", { authRequired: true });
        setFavoriteOrders(data);
        return;
      }

      if (tab === "profile") {
        const data = await apiRequest<ProfileView>("/api/me/profile", { authRequired: true });
        setProfile(data);
      }
    });
  }

  async function loadFeed() {
    const query = new URLSearchParams();
    const search = feedSearch.trim();

    if (search) {
      query.set("query", search);
    }

    const statusCode = toStatusCode(feedStatus);
    if (statusCode !== null) {
      query.set("status", statusCode.toString());
    }

    const suffix = query.toString() ? `?${query.toString()}` : "";
    const data = await apiRequest<OrderView[]>(`/api/orders${suffix}`);
    setFeedOrders(data);
  }

  async function refreshFeed() {
    await run(loadFeed);
  }

  async function loadOrderDetails(id: string) {
    await run(async () => {
      const data = await apiRequest<OrderView>(`/api/orders/${id}`);
      setSelectedOrder(data);
    });
  }

  async function toggleFavorite(id: string, isFavorite: boolean) {
    await run(async () => {
      await apiRequest<void>(`/api/orders/${id}/favorite`, {
        method: isFavorite ? "DELETE" : "POST",
        authRequired: true
      });

      setToast(isFavorite ? "Удалено из избранного." : "Добавлено в избранное.");
      await loadCurrentTab(activeTab);
      if (activeTab !== "feed") {
        await loadFeed();
      }
    });
  }

  async function respondToOrder(id: string) {
    const message = window.prompt("Введите текст отклика");
    if (!message || !message.trim()) {
      return;
    }

    const proposedPriceRaw = window.prompt("Предложенная цена (необязательно)");
    const proposedPrice = proposedPriceRaw && proposedPriceRaw.trim()
      ? Number(proposedPriceRaw)
      : null;

    await run(async () => {
      await apiRequest<void>(`/api/orders/${id}/respond`, {
        method: "POST",
        authRequired: true,
        body: {
          message: message.trim(),
          proposedPrice
        }
      });

      setToast("Отклик отправлен.");
      await loadCurrentTab(activeTab);
      if (activeTab !== "feed") {
        await loadFeed();
      }
    });
  }

  async function createOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const budgetValue = Number(createBudget);
    await run(async () => {
      await apiRequest<OrderView>("/api/orders", {
        method: "POST",
        authRequired: true,
        body: {
          title: createTitle.trim(),
          description: createDescription.trim(),
          city: createCity.trim(),
          budget: budgetValue,
          plannedDate: createDate || null
        }
      });

      setCreateTitle("");
      setCreateDescription("");
      setCreateCity("");
      setCreateBudget("");
      setCreateDate("");
      setToast("Заказ опубликован.");
      setActiveTab("feed");
    });
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="logo">AutoWrap</div>
        {Object.keys(tabTitles).map((tab) => {
          const typedTab = tab as TabId;
          return (
            <button
              key={typedTab}
              type="button"
              className={typedTab === activeTab ? "menu-item active" : "menu-item"}
              onClick={() => setActiveTab(typedTab)}
            >
              {tabTitles[typedTab]}
            </button>
          );
        })}
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <h1>{pageTitle}</h1>
            <p className="muted">
              {auth.fullName} | {roleName(auth.role)} | {auth.email}
            </p>
          </div>
          <button className="secondary" type="button" onClick={onLogout}>
            Выйти
          </button>
        </header>

        {error && <div className="error-banner">{error}</div>}
        {busy && <div className="loading">Загружаю...</div>}

        {activeTab === "feed" && (
          <div className="stack">
            <div className="card filters">
              <input
                placeholder="Поиск по названию, городу, описанию"
                value={feedSearch}
                onChange={(event) => setFeedSearch(event.target.value)}
              />
              <select value={feedStatus} onChange={(event) => setFeedStatus(event.target.value as StatusFilter)}>
                <option value="">Все статусы</option>
                <option value="Open">Открыт</option>
                <option value="InProgress">В работе</option>
                <option value="Completed">Завершен</option>
                <option value="Cancelled">Отменен</option>
              </select>
              <button type="button" onClick={refreshFeed}>Обновить</button>
            </div>

            <OrderList
              items={feedOrders}
              withActions
              onDetails={loadOrderDetails}
              onFavorite={toggleFavorite}
              onRespond={respondToOrder}
            />

            {selectedOrder && (
              <div className="card">
                <h3>Детали заказа</h3>
                <pre>{JSON.stringify(selectedOrder, null, 2)}</pre>
              </div>
            )}
          </div>
        )}

        {activeTab === "create" && (
          <form className="card stack" onSubmit={createOrder}>
            <h2>Новый заказ</h2>
            <label>
              Заголовок
              <input value={createTitle} onChange={(event) => setCreateTitle(event.target.value)} required />
            </label>
            <label>
              Описание
              <textarea value={createDescription} onChange={(event) => setCreateDescription(event.target.value)} required />
            </label>
            <div className="grid-3">
              <label>
                Город
                <input value={createCity} onChange={(event) => setCreateCity(event.target.value)} required />
              </label>
              <label>
                Бюджет
                <input
                  type="number"
                  min={1}
                  value={createBudget}
                  onChange={(event) => setCreateBudget(event.target.value)}
                  required
                />
              </label>
              <label>
                Планируемая дата
                <input type="date" value={createDate} onChange={(event) => setCreateDate(event.target.value)} />
              </label>
            </div>
            <button type="submit">Опубликовать заказ</button>
          </form>
        )}

        {activeTab === "my-created" && (
          <OrderList
            items={createdOrders}
            withActions={false}
          />
        )}

        {activeTab === "my-responded" && (
          <OrderList
            items={respondedOrders}
            withActions={false}
          />
        )}

        {activeTab === "favorites" && (
          <OrderList
            items={favoriteOrders}
            withActions={false}
          />
        )}

        {activeTab === "profile" && (
          <div className="card">
            <h2>Профиль</h2>
            <pre>{profile ? JSON.stringify(profile, null, 2) : "Нет данных"}</pre>
          </div>
        )}
      </section>

      <div className={toast ? "toast show" : "toast"}>{toast}</div>
    </div>
  );
}

interface OrderListProps {
  items: OrderView[];
  withActions: boolean;
  onDetails?: (id: string) => void;
  onFavorite?: (id: string, isFavorite: boolean) => void;
  onRespond?: (id: string) => void;
}

function OrderList({ items, withActions, onDetails, onFavorite, onRespond }: OrderListProps) {
  if (!items.length) {
    return <div className="card">Пока нет данных.</div>;
  }

  return (
    <div className="order-grid">
      {items.map((order) => (
        <article className="card order-card" key={order.id}>
          <h3>{order.title}</h3>
          <p>{order.description}</p>
          <p className="meta">
            Город: {order.city} | Бюджет: {order.budget} | Статус: {orderStatusLabels[order.status]}
          </p>
          <p className="meta">
            Автор: {order.createdByName} | Откликов: {order.responsesCount}
          </p>

          {withActions && (
            <div className="actions">
              <button type="button" onClick={() => onDetails?.(order.id)}>Детали</button>
              <button type="button" onClick={() => onFavorite?.(order.id, order.isFavoritedByCurrentUser)}>
                {order.isFavoritedByCurrentUser ? "Убрать из избранного" : "В избранное"}
              </button>
              <button type="button" onClick={() => onRespond?.(order.id)}>Откликнуться</button>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

function roleName(role: AuthResponse["role"]): string {
  if (role === "Customer") return "Заказчик";
  if (role === "Wrapper") return "Исполнитель";
  if (role === "Admin") return "Администратор";
  return role;
}

function toStatusCode(status: StatusFilter): number | null {
  if (status === "Open") return 1;
  if (status === "InProgress") return 2;
  if (status === "Completed") return 3;
  if (status === "Cancelled") return 4;
  return null;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Произошла ошибка.";
}

export default App;
