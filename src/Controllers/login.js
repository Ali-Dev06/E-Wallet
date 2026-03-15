import finduserbymail, { getAllUsers } from "../Models/database.js";

const mailinput = document.getElementById("mail");
const passinput = document.getElementById("password");
const submitbtn = document.getElementById("submitbtn");

submitbtn.addEventListener("click", function traitement() {
    const mail = mailinput.value;
    const password = passinput.value;
    console.log("clicking");
    submitbtn.textContent = "Loading...";

    if (mail == "" || password == "") {
        alert("please take time to fill the form");
        submitbtn.textContent = "Se connecter";
    } else {
        let user = finduserbymail(mail, password);

        if (user) {
            // ✅ Récupérer la version mise à jour depuis databaseUsers
            const dbUsers = JSON.parse(sessionStorage.getItem("databaseUsers"));
            if (dbUsers && Array.isArray(dbUsers)) {
                const updated = dbUsers.find(function(u) {
                    return u.id === user.id;
                });
                if (updated) {
                    user = updated;
                }
            }

            sessionStorage.setItem("Currentuser", JSON.stringify(user));
            sessionStorage.setItem("allUsers", JSON.stringify(getAllUsers()));

            submitbtn.textContent = "Logging In...";
            setTimeout(() => {
                document.location.href = "dashboard.html";
            }, 1000);
        } else {
            alert("Bad credentials");
            submitbtn.textContent = "Se connecter";
        }
    }
});