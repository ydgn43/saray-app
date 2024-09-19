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
  
  // Load attendance data from localStorage
  function loadAttendance() {
    let attendance = JSON.parse(localStorage.getItem('attendance')) || {};
    return attendance;
  }
  
  // Save attendance data to localStorage
  function saveAttendance(attendance) {
    localStorage.setItem('attendance', JSON.stringify(attendance));
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
    let attendance = loadAttendance();
    let tbody = document.querySelector('#userTableBody');
    tbody.innerHTML = '';
  
    users.forEach((user, index) => {
      let row = document.createElement('tr');
  
      // Get attendance data for the user
      let userAttendance = attendance[user.firstName + ' ' + user.lastName] || {};
  
      row.innerHTML = `
        <th scope="row">${index + 1}</th>
        <td>${user.firstName}</td>
        <td>${user.lastName}</td>
        <td><input type="checkbox" class="form-check-input var-checkbox" ${userAttendance.status === 'Var' ? 'checked' : ''}></td>
        <td><input type="checkbox" class="form-check-input gec-checkbox" ${userAttendance.status === 'Gec' ? 'checked' : ''}></td>
        <td><input type="checkbox" class="form-check-input yok-checkbox" ${userAttendance.status === 'Yok' ? 'checked' : ''}></td>
        <td><input type="checkbox" class="form-check-input izinli-checkbox" ${userAttendance.status === 'Izinli' ? 'checked' : ''}></td>
        <td>
          <select class="form-select sebep-select">
            <option value="" ${!userAttendance.sebep ? 'selected' : ''}>Sebep</option>
            <option value="Hasta" ${userAttendance.sebep === 'Hasta' ? 'selected' : ''}>Hasta</option>
            <option value="Rahatsiz" ${userAttendance.sebep === 'Rahatsiz' ? 'selected' : ''}>Rahatsiz</option>
            <option value="Yemekci" ${userAttendance.sebep === 'Yemekci' ? 'selected' : ''}>Yemekci</option>
            <option value="Kurs Disinda" ${userAttendance.sebep === 'Kurs Disinda' ? 'selected' : ''}>Kurs Disinda</option>
            <option value="Diger" ${userAttendance.sebep === 'Diger' ? 'selected' : ''}>Diger</option>
          </select>
        </td>
      `;
  
      tbody.appendChild(row);
  
      // Add event listeners to ensure only one status checkbox is checked at a time
      let varCheckbox = row.querySelector('.var-checkbox');
      let gecCheckbox = row.querySelector('.gec-checkbox');
      let yokCheckbox = row.querySelector('.yok-checkbox');
      let izinliCheckbox = row.querySelector('.izinli-checkbox');
  
      function uncheckOthers(selectedCheckbox) {
        [varCheckbox, gecCheckbox, yokCheckbox, izinliCheckbox].forEach(checkbox => {
          if (checkbox !== selectedCheckbox) {
            checkbox.checked = false;
          }
        });
      }
  
      [varCheckbox, gecCheckbox, yokCheckbox, izinliCheckbox].forEach(checkbox => {
        checkbox.addEventListener('change', function() {
          if (this.checked) {
            uncheckOthers(this);
          }
        });
      });
    });
  }
  
  // Function to save attendance data
  function saveAttendanceData() {
    let users = loadUsers();
    let attendance = loadAttendance(); // Load existing attendance data
  
    let tbody = document.querySelector('#userTableBody');
    let rows = tbody.querySelectorAll('tr');
  
    rows.forEach((row, index) => {
      let user = users[index];
      let varCheckbox = row.querySelector('.var-checkbox');
      let gecCheckbox = row.querySelector('.gec-checkbox');
      let yokCheckbox = row.querySelector('.yok-checkbox');
      let izinliCheckbox = row.querySelector('.izinli-checkbox');
      let sebepSelect = row.querySelector('.sebep-select');
  
      let status = '';
      if (varCheckbox.checked) status = 'Var';
      else if (gecCheckbox.checked) status = 'Gec';
      else if (yokCheckbox.checked) status = 'Yok';
      else if (izinliCheckbox.checked) status = 'Izinli';
  
      let sebep = sebepSelect.value !== '' ? sebepSelect.value : null;
  
      let userKey = user.firstName + ' ' + user.lastName;
  
      // Initialize the user's attendance array if not already present
      if (!attendance[userKey]) {
        attendance[userKey] = [];
      }
  
      // Add the new attendance record for this session
      attendance[userKey].push({
        status: status,
        sebep: sebep
      });
    });
  
    saveAttendance(attendance);
  }
  
  // Function to update percentage table
  function updatePercentageTable() {
    let users = loadUsers();
    let attendance = loadAttendance();
  
    let percentageTbody = document.querySelector('#percentageTableBody');
    percentageTbody.innerHTML = '';
  
    users.forEach((user, index) => {
      let userKey = user.firstName + ' ' + user.lastName;
      let records = attendance[userKey] || [];
      let total = records.length;
      let presentCount = records.filter(record => record.status === 'Var' || record.status === 'Gec').length;
      let percentage = total > 0 ? ((presentCount / total) * 100).toFixed(2) : '0.00';
  
      let row = document.createElement('tr');
      row.innerHTML = `
        <th scope="row">${index + 1}</th>
        <td>${userKey}</td>
        <td>${percentage}%</td>
      `;
  
      // Set row class based on percentage
      if (percentage >= 90) {
        row.classList.add('table-success');
      } else if (percentage >= 70) {
        row.classList.add('table-warning');
      } else {
        row.classList.add('table-danger');
      }
  
      percentageTbody.appendChild(row);
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
  
      // Add event listener to Save button
      let saveButton = document.getElementById('saveButton');
      if (saveButton) {
        saveButton.addEventListener('click', function() {
          saveAttendanceData();
          updatePercentageTable();
          alert('Yoklama kaydedildi ve yüzdelikler güncellendi!');
        });
      }
  
      // Update the percentage table on page load
      updatePercentageTable();
    }
  });
  