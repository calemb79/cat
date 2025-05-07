let loggedInUser = null;
let areOrdersVisible = false;
let areUsersVisible = false;
let selectedOrders = new Set();
let sortDirection = 1;

// Helper functions for notifications
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      ${type === 'success' ? 
        '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>' :
        type === 'error' ?
        '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>' :
        '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>'}
    </svg>
    ${message}
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('animate__animated', 'animate__fadeOut');
    setTimeout(() => notification.remove(), 500);
  }, 3000);
}

function login() {
  const username = document.getElementById("admin-login").value;
  const password = document.getElementById("admin-password").value;
  const loginBtn = document.querySelector('#login-section button');

  // Show loading state
  loginBtn.innerHTML = '<span class="loader"></span> Logowanie...';
  loginBtn.disabled = true;

  fetch("http://localhost:8000/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  })
    .then(res => {
      if (!res.ok) throw new Error("Błąd logowania");
      return res.json();
    })
    .then(data => {
      if (data.role !== "admin") {
        throw new Error("Tylko dla administratorów");
      }

      loggedInUser = data.username;
      
      // Animate login section out
      document.getElementById("login-section").classList.add('animate__animated', 'animate__fadeOut');
      
      setTimeout(() => {
        document.getElementById("login-section").style.display = "none";
        
        // Set admin name and animate panel in
        document.getElementById("admin-name").textContent = loggedInUser;
        document.getElementById("admin-panel").style.display = "block";
        document.getElementById("admin-panel").classList.add('animate__animated', 'animate__fadeIn');
        
        loadMenu();
        showNotification("Zalogowano pomyślnie", 'success');
      }, 500);
    })
    .catch(error => {
      showNotification(error.message, 'error');
      document.getElementById("login-section").classList.add('animate__animated', 'animate__shakeX');
      setTimeout(() => {
        document.getElementById("login-section").classList.remove('animate__animated', 'animate__shakeX');
      }, 1000);
    })
    .finally(() => {
      loginBtn.innerHTML = 'Zaloguj';
      loginBtn.disabled = false;
    });
}

// === User Management ===
function addUser() {
  const username = document.getElementById("new-username").value;
  const password = document.getElementById("new-password").value;
  const role = document.getElementById("new-role").value;
  const userCode = document.getElementById("new-user-code").value;

  fetch("http://localhost:8000/admin/add_user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      password,
      role,
      admin_username: loggedInUser,
      user_code: userCode
    })
  })
  .then(res => {
    if (!res.ok) {
      return res.json().then(data => {
        throw new Error(data.detail || "Użytkownik już istnieje");
      });
    }
    return res.json();
  })
  .then(data => {
    showNotification(data.msg || "Dodano użytkownika pomyślnie", 'success');
    fetchUsers();
    // Clear form
    document.getElementById("new-username").value = '';
    document.getElementById("new-password").value = '';
    document.getElementById("new-user-code").value = '';
  })
  .catch(error => {
    showNotification(error.message, 'error');
  });
}

function fetchUsers() {
  const container = document.getElementById("user-list");
  const refreshButton = document.querySelector('#user-list-section button'); // Dodaj id do sekcji w HTML
  
  // Jeśli użytkownicy są widoczni, ukryj ich
  if (areUsersVisible) {
    container.innerHTML = "";
    refreshButton.innerHTML = 'Pokaż użytkowników';
    areUsersVisible = false;
    return;
  }

  // Pokaż loader podczas ładowania
  container.innerHTML = '<div class="loader-container"><span class="loader"></span> Ładowanie użytkowników...</div>';
  refreshButton.innerHTML = '<span class="loader"></span> Ładowanie...';
  refreshButton.disabled = true;

  fetch(`http://localhost:8000/admin/users?admin_username=${loggedInUser}`)
    .then(res => res.json())
    .then(users => {
      container.innerHTML = "";

      // Sort button
      const sortButton = document.createElement("button");
      sortButton.className = 'ripple';
      sortButton.innerHTML = `Sortuj po nazwie ${sortDirection === 1 ? '▲' : '▼'}`;
      sortButton.onclick = () => {
        sortDirection *= -1;
        fetchUsers();
      };
      container.appendChild(sortButton);

      // Sorting
      users.sort((a, b) => {
        const nameA = a.username.toLowerCase();
        const nameB = b.username.toLowerCase();
        return nameA.localeCompare(nameB) * sortDirection;
      });

      // Table with additional user_code column
      const userTable = document.createElement("table");
      userTable.classList.add('animate__animated', 'animate__fadeIn');
      
      const header = document.createElement("tr");
      header.innerHTML = "<th>Nazwa użytkownika</th><th>Kod</th><th>Rola</th><th>Akcje</th>";
      userTable.appendChild(header);

      users.forEach(user => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td><b>${user.username}</b></td>
          <td>${user.user_code || 'Brak kodu'}</td>
          <td>${user.role}</td>
          <td>
            <button onclick="deleteUser('${user.username}')" class="ripple danger-btn">Usuń</button>
            <button onclick="changeRolePrompt('${user.username}')" class="ripple">Zmień rolę</button>
            <button onclick="changePasswordPrompt('${user.username}')" class="ripple">Zmień hasło</button>
          </td>
        `;
        userTable.appendChild(row);
      });

      container.appendChild(userTable);
      refreshButton.innerHTML = 'Ukryj użytkowników';
      areUsersVisible = true;
    })
    .catch(error => {
      showNotification("Błąd ładowania użytkowników", 'error');
      console.error("Error fetching users:", error);
      refreshButton.innerHTML = 'Pokaż użytkowników';
    })
    .finally(() => {
      refreshButton.disabled = false;
    });
}

function changeRolePrompt(username) {
  const newRole = prompt("Nowa rola (user/admin):", "user");
  if (!newRole) return;

  fetch(`http://localhost:8000/admin/update_role?username=${username}&new_role=${newRole}&admin_username=${loggedInUser}`, {
    method: "PUT"
  })
    .then(res => res.json())
    .then(data => {
      showNotification(data.msg, 'success');
      fetchUsers();
    })
    .catch(error => {
      showNotification("Błąd zmiany roli", 'error');
    });
}

function changePasswordPrompt(username) {
  const newPassword = prompt(`Nowe hasło dla ${username}:`);
  if (!newPassword) return;

  fetch(`http://localhost:8000/admin/change_password?username=${username}&new_password=${newPassword}&admin_username=${loggedInUser}`, {
    method: "PUT"
  })
    .then(res => res.json())
    .then(data => showNotification(data.msg, 'success'))
    .catch(() => showNotification("Błąd zmiany hasła", 'error'));
}

function deleteUser(username) {
  if (!confirm(`Czy na pewno chcesz usunąć użytkownika ${username}?`)) return;

  fetch(`http://localhost:8000/admin/delete_user?username=${username}&admin_username=${loggedInUser}`, {
    method: "DELETE"
  })
    .then(res => {
      if (!res.ok) {
        return res.json().then(data => {
          throw new Error(data.detail || "Błąd podczas usuwania użytkownika");
        });
      }
      return res.json();
    })
    .then(data => {
      showNotification(data.msg || "Użytkownik został usunięty", 'success');
      fetchUsers();
    })
    .catch(error => {
      showNotification(error.message, 'error');
    });
}

// === Menu Management ===
function addDish() {
  const name = document.getElementById("dish-name").value;
  const description = document.getElementById("dish-description").value;
  const price = parseFloat(document.getElementById("dish-price").value);

  if (!name || !description || isNaN(price)) {
    showNotification("Uzupełnij wszystkie pola", 'error');
    return;
  }

  fetch("http://localhost:8000/menu", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description, price, username: loggedInUser })
  })
    .then(res => res.json())
    .then(data => {
      showNotification(data.msg, 'success');
      loadMenu();
      // Clear form
      document.getElementById("dish-name").value = '';
      document.getElementById("dish-description").value = '';
      document.getElementById("dish-price").value = '';
    })
    .catch(() => showNotification("Błąd dodawania dania", 'error'));
}

function loadMenu() {
  const container = document.getElementById("menu-list");
  container.innerHTML = '<div class="loader-container"><span class="loader"></span> Ładowanie menu...</div>';

  fetch("http://localhost:8000/menu/list")
    .then(res => res.json())
    .then(menu => {
      container.innerHTML = "";

      const table = document.createElement("table");
      table.classList.add('animate__animated', 'animate__fadeIn');
      
      const header = document.createElement("tr");
      header.innerHTML = "<th>Nazwa</th><th>Opis</th><th>Cena</th><th>Akcje</th>";
      table.appendChild(header);

      menu.forEach(item => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${item.name}</td>
          <td>${item.description}</td>
          <td>${item.price.toFixed(2)} zł</td>
          <td><button onclick="deleteDish('${item.name}')" class="ripple danger-btn">Usuń</button></td>
        `;
        table.appendChild(row);
      });

      container.appendChild(table);
    })
    .catch(() => showNotification("Błąd ładowania menu", 'error'));
}

function deleteDish(name) {
  if (!confirm(`Czy na pewno chcesz usunąć "${name}"?`)) return;

  fetch("http://localhost:8000/menu/delete", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, username: loggedInUser })
  })
    .then(res => res.json())
    .then(data => {
      showNotification(data.msg, 'success');
      loadMenu();
    })
    .catch(() => showNotification("Błąd usuwania dania", 'error'));
}

// === Excel export ===
function fetchOrders() {
  const loadButton = document.getElementById("load-orders-button");
  const deleteSelectedBtn = document.getElementById("delete-selected-orders");
  const container = document.getElementById("order-list");
  
  loadButton.innerHTML = '<span class="loader"></span> Ładowanie...';
  loadButton.disabled = true;

  loadButton.innerHTML = '<span class="loader"></span> Ładowanie...';
  loadButton.disabled = true;
  deleteSelectedBtn.style.display = 'none';
  selectedOrders.clear();

  if (areOrdersVisible) {
    container.innerHTML = "";
    loadButton.innerHTML = 'Załaduj zamówienia';
    loadButton.disabled = false;
    areOrdersVisible = false;
    return;
  }

  fetch(`http://localhost:8000/admin/orders?admin_username=${encodeURIComponent(loggedInUser)}`)
    .then(async response => {
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Błąd serwera");
      }
      return response.json();
    })
    .then(orders => {
      container.innerHTML = "";

      if (!orders || orders.length === 0) {
        container.innerHTML = "<p>Brak zamówień.</p>";
        areOrdersVisible = true;
        loadButton.innerHTML = 'Ukryj zamówienia';
        loadButton.disabled = false;
        return;
      }

      fetch(`http://localhost:8000/admin/users?admin_username=${loggedInUser}`)
        .then(res => res.json())
        .then(users => {
          const userCodeMap = {};
          users.forEach(user => {
            userCodeMap[user.username] = user.user_code || 'Brak kodu';
          });

          const table = document.createElement("table");
          table.className = "orders-table";
          
          // Nagłówki tabeli
          const header = document.createElement("tr");
          header.innerHTML = `
            <th style="width: 30px;"><input type="checkbox" id="select-all-orders" onclick="toggleAllOrders(this)"></th>
            <th>Kod użytkownika</th>
            <th>Użytkownik</th>
            <th>Tydzień</th>
	    <th>Miejsce</th>
            <th>Dania</th>
            <th>Akcje</th>
          `;
          table.appendChild(header);

          // Wiersze z zamówieniami
          orders.forEach(order => {
            const row = document.createElement("tr");
            const orderId = order._id;
            
            // Formatowanie dań
            const meals = order.meals?.map(m => 
              `${m.day}: ${m.name} (${m.price.toFixed(2)} zł)`
            ).join("<br>") || "Brak dań";

            // Checkbox do wyboru
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.onchange = (e) => toggleOrderSelection(e, orderId);
            
            // Przycisk usuwania
            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "Usuń";
            deleteBtn.className = "delete-btn";
            deleteBtn.onclick = () => deleteOrder(orderId);

            row.innerHTML = `
              <td></td>
              <td>${userCodeMap[order.username] || 'Brak kodu'}</td>
              <td>${order.username}</td>
              <td>${order.week}</td>
	      <td>${order.date_range || 'Brak danych'}</td>
              <td>${meals}</td>
              <td></td>
            `;
            
            // Wstaw checkbox i przycisk
            row.cells[0].appendChild(checkbox);
            const actionCell = row.cells[6];
            actionCell.appendChild(deleteBtn);
            
            table.appendChild(row);
          });

          container.appendChild(table);
          areOrdersVisible = true;
          loadButton.innerHTML = 'Ukryj zamówienia';
          loadButton.disabled = false;
          deleteSelectedBtn.style.display = selectedOrders.size > 0 ? 'inline-block' : 'none';
        });
    })
    .catch(error => {
      console.error("Błąd:", error);
      showNotification(error.message, "error");
      loadButton.innerHTML = 'Załaduj zamówienia';
      loadButton.disabled = false;
    });
}

async function deleteOrder(orderId) {
  if (!orderId || orderId === "undefined") {
    showNotification("Błąd: Nieprawidłowe ID zamówienia", "error");
    return;
  }

  if (!confirm(`Czy na pewno chcesz usunąć to zamówienie?`)) return;

  try {
    const response = await fetch(`http://localhost:8000/admin/delete_order`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        order_id: orderId,
        admin_username: loggedInUser
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Nie udało się usunąć zamówienia");
    }

    const data = await response.json();
    showNotification(data.message || "Zamówienie zostało usunięte", "success");
    fetchOrders(); // Odśwież listę
  } catch (error) {
    console.error("Błąd:", error);
    showNotification(error.message, "error");
  }
}
// Add loader styles
const style = document.createElement('style');
style.textContent = `
  .loader {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 1s ease-in-out infinite;
    vertical-align: middle;
    margin-right: 8px;
  }
  
  .loader-container {
    text-align: center;
    padding: 20px;
    color: var(--gray);
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

async function downloadExcel() {
  const button = document.querySelector('.warning-btn');
  try {
    // Pokaż stan ładowania
    button.innerHTML = '<span class="loader"></span> Przygotowywanie raportu...';
    button.disabled = true;

    const response = await fetch(`http://localhost:8000/admin/orders/excel?admin_username=${encodeURIComponent(loggedInUser)}`);
    
    if (!response.ok) {
      throw new Error("Błąd podczas generowania raportu");
    }

    // Pobierz nazwę pliku z nagłówków
    const contentDisposition = response.headers.get('Content-Disposition');
    const filename = contentDisposition 
      ? contentDisposition.split('filename=')[1] 
      : `raport_zamowien_${new Date().toISOString().slice(0,10)}.xlsx`;

    // Konwertuj odpowiedź na blob
    const blob = await response.blob();
    
    // Utwórz link do pobrania
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Posprzątaj
    window.URL.revokeObjectURL(url);
    a.remove();
    
    showNotification("Raport został pobrany", "success");
  } catch (error) {
    console.error("Błąd pobierania raportu:", error);
    showNotification(error.message, "error");
  } finally {
    // Przywróć pierwotny stan przycisku
    button.innerHTML = 'Pobierz raport Excel';
    button.disabled = false;
  }
}

function toggleOrderSelection(event, orderId) {
  if (event.target.checked) {
    selectedOrders.add(orderId);
  } else {
    selectedOrders.delete(orderId);
  }
  
  // Aktualizuj przycisk "Usuń wybrane"
  const deleteSelectedBtn = document.getElementById("delete-selected-orders");
  deleteSelectedBtn.style.display = selectedOrders.size > 0 ? 'inline-block' : 'none';
  
  // Aktualizuj checkbox "Zaznacz wszystkie"
  const selectAll = document.getElementById("select-all-orders");
  if (selectAll) {
    selectAll.checked = false;
  }
}

function toggleAllOrders(checkbox) {
  const checkboxes = document.querySelectorAll('#order-list input[type="checkbox"]:not(#select-all-orders)');
  const deleteSelectedBtn = document.getElementById("delete-selected-orders");
  
  if (checkbox.checked) {
    checkboxes.forEach(cb => {
      cb.checked = true;
      const orderId = cb.getAttribute('data-order-id') || cb.closest('tr').getAttribute('data-order-id');
      if (orderId) selectedOrders.add(orderId);
    });
  } else {
    checkboxes.forEach(cb => {
      cb.checked = false;
      const orderId = cb.getAttribute('data-order-id') || cb.closest('tr').getAttribute('data-order-id');
      if (orderId) selectedOrders.delete(orderId);
    });
  }
  
  deleteSelectedBtn.style.display = checkbox.checked ? 'inline-block' : 'none';
}

async function deleteSelectedOrders() {
  if (selectedOrders.size === 0) return;
  
  if (!confirm(`Czy na pewno chcesz usunąć ${selectedOrders.size} wybranych zamówień?`)) return;

  const deleteSelectedBtn = document.getElementById("delete-selected-orders");
  deleteSelectedBtn.innerHTML = '<span class="loader"></span> Usuwanie...';
  deleteSelectedBtn.disabled = true;

  try {
    const response = await fetch(`http://localhost:8000/admin/delete_orders`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        order_ids: Array.from(selectedOrders),
        admin_username: loggedInUser
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Nie udało się usunąć zamówień");
    }

    const data = await response.json();
    showNotification(`Usunięto ${data.deleted_count} zamówień`, "success");
    selectedOrders.clear();
    fetchOrders(); // Odśwież listę
  } catch (error) {
    console.error("Błąd:", error);
    showNotification(error.message, "error");
  } finally {
    deleteSelectedBtn.innerHTML = 'Usuń wybrane';
    deleteSelectedBtn.disabled = false;
  }
}

async function downloadPDF() {
  const button = document.querySelector('.danger-btn');
  try {
    button.innerHTML = '<span class="loader"></span> Przygotowywanie PDF...';
    button.disabled = true;

    const response = await fetch(`http://localhost:8000/admin/orders/pdf?admin_username=${encodeURIComponent(loggedInUser)}`);
    
    if (!response.ok) {
      throw new Error("Błąd podczas generowania raportu PDF");
    }

    const contentDisposition = response.headers.get('Content-Disposition');
    const filename = contentDisposition 
      ? contentDisposition.split('filename=')[1] 
      : `raport_zamowien_${new Date().toISOString().slice(0,10)}.pdf`;

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    window.URL.revokeObjectURL(url);
    a.remove();
    
    showNotification("Raport PDF został pobrany", "success");
  } catch (error) {
    console.error("Błąd pobierania raportu PDF:", error);
    showNotification(error.message, "error");
  } finally {
    button.innerHTML = 'Pobierz raport PDF';
    button.disabled = false;
  }
}
async function downloadERP() {
  const button = document.querySelector('.ripple:not(.warning-btn):not(.success-btn)'); // Wybierz przycisk ERP
  try {
    // Pokaż stan ładowania
    button.innerHTML = '<span class="loader"></span> Przygotowywanie ERP...';
    button.disabled = true;

    const response = await fetch(`http://localhost:8000/admin/orders/erp?admin_username=${encodeURIComponent(loggedInUser)}`);
    
    if (!response.ok) {
      throw new Error("Błąd podczas generowania raportu ERP");
    }

    // Pobierz nazwę pliku z nagłówków
    const contentDisposition = response.headers.get('Content-Disposition');
    const filename = contentDisposition 
      ? contentDisposition.split('filename=')[1] 
      : `raport_erp_${new Date().toISOString().slice(0,10)}.csv`;

    // Konwertuj odpowiedź na blob
    const blob = await response.blob();
    
    // Utwórz link do pobrania
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Posprzątaj
    window.URL.revokeObjectURL(url);
    a.remove();
    
    showNotification("Raport ERP został pobrany", "success");
  } catch (error) {
    console.error("Błąd pobierania raportu ERP:", error);
    showNotification(error.message, "error");
  } finally {
    // Przywróć pierwotny stan przycisku
    button.innerHTML = 'Pobierz raport ERP';
    button.disabled = false;
  }
}

async function downloadDishesReport() {
  const button = document.querySelector('.accent-btn');
  try {
    // Pokaż stan ładowania
    button.innerHTML = '<span class="loader"></span> Przygotowywanie raportu...';
    button.disabled = true;

    const response = await fetch(`http://localhost:8000/admin/orders/dishes_report?admin_username=${encodeURIComponent(loggedInUser)}`);
    
    if (!response.ok) {
      throw new Error("Błąd podczas generowania raportu");
    }

    // Pobierz nazwę pliku z nagłówków
    const contentDisposition = response.headers.get('Content-Disposition');
    const filename = contentDisposition 
      ? contentDisposition.split('filename=')[1] 
      : `raport_dan_${new Date().toISOString().slice(0,10)}.xlsx`;

    // Konwertuj odpowiedź na blob
    const blob = await response.blob();
    
    // Utwórz link do pobrania
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Posprzątaj
    window.URL.revokeObjectURL(url);
    a.remove();
    
    showNotification("Raport dań został pobrany", "success");
  } catch (error) {
    console.error("Błąd pobierania raportu:", error);
    showNotification(error.message, "error");
  } finally {
    // Przywróć pierwotny stan przycisku
    button.innerHTML = 'Pobierz raport dań';
    button.disabled = false;
  }
}

function logout() {
  // Animacja wyjścia
  document.getElementById("admin-panel").classList.add('animate__animated', 'animate__fadeOut');
  
  setTimeout(() => {
    // Ukryj panel admina i pokaż sekcję logowania
    document.getElementById("admin-panel").style.display = "none";
    document.getElementById("login-section").style.display = "block";
    document.getElementById("login-section").classList.add('animate__animated', 'animate__fadeIn');
    
    // Wyczyść pola logowania
    document.getElementById("admin-login").value = "";
    document.getElementById("admin-password").value = "";
    
    // Zresetuj zalogowanego użytkownika
    loggedInUser = null;
    
    showNotification("Wylogowano pomyślnie", 'success');
  }, 500);
}

async function downloadWordMailMerge() {
  const button = document.querySelector('.accent-btn');
  try {
    button.innerHTML = '<span class="loader"></span> Przygotowywanie...';
    button.disabled = true;

    const response = await fetch(`http://localhost:8000/admin/orders/word_mailmerge?admin_username=${encodeURIComponent(loggedInUser)}`);
    
    if (!response.ok) {
      throw new Error("Błąd podczas generowania raportu");
    }

    const contentDisposition = response.headers.get('Content-Disposition');
    const filename = contentDisposition 
      ? contentDisposition.split('filename=')[1] 
      : `raport_korespondencja_${new Date().toISOString().slice(0,10)}.docx`;

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    window.URL.revokeObjectURL(url);
    a.remove();
    
    showNotification("Plik do korespondencji seryjnej został pobrany", "success");
  } catch (error) {
    console.error("Błąd pobierania:", error);
    showNotification(error.message, "error");
  } finally {
    button.innerHTML = 'Pobierz do Word (korespondencja)';
    button.disabled = false;
  }
}