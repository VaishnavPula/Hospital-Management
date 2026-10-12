/* =========================
   SIDEBAR
========================= */

let menuButton = document.getElementById("menu-button");
let closeButton = document.getElementById("close-sidebar");
let sidebar = document.getElementById("sidebar");
let overlay = document.getElementById("sidebar-overlay");


if (menuButton) {

    menuButton.addEventListener("click", function() {

        sidebar.classList.add("open");
        document.body.classList.add("sidebar-open");
        overlay.classList.add("show");

    });

}


if (closeButton) {

    closeButton.addEventListener("click", function() {

        sidebar.classList.remove("open");
        document.body.classList.remove("sidebar-open");
        overlay.classList.remove("show");

    });

}


if (overlay) {

    overlay.addEventListener("click", function() {

        sidebar.classList.remove("open");
        document.body.classList.remove("sidebar-open");
        overlay.classList.remove("show");

    });

}

/* =========================
   DARK THEME
========================= */

let themeButton = document.getElementById("theme-button");


/* Check saved theme when page opens */

if (localStorage.getItem("theme") == "dark") {

    document.body.classList.add("dark");

    if (themeButton) {
        themeButton.innerText = "☀️";
    }

}


/* Theme button */

if (themeButton) {

    themeButton.addEventListener("click", function() {

        if (document.body.classList.contains("dark")) {

            document.body.classList.remove("dark");

            localStorage.setItem("theme", "light");

            themeButton.innerText = "🌙";

        }
        else {

            document.body.classList.add("dark");

            localStorage.setItem("theme", "dark");

            themeButton.innerText = "☀️";

        }

    });

}


/* =========================
   COMMON FUNCTIONS
========================= */

function showMessage(message, good) {

    let box = document.getElementById("form-message");

    if (box) {

        box.innerText = message;

        if (good) {
            box.className = "success-text";
        }
        else {
            box.className = "error-text";
        }

    }
    else {

        alert(message);

    }
}


function getId() {

    let url = new URLSearchParams(window.location.search);

    return url.get("id");
}


function escapeText(value) {

    if (value == null) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================
   DASHBOARD
========================= */

let patientCount = document.getElementById("patient-count");

if (patientCount) {

    fetch("/api/dashboard")
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {

            document.getElementById("patient-count").innerText =
                data.patients;

            document.getElementById("doctor-count").innerText =
                data.doctors;

            document.getElementById("appointment-count").innerText =
                data.appointments;

            document.getElementById("bill-count").innerText =
                data.bills;

        });
}


/* =========================
   PATIENTS
========================= */

let patientsTable =
    document.getElementById("patients-table");


function loadPatients(search) {

    if (search == undefined) {
        search = "";
    }

    fetch("/api/patients?search=" + encodeURIComponent(search))
        .then(function(response) {
            return response.json();
        })
        .then(function(patients) {

            patientsTable.innerHTML = "";

            if (patients.length == 0) {

                patientsTable.innerHTML =
                    "<tr><td colspan='7'>No patients found.</td></tr>";

            }
            else {

                for (let i = 0; i < patients.length; i++) {

                    patientsTable.innerHTML +=
                        "<tr>" +

                        "<td>" +
                        escapeText(patients[i].patient_id) +
                        "</td>" +

                        "<td>" +
                        escapeText(patients[i].name) +
                        "</td>" +

                        "<td>" +
                        escapeText(patients[i].age) +
                        "</td>" +

                        "<td>" +
                        escapeText(patients[i].gender) +
                        "</td>" +

                        "<td>" +
                        escapeText(patients[i].phone) +
                        "</td>" +

                        "<td>" +
                        escapeText(patients[i].blood_group) +
                        "</td>" +

                        "<td>" +

                        "<a href='/add_patient.html?id=" +
                        patients[i].id +
                        "'>Edit</a> " +

                        "<button class='delete' " +
                        "onclick='deletePatient(" +
                        patients[i].id +
                        ")'>Delete</button>" +

                        "</td>" +

                        "</tr>";
                }
            }
        });
}


if (patientsTable) {

    loadPatients();

    let patientSearchForm =
        document.getElementById("patient-search-form");

    if (patientSearchForm) {

        patientSearchForm.addEventListener(
            "submit",
            function(event) {

                event.preventDefault();

                let search =
                    document.getElementById("patient-search").value;

                loadPatients(search);

            }
        );
    }
}


function deletePatient(id) {

    if (confirm("Delete this patient?")) {

        fetch("/api/patients/" + id, {
            method: "DELETE"
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {

            alert(data.message);

            loadPatients();

        });
    }
}


/* =========================
   PATIENT FORM
========================= */

let patientForm =
    document.getElementById("patient-form");

if (patientForm) {

    let id = getId();

    if (id) {

        document.getElementById("patient-form-title").innerText =
            "Edit Patient";

        fetch("/api/patients/" + id)
            .then(function(response) {
                return response.json();
            })
            .then(function(patient) {

                document.getElementById("name").value =
                    patient.name;

                document.getElementById("age").value =
                    patient.age;

                document.getElementById("gender").value =
                    patient.gender;

                document.getElementById("phone").value =
                    patient.phone;

                document.getElementById("email").value =
                    patient.email || "";

                document.getElementById("address").value =
                    patient.address || "";

                document.getElementById("blood_group").value =
                    patient.blood_group;

            });
    }


    patientForm.addEventListener("submit", function(event) {

        event.preventDefault();

        let data = {

            name: document.getElementById("name").value,

            age: document.getElementById("age").value,

            gender: document.getElementById("gender").value,

            phone: document.getElementById("phone").value,

            email: document.getElementById("email").value,

            address: document.getElementById("address").value,

            blood_group:
                document.getElementById("blood_group").value

        };


        let url;
        let method;


        if (id) {

            url = "/api/patients/" + id;
            method = "PUT";

        }
        else {

            url = "/api/patients";
            method = "POST";

        }


        fetch(url, {

            method: method,

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(data)

        })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {

            if (data.errors) {

                showMessage(
                    data.errors.join(" "),
                    false
                );

            }
            else {

                showMessage(
                    data.message,
                    true
                );

                setTimeout(function() {

                    window.location.href =
                        "/patients.html";

                }, 500);

            }

        });

    });
}


/* =========================
   DOCTORS
========================= */

let doctorsTable =
    document.getElementById("doctors-table");


function loadDoctors(search) {

    if (search == undefined) {
        search = "";
    }

    fetch("/api/doctors?search=" + encodeURIComponent(search))
        .then(function(response) {
            return response.json();
        })
        .then(function(doctors) {

            doctorsTable.innerHTML = "";

            if (doctors.length == 0) {

                doctorsTable.innerHTML =
                    "<tr><td colspan='7'>No doctors found.</td></tr>";

            }
            else {

                for (let i = 0; i < doctors.length; i++) {

                    doctorsTable.innerHTML +=

                        "<tr>" +

                        "<td>" +
                        escapeText(doctors[i].doctor_id) +
                        "</td>" +

                        "<td>" +
                        escapeText(doctors[i].name) +
                        "</td>" +

                        "<td>" +
                        escapeText(doctors[i].specialization) +
                        "</td>" +

                        "<td>" +
                        escapeText(doctors[i].phone) +
                        "</td>" +

                        "<td>" +
                        escapeText(doctors[i].email) +
                        "</td>" +

                        "<td>" +
                        escapeText(doctors[i].available_time) +
                        "</td>" +

                        "<td>" +

                        "<a href='/add_doctor.html?id=" +
                        doctors[i].id +
                        "'>Edit</a> " +

                        "<button class='delete' " +
                        "onclick='deleteDoctor(" +
                        doctors[i].id +
                        ")'>Delete</button>" +

                        "</td>" +

                        "</tr>";
                }
            }
        });
}


if (doctorsTable) {

    loadDoctors();

    let doctorSearchForm =
        document.getElementById("doctor-search-form");

    if (doctorSearchForm) {

        doctorSearchForm.addEventListener(
            "submit",
            function(event) {

                event.preventDefault();

                let search =
                    document.getElementById("doctor-search").value;

                loadDoctors(search);

            }
        );
    }
}


function deleteDoctor(id) {

    if (confirm("Delete this doctor?")) {

        fetch("/api/doctors/" + id, {
            method: "DELETE"
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {

            alert(data.message);

            loadDoctors();

        });
    }
}


/* =========================
   DOCTOR FORM
========================= */

let doctorForm =
    document.getElementById("doctor-form");


if (doctorForm) {

    let id = getId();

    if (id) {

        document.getElementById("doctor-form-title").innerText =
            "Edit Doctor";

        fetch("/api/doctors/" + id)
            .then(function(response) {
                return response.json();
            })
            .then(function(doctor) {

                document.getElementById("name").value =
                    doctor.name;

                document.getElementById("specialization").value =
                    doctor.specialization;

                document.getElementById("phone").value =
                    doctor.phone;

                document.getElementById("email").value =
                    doctor.email || "";

                document.getElementById("available_time").value =
                    doctor.available_time;

            });
    }


    doctorForm.addEventListener("submit", function(event) {

        event.preventDefault();

        let data = {

            name:
                document.getElementById("name").value,

            specialization:
                document.getElementById("specialization").value,

            phone:
                document.getElementById("phone").value,

            email:
                document.getElementById("email").value,

            available_time:
                document.getElementById("available_time").value

        };


        let url;
        let method;


        if (id) {

            url = "/api/doctors/" + id;
            method = "PUT";

        }
        else {

            url = "/api/doctors";
            method = "POST";

        }


        fetch(url, {

            method: method,

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(data)

        })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {

            if (data.errors) {

                showMessage(
                    data.errors.join(" "),
                    false
                );

            }
            else {

                showMessage(
                    data.message,
                    true
                );

                setTimeout(function() {

                    window.location.href =
                        "/doctors.html";

                }, 500);

            }

        });

    });
}


/* =========================
   APPOINTMENTS
========================= */

let appointmentsTable =
    document.getElementById("appointments-table");


function loadAppointments() {

    fetch("/api/appointments")
        .then(function(response) {
            return response.json();
        })
        .then(function(appointments) {

            appointmentsTable.innerHTML = "";

            if (appointments.length == 0) {

                appointmentsTable.innerHTML =
                    "<tr><td colspan='7'>No appointments found.</td></tr>";

            }
            else {

                for (let i = 0;
                     i < appointments.length;
                     i++) {

                    appointmentsTable.innerHTML +=

                        "<tr>" +

                        "<td>" +
                        escapeText(appointments[i].patient_name) +
                        "</td>" +

                        "<td>" +
                        escapeText(appointments[i].doctor_name) +
                        "</td>" +

                        "<td>" +
                        escapeText(appointments[i].appointment_date) +
                        "</td>" +

                        "<td>" +
                        escapeText(appointments[i].appointment_time) +
                        "</td>" +

                        "<td>" +
                        escapeText(appointments[i].reason) +
                        "</td>" +

                        "<td>" +
                        escapeText(appointments[i].status) +
                        "</td>" +

                        "<td>" +

                        "<a href='/add_appointment.html?id=" +
                        appointments[i].id +
                        "'>Edit</a> " +

                        "<button class='delete' " +
                        "onclick='deleteAppointment(" +
                        appointments[i].id +
                        ")'>Delete</button>" +

                        "</td>" +

                        "</tr>";
                }
            }
        });
}


if (appointmentsTable) {

    loadAppointments();

}


function deleteAppointment(id) {

    if (confirm("Delete this appointment?")) {

        fetch("/api/appointments/" + id, {
            method: "DELETE"
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {

            alert(data.message);

            loadAppointments();

        });
    }
}


/* =========================
   APPOINTMENT FORM
========================= */

let appointmentForm =
    document.getElementById("appointment-form");


if (appointmentForm) {

    let id = getId();


    fetch("/api/appointment-options")
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {

            let patientSelect =
                document.getElementById("patient_id");

            let doctorSelect =
                document.getElementById("doctor_id");

            let statusSelect =
                document.getElementById("status");


            patientSelect.innerHTML =
                "<option value=''>Select patient</option>";

            doctorSelect.innerHTML =
                "<option value=''>Select doctor</option>";

            statusSelect.innerHTML = "";


            for (let i = 0;
                 i < data.patients.length;
                 i++) {

                patientSelect.innerHTML +=

                    "<option value='" +
                    data.patients[i].id +
                    "'>" +

                    escapeText(data.patients[i].patient_id) +
                    " - " +
                    escapeText(data.patients[i].name) +

                    "</option>";

            }


            for (let i = 0;
                 i < data.doctors.length;
                 i++) {

                doctorSelect.innerHTML +=

                    "<option value='" +
                    data.doctors[i].id +
                    "'>" +

                    escapeText(data.doctors[i].doctor_id) +
                    " - " +
                    escapeText(data.doctors[i].name) +

                    "</option>";

            }


            for (let i = 0;
                 i < data.statuses.length;
                 i++) {

                statusSelect.innerHTML +=

                    "<option value='" +
                    data.statuses[i] +
                    "'>" +
                    data.statuses[i] +
                    "</option>";

            }


            if (id) {

                document.getElementById(
                    "appointment-form-title"
                ).innerText = "Edit Appointment";


                fetch("/api/appointments/" + id)
                    .then(function(response) {
                        return response.json();
                    })
                    .then(function(appointment) {

                        patientSelect.value =
                            appointment.patient_id;

                        doctorSelect.value =
                            appointment.doctor_id;

                        document.getElementById(
                            "appointment_date"
                        ).value =
                            appointment.appointment_date;

                        document.getElementById(
                            "appointment_time"
                        ).value =
                            appointment.appointment_time;

                        document.getElementById(
                            "reason"
                        ).value =
                            appointment.reason;

                        statusSelect.value =
                            appointment.status;

                    });
            }

        });


    appointmentForm.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            let data = {

                patient_id:
                    document.getElementById("patient_id").value,

                doctor_id:
                    document.getElementById("doctor_id").value,

                appointment_date:
                    document.getElementById("appointment_date").value,

                appointment_time:
                    document.getElementById("appointment_time").value,

                reason:
                    document.getElementById("reason").value,

                status:
                    document.getElementById("status").value

            };


            let url;
            let method;


            if (id) {

                url = "/api/appointments/" + id;
                method = "PUT";

            }
            else {

                url = "/api/appointments";
                method = "POST";

            }


            fetch(url, {

                method: method,

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(data)

            })
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {

                if (data.errors) {

                    showMessage(
                        data.errors.join(" "),
                        false
                    );

                }
                else {

                    showMessage(
                        data.message,
                        true
                    );

                    setTimeout(function() {

                        window.location.href =
                            "/appointments.html";

                    }, 500);

                }

            });

        }
    );
}


/* =========================
   BILLING
========================= */

let billingTable =
    document.getElementById("billing-table");


function loadBills() {

    fetch("/api/bills")
        .then(function(response) {
            return response.json();
        })
        .then(function(bills) {

            billingTable.innerHTML = "";

            if (bills.length == 0) {

                billingTable.innerHTML =
                    "<tr><td colspan='7'>No bills found.</td></tr>";

            }
            else {

                for (let i = 0;
                     i < bills.length;
                     i++) {

                    let payButton = "";


                    if (bills[i].payment_status != "Paid") {

                        payButton =
                            "<button onclick='payBill(" +
                            bills[i].id +
                            ")'>Mark Paid</button>";

                    }


                    billingTable.innerHTML +=

                        "<tr>" +

                        "<td>" +
                        escapeText(bills[i].patient_name) +
                        "</td>" +

                        "<td>₹" +
                        Number(
                            bills[i].consultation_fee
                        ).toFixed(2) +
                        "</td>" +

                        "<td>₹" +
                        Number(
                            bills[i].other_charges
                        ).toFixed(2) +
                        "</td>" +

                        "<td>₹" +
                        Number(
                            bills[i].total_amount
                        ).toFixed(2) +
                        "</td>" +

                        "<td>" +
                        escapeText(
                            bills[i].payment_status
                        ) +
                        "</td>" +

                        "<td>" +
                        escapeText(
                            bills[i].bill_date
                        ) +
                        "</td>" +

                        "<td>" +

                        payButton +

                        " " +

                        "<button class='delete' " +
                        "onclick='deleteBill(" +
                        bills[i].id +
                        ")'>Delete</button>" +

                        "</td>" +

                        "</tr>";

                }
            }

        });
}


if (billingTable) {

    loadBills();

}


function payBill(id) {

    fetch("/api/bills/" + id + "/pay", {
        method: "PUT"
    })
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {

        alert(data.message);

        loadBills();

    });
}


function deleteBill(id) {

    if (confirm("Delete this bill?")) {

        fetch("/api/bills/" + id, {
            method: "DELETE"
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {

            alert(data.message);

            loadBills();

        });
    }
}


/* =========================
   BILL FORM
========================= */

let billForm =
    document.getElementById("bill-form");


if (billForm) {

    fetch("/api/bill-options")
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {

            let patientSelect =
                document.getElementById("patient_id");

            let statusSelect =
                document.getElementById("payment_status");


            patientSelect.innerHTML =
                "<option value=''>Select patient</option>";

            statusSelect.innerHTML = "";


            for (let i = 0;
                 i < data.patients.length;
                 i++) {

                patientSelect.innerHTML +=

                    "<option value='" +
                    data.patients[i].id +
                    "'>" +

                    escapeText(
                        data.patients[i].patient_id
                    ) +

                    " - " +

                    escapeText(
                        data.patients[i].name
                    ) +

                    "</option>";

            }


            for (let i = 0;
                 i < data.statuses.length;
                 i++) {

                statusSelect.innerHTML +=

                    "<option value='" +
                    data.statuses[i] +
                    "'>" +

                    data.statuses[i] +

                    "</option>";

            }

        });


    billForm.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            let data = {

                patient_id:
                    document.getElementById("patient_id").value,

                consultation_fee:
                    document.getElementById(
                        "consultation_fee"
                    ).value,

                other_charges:
                    document.getElementById(
                        "other_charges"
                    ).value,

                payment_status:
                    document.getElementById(
                        "payment_status"
                    ).value

            };


            fetch("/api/bills", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(data)

            })
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {

                if (data.errors) {

                    showMessage(
                        data.errors.join(" "),
                        false
                    );

                }
                else {

                    showMessage(
                        data.message,
                        true
                    );

                    setTimeout(function() {

                        window.location.href =
                            "/billing.html";

                    }, 500);

                }

            });

        }
    );
}