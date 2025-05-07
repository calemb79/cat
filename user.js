document.addEventListener('DOMContentLoaded', function() {
  // Inicjalizacja przycisków
  document.getElementById('login-btn').addEventListener('click', login);
  document.getElementById('logout-btn').addEventListener('click', logout);
  document.getElementById('submit-order-btn').addEventListener('click', submitOrder);
  document.getElementById('toggle-history').addEventListener('click', toggleHistory);

  // Inicjalizacja zmiennych
  let loggedInUser = "";
  let userOrders = [];
  let isHistoryVisible = false;
  
  // Główne funkcje
  async function login() {
    const login = document.getElementById("login").value;
    const password = document.getElementById("password").value;

    const loginBtn = document.getElementById('login-btn');
    loginBtn.innerHTML = '<span class="loader"></span> Logowanie...';
    loginBtn.disabled = true;

    try {
      // Symulacja odpowiedzi serwera - w rzeczywistości należy użyć prawdziwego endpointu
      // const res = await fetch("http://localhost:8000/login", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ username: login, password: password })
      // });
      
      // Symulacja pomyślnego logowania
      await new Promise(resolve => setTimeout(resolve, 1000));
      const data = { username: login, user_code: "EMP123" };
      
      loggedInUser = data.username;
      
      document.getElementById("login-section").classList.add('animate__animated', 'animate__fadeOut');
      setTimeout(() => {
        document.getElementById("login-section").style.display = "none";
        
        document.getElementById("user-name").textContent = loggedInUser;
        document.getElementById("user-id").textContent = data.user_code || 'Brak kodu';
        
        document.getElementById("user-panel").style.display = "block";
        document.getElementById("user-panel").classList.add('animate__animated', 'animate__zoomIn');
        
        document.getElementById("logout-btn").style.display = "flex";
        
        loadMenu();
        loadOrderHistory();
      }, 300);
    } catch (error) {
      document.getElementById("login-section").classList.add('animate__animated', 'animate__shakeX');
      setTimeout(() => {
        document.getElementById("login-section").classList.remove('animate__animated', 'animate__shakeX');
      }, 1000);
      
      alert(error.message || "Błędny login lub hasło");
    } finally {
      loginBtn.innerHTML = 'Zaloguj';
      loginBtn.disabled = false;
    }
  }

  async function loadOrderHistory() {
    try {
      // Symulacja ładowania historii
      await new Promise(resolve => setTimeout(resolve, 500));
      userOrders = [
        {
          week: "2025-W20",
          date_range: "H7",
          meals: [
            { day: "Poniedziałek", name: "Schabowy", price: "12.50" },
            { day: "Wtorek", name: "Pierogi", price: "10.00" }
          ]
        }
      ];
      updateOrderSummary();
    } catch (error) {
      console.error("Błąd ładowania historii:", error);
    }
  }

  function updateOrderSummary() {
    const summaryElement = document.getElementById("order-summary");
    const deductionInfo = document.getElementById("deduction-info");
    let total = 0;
    
    userOrders.forEach(order => {
      order.meals.forEach(meal => {
        total += parseFloat(meal.price);
      });
    });
    
    summaryElement.classList.add('animate__animated', 'animate__pulse');
    setTimeout(() => {
      summaryElement.classList.remove('animate__animated', 'animate__pulse');
    }, 1000);
    
    summaryElement.textContent = `Suma tygodniowych zamówień: ${total.toFixed(2)} zł`;
    
    if (total > 50) {
      const difference = total - 50;
      deductionInfo.textContent = `Przekroczenie dofinansowania o: ${difference.toFixed(2)} zł`;
      deductionInfo.style.display = "block";
      deductionInfo.classList.add('animate__animated', 'animate__pulse');
    } else {
      deductionInfo.style.display = "none";
      deductionInfo.classList.remove('animate__animated', 'animate__pulse');
    }
  }

  function updateOrderPreview() {
    const selects = document.querySelectorAll("#menu-container select");
    let total = 0;
    let hasSelection = false;
    
    selects.forEach(select => {
      if (select.value) {
        const { price } = JSON.parse(select.value);
        total += parseFloat(price);
        hasSelection = true;
      }
    });
    
    const preview = document.getElementById("order-preview");
    preview.textContent = `Suma zamówienia: ${total.toFixed(2)} zł`;
    
    if (hasSelection) {
      preview.classList.add('visible');
    } else {
      preview.classList.remove('visible');
    }
    
    preview.classList.add('animate__animated', 'animate__pulse');
    setTimeout(() => {
      preview.classList.remove('animate__animated', 'animate__pulse');
    }, 500);
  }

  async function loadMenu() {
    try {
      // Symulacja ładowania menu
      await new Promise(resolve => setTimeout(resolve, 500));
      const menuItems = [
        { name: "Schabowy z ziemniakami", price: 12.50 },
        { name: "Pierogi ruskie", price: 10.00 },
        { name: "Kurczak curry", price: 11.00 },
        { name: "Wegetariańska sałatka", price: 9.50 }
      ];

      const days = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek"];
      const container = document.getElementById("menu-container");
      container.innerHTML = "";

      days.forEach((day, index) => {
        const groupDiv = document.createElement("div");
        groupDiv.classList.add('menu-group', 'animate__animated', 'animate__fadeInUp');
        groupDiv.style.animationDelay = `${index * 0.1}s`;

        const label = document.createElement("label");
        label.textContent = `${day}:`;

        const select = document.createElement("select");
        select.name = day;
        select.classList.add('ripple');
        select.addEventListener('change', updateOrderPreview);

        const defaultOption = document.createElement("option");
        defaultOption.text = "Wybierz danie";
        defaultOption.value = "";
        select.appendChild(defaultOption);

        menuItems.forEach(item => {
          const option = document.createElement("option");
          option.value = JSON.stringify({ name: item.name, price: item.price });
          option.text = `${item.name} (${item.price.toFixed(2)} zł)`;
          select.appendChild(option);
        });

        groupDiv.appendChild(label);
        groupDiv.appendChild(select);
        container.appendChild(groupDiv);
      });
      
      updateOrderPreview();
    } catch (error) {
      console.error("Błąd ładowania menu:", error);
    }
  }

  async function submitOrder() {
    const week = document.getElementById("order-week").value;
    const deliveryLocation = document.getElementById("delivery-location").value;
    const selects = document.querySelectorAll("#menu-container select");

    if (!week) {
      showError("Proszę wybrać tydzień zamówienia!");
      return;
    }
    
    if (!deliveryLocation) {
      showError("Proszę wybrać miejsce dostawy!");
      return;
    }

    const meals = {};
    let hasMeals = false;

    selects.forEach(select => {
      if (select.value) {
        const { name, price } = JSON.parse(select.value);
        meals[select.name] = [{ name, price }];
        hasMeals = true;
      }
    });

    if (!hasMeals) {
      showError("Proszę wybrać przynajmniej jedno danie!");
      return;
    }

    const submitBtn = document.getElementById('submit-order-btn');
    submitBtn.innerHTML = '<span class="loader"></span> Przetwarzanie...';
    submitBtn.disabled = true;

    try {
      // Symulacja wysłania zamówienia
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      showSuccess("Zamówienie złożone pomyślnie!");
      loadOrderHistory();
      
      // Reset formularza
      document.getElementById('order-week').value = '';
      document.getElementById('delivery-location').value = '';
      selects.forEach(select => {
        select.value = '';
        select.classList.add('animate__animated', 'animate__flash');
        setTimeout(() => {
          select.classList.remove('animate__animated', 'animate__flash');
        }, 1000);
      });
      
      updateOrderPreview();
    } catch (error) {
      showError(error.message || "Nie udało się złożyć zamówienia");
    } finally {
      submitBtn.innerHTML = 'Złóż zamówienie';
      submitBtn.disabled = false;
    }
  }

  function toggleHistory() {
    const button = document.getElementById("toggle-history");
    const container = document.getElementById("order-history");

    button.innerHTML = '<span class="loader"></span> Ładowanie...';
    button.disabled = true;

    setTimeout(() => {
      if (!isHistoryVisible) {
        container.innerHTML = "";
        
        userOrders.forEach((order, index) => {
          const div = document.createElement("div");
          div.classList.add('order-item', 'animate__animated', 'animate__fadeIn');
          div.style.animationDelay = `${index * 0.1}s`;
          div.innerHTML = `
            <div class="order-header">
              <strong>Tydzień:</strong> ${order.week} (${order.date_range})
            </div>
            <div class="order-meals">
              <strong>Pozycje:</strong>
              <ul>
                ${order.meals.map(meal => `<li>${meal.day}: ${meal.name} (${meal.price} zł)</li>`).join("")}
              </ul>
            </div>
            <hr>
          `;
          container.appendChild(div);
        });

        container.classList.add('show');
        button.textContent = "Ukryj historię";
        isHistoryVisible = true;
      } else {
        container.classList.remove('show');
        button.textContent = "Pokaż historię";
        isHistoryVisible = false;
      }
      
      button.disabled = false;
      button.innerHTML = isHistoryVisible ? "Ukryj historię" : "Pokaż historię";
    }, 500);
  }

  function logout() {
    document.getElementById("user-panel").classList.add('animate__animated', 'animate__fadeOut');
    document.getElementById("logout-btn").classList.add('animate__animated', 'animate__fadeOut');
    
    setTimeout(() => {
      loggedInUser = "";
      isHistoryVisible = false;
      userOrders = [];
      
      document.getElementById("login-section").style.display = "block";
      document.getElementById("login-section").classList.add('animate__animated', 'animate__fadeIn');
      document.getElementById("user-panel").style.display = "none";
      document.getElementById("user-panel").classList.remove('animate__animated', 'animate__fadeOut');
      document.getElementById("logout-btn").style.display = "none";
      
      document.getElementById("login").value = "";
      document.getElementById("password").value = "";
      
      document.getElementById("user-name").textContent = "";
      document.getElementById("menu-container").innerHTML = "";
      document.getElementById("order-history").innerHTML = "";
      document.getElementById("order-summary").textContent = "Suma zamówień: 0.00 zł";
      document.getElementById("deduction-info").style.display = "none";
    }, 500);
  }

  function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message animate__animated animate__fadeIn';
    errorDiv.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
      ${message}
    `;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      errorDiv.classList.add('animate__fadeOut');
      setTimeout(() => errorDiv.remove(), 500);
    }, 3000);
  }

  function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message animate__animated animate__fadeIn';
    successDiv.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      ${message}
    `;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
      successDiv.classList.add('animate__fadeOut');
      setTimeout(() => successDiv.remove(), 500);
    }, 3000);
  }
});