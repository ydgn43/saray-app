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

// Function to create or update a student's attendance status in the database
async function createOrUpdateAttendance(studentId, date, programName, attendanceType, sebep = null) {
  try {
    // First, check if the attendance record already exists using GET request with query parameters
    const checkResponse = await fetch(`http://localhost:3001/attendance?studentid=${studentId}&date=${date}&program_name=${programName}`);

    if (checkResponse.ok) {
      const attendanceData = await checkResponse.json();
      if (attendanceData) {
        // If attendance record exists, update it
        await fetch('http://localhost:3001/attendance/put', {
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
        await fetch('http://localhost:3001/attendance/create', {
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
      checkbox.addEventListener('change', function() {
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
  });
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
    // Check if attendance data exists for the selected date and program
    const response = await fetch(`http://localhost:3001/attendance/dailyprogram?date=${date}&program_name=${program}`);
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
    await fetch('http://localhost:3001/attendance/create', {
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
  attendanceData.forEach(record => {
    const row = document.querySelector(`tr[data-student-id="${record.studentid}"]`);
    if (row) {
      // Uncheck all attendance checkboxes first
      row.querySelectorAll('.form-check-input').forEach(checkbox => checkbox.checked = false);

      // Check the checkbox that matches the attendance status
      if (record.attendance_type_name) {
        const statusCheckbox = row.querySelector(`.form-check-input.${record.attendance_type_name.toLowerCase()}-checkbox`);
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

