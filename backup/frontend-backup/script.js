// Load users from the database
async function loadUsers() {
  try {
    const response = await fetch('http://192.168.50.238:3001/student'); // Update with the correct endpoint
    const users = await response.json();
    return users;
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

// Function to create or update a student's attendance status in the database
async function createOrUpdateAttendance(studentId, date, programName, attendanceType, sebep = null) {
  try {
    // First, check if the attendance record already exists using GET request with query parameters
    const checkResponse = await fetch(`http://192.168.50.238:3001/attendance?studentid=${studentId}&date=${date}&program_name=${programName}`);

    if (checkResponse.ok) {
      const attendanceData = await checkResponse.json();
      if (attendanceData) {
        // If attendance record exists, update it
        await fetch('http://192.168.50.238:3001/attendance/put', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            studentid: studentId,
            date: date,
            program_name: programName,
            attendance_type_name: attendanceType,
            sebep: sebep,
          }),
        });
        console.log('Attendance updated successfully');
      } else {
        // If attendance record does not exist, create it
        await fetch('http://192.168.50.238:3001/attendance/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            studentid: studentId,
            date: date,
            program_name: programName,
            attendance_type_name: attendanceType,
            sebep: sebep,
          }),
        });
        console.log('Attendance created successfully');
      }
    } else {
      throw new Error('Failed to check attendance record existence');
    }
  } catch (error) {
    console.error('Error creating or updating attendance:', error);
    alert('Failed to create or update attendance');
  }
}

// Populate the user table with all students
async function populateUserTable(attendanceData = []) {
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
      <td><input type="checkbox" class="form-check-input var-checkbox"></td>
      <td><input type="checkbox" class="form-check-input gec-checkbox"></td>
      <td><input type="checkbox" class="form-check-input yok-checkbox"></td>
      <td><input type="checkbox" class="form-check-input izinli-checkbox"></td>
      <td class="reason-cell"></td>
    `;

    tbody.appendChild(row);

    // Add event listeners to ensure only one status checkbox is checked at a time
    const varCheckbox = row.querySelector('.var-checkbox');
    const gecCheckbox = row.querySelector('.gec-checkbox');
    const yokCheckbox = row.querySelector('.yok-checkbox');
    const izinliCheckbox = row.querySelector('.izinli-checkbox');

    function uncheckOthers(selectedCheckbox) {
      [varCheckbox, gecCheckbox, yokCheckbox, izinliCheckbox].forEach(checkbox => {
        if (checkbox !== selectedCheckbox) {
          checkbox.checked = false;
        }
      });
    }

    // Attach the uncheckOthers function and save to database when a checkbox changes
    [varCheckbox, gecCheckbox, yokCheckbox, izinliCheckbox].forEach(checkbox => {
      checkbox.addEventListener('change', function () {
        if (this.checked) {
          uncheckOthers(this);

          let attendanceType = '';
          if (varCheckbox.checked) attendanceType = 'Var';
          else if (gecCheckbox.checked) attendanceType = 'Gec';
          else if (yokCheckbox.checked) attendanceType = 'Yok';
          else if (izinliCheckbox.checked) attendanceType = 'Izinli';

          const date = document.getElementById('attendanceDate').value;
          const programName = document.getElementById('programSelect').value;

          // Create or update the attendance in the database
          createOrUpdateAttendance(user.studentid, date, programName, attendanceType);
        }
      });
    });

    // Update the row with attendance data if available
    const attendanceRecord = attendanceData.find(record => record.studentid === user.studentid);
    if (attendanceRecord) {
      if (attendanceRecord.attendance_type_name) {
        const statusCheckbox = row.querySelector(`.form-check-input.${attendanceRecord.attendance_type_name.toLowerCase()}-checkbox`);
        if (statusCheckbox) {
          statusCheckbox.checked = true;
        }
      }
      const reasonCell = row.querySelector('.reason-cell');
      reasonCell.textContent = attendanceRecord.sebep || '';
    }
  });

  // Add sorting functionality to table headers
  document.querySelectorAll('th').forEach(header => {
    header.classList.add('sortable-header'); // Add class to visually indicate sortable columns
    header.addEventListener('click', () => {
      const column = header.cellIndex;
      const rows = Array.from(tbody.querySelectorAll('tr'));
      let sortedRows;
      if (header.dataset.sorted === 'asc') {
        sortedRows = rows.sort((a, b) => {
          const aText = a.children[column].textContent.trim().toLowerCase();
          const bText = b.children[column].textContent.trim().toLowerCase();
          return bText.localeCompare(aText);
        });
        header.dataset.sorted = 'desc';
      } else {
        sortedRows = rows.sort((a, b) => {
          const aText = a.children[column].textContent.trim().toLowerCase();
          const bText = b.children[column].textContent.trim().toLowerCase();
          return aText.localeCompare(bText);
        });
        header.dataset.sorted = 'asc';
      }
      tbody.innerHTML = '';
      sortedRows.forEach(row => tbody.appendChild(row));
    });
  });

  // Add sorting functionality for checkboxes
  ['var-checkbox', 'gec-checkbox', 'yok-checkbox', 'izinli-checkbox'].forEach((className, index) => {
    const header = document.querySelectorAll('th')[index + 4];
    header.addEventListener('click', () => {
      const rows = Array.from(tbody.querySelectorAll('tr'));
      let sortedRows;
      if (header.dataset.sorted === 'asc') {
        sortedRows = rows.sort((a, b) => {
          const aChecked = a.querySelector(`.${className}`).checked;
          const bChecked = b.querySelector(`.${className}`).checked;
          return bChecked - aChecked;
        });
        header.dataset.sorted = 'desc';
      } else {
        sortedRows = rows.sort((a, b) => {
          const aChecked = a.querySelector(`.${className}`).checked;
          const bChecked = b.querySelector(`.${className}`).checked;
          return aChecked - bChecked;
        });
        header.dataset.sorted = 'asc';
      }
      tbody.innerHTML = '';
      sortedRows.forEach(row => tbody.appendChild(row));
    });
  });
}

// Function to display attendance data by updating only relevant rows
function displayAttendance(attendanceData) {
  populateUserTable(attendanceData); // Populate the table with all students and attendance data
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
    // Hide the "Create Attendance" button
    document.getElementById('createAttendanceButton').style.display = 'none';

    // Check if attendance data exists for the selected date and program
    const response = await fetch(`http://192.168.50.238:3001/attendance/dailyprogram?date=${date}&program_name=${program}`);
    const attendanceData = await response.json();

    // If attendance data exists, update the existing user table
    if (attendanceData.length > 0) {
      displayAttendance(attendanceData); // Update only attendance cells
    } else {
      // If no attendance data exists, show the "Create Attendance" button
      document.getElementById('createAttendanceButton').style.display = 'block';
      document.getElementById('userTableBody').innerHTML = ''; // Clear the table
    }
  } catch (error) {
    console.error("Error fetching attendance data:", error);
  }
});

// Event listener for "Create Attendance" button
document.getElementById('createAttendanceButton').addEventListener('click', async () => {
  const date = document.getElementById('attendanceDate').value;
  const program = document.getElementById('programSelect').value;

  if (!date || !program) {
    alert("Please select both a date and a program.");
    return;
  }

  try {
    // Create new attendance entries for all students for the selected date
    const users = await loadUsers();
    const newAttendanceData = users.map(user => ({
      studentid: user.studentid,
      date: date,
      program_name: program,
      attendance_type_name: '', // Default to no status selected
    }));

    // Send new attendance data to the server using the '/create' endpoint
    await fetch('http://192.168.50.238:3001/attendance/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newAttendanceData),
    });

    alert('New attendance created successfully');
    document.getElementById('createAttendanceButton').style.display = 'none'; // Hide the button after use
    populateUserTable(); // Populate the table with all students
  } catch (error) {
    console.error("Error creating new attendance:", error);
    alert('Failed to create attendance');
  }
});

// Function to display attendance data by updating only relevant rows
function displayAttendance(attendanceData) {
  populateUserTable(attendanceData); // Populate the table with all students and attendance data
}

// Event listeners for DOMContentLoaded
document.addEventListener('DOMContentLoaded', function () {
  // Populate user table with all students initially
  populateUserTable();

  // Set the date input field to the current date
  const dateInput = document.getElementById('attendanceDate');
  if (dateInput) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const dd = String(today.getDate()).padStart(2, '0');
    dateInput.value = `${yyyy}-${mm}-${dd}`;
  }

  // Hide the "Create Attendance" button when the date or program is changed
  const dateField = document.getElementById('attendanceDate');
  const programField = document.getElementById('programSelect');
  if (dateField && programField) {
    dateField.addEventListener('change', () => {
      document.getElementById('createAttendanceButton').style.display = 'none';
    });
    programField.addEventListener('change', () => {
      document.getElementById('createAttendanceButton').style.display = 'none';
    });
  }

  // Save attendance data and update percentage table on Save button click
  const saveButton = document.getElementById('saveButton');
  if (saveButton) {
    saveButton.addEventListener('click', function () {
      saveAttendanceData();
      alert('Attendance saved successfully');
    });
  }
});
