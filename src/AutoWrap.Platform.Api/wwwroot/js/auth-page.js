import { apiRequest, extractErrorMessage, getAuth, saveAuth, showToast } from "/js/api.js";

const tabLogin = document.getElementById("tab-login");
const tabRegister = document.getElementById("tab-register");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const authError = document.getElementById("auth-error");

if (getAuth()?.token) {
  window.location.href = "/platform.html";
}

function setActiveTab(type) {
  const loginActive = type === "login";
  tabLogin.classList.toggle("active", loginActive);
  tabRegister.classList.toggle("active", !loginActive);
  loginForm.classList.toggle("active", loginActive);
  registerForm.classList.toggle("active", !loginActive);
  authError.textContent = "";
}

tabLogin.addEventListener("click", () => setActiveTab("login"));
tabRegister.addEventListener("click", () => setActiveTab("register"));

loginForm.addEventListener("submit", async event => {
  event.preventDefault();
  authError.textContent = "";

  try {
    const data = await apiRequest("/api/auth/login", {
      method: "POST",
      body: {
        email: document.getElementById("login-email").value.trim(),
        password: document.getElementById("login-password").value
      }
    });

    saveAuth(data);
    showToast("Вы успешно вошли.");
    setTimeout(() => {
      window.location.href = "/platform.html";
    }, 250);
  } catch (error) {
    authError.textContent = extractErrorMessage(error.message || error);
  }
});

registerForm.addEventListener("submit", async event => {
  event.preventDefault();
  authError.textContent = "";

  try {
    const data = await apiRequest("/api/auth/register", {
      method: "POST",
      body: {
        fullName: document.getElementById("reg-name").value.trim(),
        email: document.getElementById("reg-email").value.trim(),
        password: document.getElementById("reg-password").value,
        role: Number(document.getElementById("reg-role").value)
      }
    });

    saveAuth(data);
    showToast("Регистрация прошла успешно.");
    setTimeout(() => {
      window.location.href = "/platform.html";
    }, 250);
  } catch (error) {
    authError.textContent = extractErrorMessage(error.message || error);
  }
});
