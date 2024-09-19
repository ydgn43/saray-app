// script.js

// Load users from localStorage
function loadUsers() {
    let users = JSON.parse(localStorage.getItem('users')) || [];
    return users;
  }
  
  // Save users to localStorage
  function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
  }
  
  // Add a new user
  function addUser(firstName, lastName) {
    let users = loadUsers();
    users.push({ firstName, lastName });
    saveUsers(users);
  }
  
  // Remove a user by index
  function removeUser(index) {
    let users = loadUsers();
    if (index > -1 && index < users.length) {
      users.splice(index, 1);
      saveUsers(users);
    }
  }
  
  // Populate the user table in yoklama.html
  function populateUserTable() {
    let users = loadUsers();
    let tbody = document.querySelector('#userTableBody');
    tbody.innerHTML = '';
  
    users.forEach((user, index) => {
      let row = document.createElement('tr');
  
      row.innerHTML = `
        <th scope="row">${index + 1}</th>
        <td>${user.firstName}</td>
        <td>${user.lastName}</td>
        <td><input type="checkbox" class="form-check-input"></td>
        <td><input type="checkbox" class="form-check-input"></td>
        <td><input type="checkbox" class="form-check-input"></td>
        <td><input type="checkbox" class="form-check-input"></td>
        <td>
          <select class="form-select">
            <option selected>Sebep</option>
            <option value="1">Hasta</option>
            <option value="2">Rahatsiz</option>
            <option value="3">Yemekci</option>
            <option value="4">Kurs Disinda</option>
            <option value="5">Diger</option>
          </select>
        </td>
      `;
  
      tbody.appendChild(row);
    });
  }
  
  // Event listeners for ayarlar.html
  document.addEventListener('DOMContentLoaded', function() {
    // Add user form
    let addUserForm = document.getElementById('addUserForm');
    if (addUserForm) {
      addUserForm.addEventListener('submit', function(e) {
        e.preventDefault();
        let firstName = document.getElementById('firstName').value.trim();
        let lastName = document.getElementById('lastName').value.trim();
        if (firstName && lastName) {
          addUser(firstName, lastName);
          alert('Kullanıcı başarıyla eklendi!');
          addUserForm.reset();
        } else {
          alert('Lütfen isim ve soyisim giriniz.');
        }
      });
    }
  
    // Remove user form
    let removeUserForm = document.getElementById('removeUserForm');
    if (removeUserForm) {
      removeUserForm.addEventListener('submit', function(e) {
        e.preventDefault();
        let userIndex = parseInt(document.getElementById('userIndex').value.trim()) - 1;
        if (!isNaN(userIndex)) {
          removeUser(userIndex);
          alert('Kullanıcı başarıyla silindi!');
          removeUserForm.reset();
        } else {
          alert('Lütfen geçerli bir kullanıcı numarası giriniz.');
        }
      });
    }
  
    // Populate user table in yoklama.html
    if (document.getElementById('userTableBody')) {
      populateUserTable();
    }
  });
  