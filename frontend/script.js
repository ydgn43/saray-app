// script.js

// Load users from the database
async function loadUsers() {
  try {
      const response = await fetch('http://localhost:3001/student'); // Update with the correct endpoint
      const users = await response.json();
      return users;
  } catch (error) {
      console.error("Error fetching users:", error);
      return [];
  }
}

// Populate the user table with all students
async function populateUserTable() {
  const users = await loadUsers();
  let tbody = document.querySelector('#userTableBody');
  tbody.innerHTML = '';

  users.forEach((user, index) => {
      let row = document.createElement('tr');
      row.dataset.studentId = user.studentid; // Set student ID as data attribute for easy lookup

      row.innerHTML = `
          <th scope="row">${index + 1}</th>
          <td>${user.class_name}</td>
          <td>${user.first_name}</td>
          <td>${user.last_name}</td>
          <td><input type="checkbox" class="form-check-input var-checkbox" disabled></td>
          <td><input type="checkbox" class="form-check-input gec-checkbox" disabled></td>
          <td><input type="checkbox" class="form-check-input yok-checkbox" disabled></td>
          <td><input type="checkbox" class="form-check-input izinli-checkbox" disabled></td>
          <td class="reason-cell"></td>
      `;

      tbody.appendChild(row);
  });
}

// Display attendance data by updating only relevant rows
function displayAttendance(attendanceData) {
  attendanceData.forEach(record => {
      const row = document.querySelector(`tr[data-student-id="${record.studentid}"]`);
      if (row) {
          // Uncheck all attendance checkboxes first
          row.querySelectorAll('.form-check-input').forEach(checkbox => checkbox.checked = false);

          // Check the checkbox that matches the attendance status
          if (record.status) {
              const statusCheckbox = row.querySelector(`.form-check-input.${record.status.toLowerCase()}-checkbox`);
              if (statusCheckbox) {
                  statusCheckbox.checked = true;
              }
          }

          // Update the reason cell
          const reasonCell = row.querySelector('.reason-cell');
          reasonCell.textContent = record.sebep || '';
      }
  });
}

async function request(
  url,      // Endpoint to be appended to the base URL
  method = "GET", // HTTP method (GET, POST, etc.)
  data = null     // Data to be sent in the request body (for POST, PUT)
) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (data) { 
    options.body = JSON.stringify(data);
  }

  const baseUrl = "http://localhost:3001"; // Set your base URL here
  const response = await fetch(`${baseUrl}/${url}`, options);

  if (!response.ok) {
    throw new Error(`Error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}


// Function to fetch attendance data based on date and program
document.getElementById('attendanceFilterForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const date = document.getElementById('attendanceDate').value;
  const program = document.getElementById('programSelect').value;

  if (!date || !program) {
      alert("Please select both a date and a program.");
      return;
  }

  try {
    // Use the request function with query parameters for GET requests
    const attendanceData = await request(
      `attendance/dailyprogram`,
      "GET",
      { date: date, 
        program_name: program }
    );
    displayAttendance(attendanceData); // Update only attendance cells
  } catch (error) {
    console.error("Error fetching attendance data:", error);
  }
});

// Function to save attendance data
async function saveAttendanceData() {
  const users = await loadUsers();
  let tbody = document.querySelector('#userTableBody');
  let rows = tbody.querySelectorAll('tr');

  const attendanceData = Array.from(rows).map(row => {
      let studentId = row.dataset.studentId;
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

      return {
          studentid: studentId,
          status,
          sebep: sebepSelect ? sebepSelect.value : null,
      };
  });

  try {
      await fetch('http://localhost:3001/attendance', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(attendanceData),
      });
      alert('Attendance saved successfully');
  } catch (error) {
      console.error("Error saving attendance:", error);
      alert('Failed to save attendance');
  }
}

// Function to update the percentage table
function updatePercentageTable() {
  let attendance = loadAttendance();
  let percentageTbody = document.querySelector('#percentageTableBody');
  percentageTbody.innerHTML = '';

  attendance.forEach((user, index) => {
      let records = user.records || [];
      let total = records.length;
      let presentCount = records.filter(record => record.status === 'Var' || record.status === 'Gec').length;
      let percentage = total > 0 ? ((presentCount / total) * 100).toFixed(2) : '0.00';

      let row = document.createElement('tr');
      row.innerHTML = `
          <th scope="row">${index + 1}</th>
          <td>${user.firstName} ${user.lastName}</td>
          <td>${percentage}%</td>
      `;

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

// Event listeners for DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
  // Populate user table with all students initially
  populateUserTable();

  // Save attendance data and update percentage table on Save button click
  const saveButton = document.getElementById('saveButton');
  if (saveButton) {
      saveButton.addEventListener('click', function() {
          saveAttendanceData();
          updatePercentageTable();
          alert('Attendance saved and percentages updated!');
      });
  }

  // Update percentage table on page load
  updatePercentageTable();
});
