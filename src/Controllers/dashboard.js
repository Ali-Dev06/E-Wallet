import finduserbymail, { persistDatabase, getUserByName } from "../Models/database.js";

// ===================== DOM =====================
let username = JSON.parse(sessionStorage.getItem("Currentuser"));

// Synchroniser avec databaseUsers au chargement
const dbUsersOnLoad = JSON.parse(sessionStorage.getItem("databaseUsers"));
if (dbUsersOnLoad && Array.isArray(dbUsersOnLoad)) {
    const updated = dbUsersOnLoad.find(function(u) { return u.id === username.id; });
    if (updated) username = updated;
}

const greetings         = document.getElementById("greetingName");
const soldedispo        = document.getElementById("availableBalance");
const Revenue           = document.getElementById("monthlyIncome");
const Depenses          = document.getElementById("monthlyExpenses");
const activeCardsEl     = document.getElementById("activeCards");
const Trasnfer          = document.getElementById("quickTransfer");
const transfSection     = document.getElementById("transfer-section");
const submitTransferBtn = document.getElementById("submitTransferBtn");
const FermeBtn          = document.getElementById("closeTransferBtn");
const AnnulerrBtn       = document.getElementById("cancelTransferBtn");
const beneficiarySelect = document.getElementById("beneficiary");
const sourceCardSelect  = document.getElementById("sourceCard");
const logoutBtn         = document.getElementById("logoutBtn");

// ===================== AFFICHAGE =====================

greetings.textContent  = username.name;
soldedispo.textContent = username.wallet.balance + " " + username.wallet.currency;

const Dtransactions = username.wallet.transactions.filter(function(t) { return t.type === "debit"; });
const Ctransactions = username.wallet.transactions.filter(function(t) { return t.type === "credit"; });

const totalRevenue  = Ctransactions.reduce(function(total, t) { return total + t.amount; }, 0);
const totalDepenses = Dtransactions.reduce(function(total, t) { return total + t.amount; }, 0);

Revenue.textContent  = totalRevenue  + " " + username.wallet.currency;
Depenses.textContent = totalDepenses + " " + username.wallet.currency;

activeCardsEl.textContent = username.wallet.cards.length;

// ===================== PEUPLER LES SELECTS =====================

const allUsers = JSON.parse(sessionStorage.getItem("allUsers"));

const autresUsers = allUsers.filter(function(user) {
    return user.name !== username.name;
});

autresUsers.forEach(function(user) {
    const option = document.createElement("option");
    option.value = user.name;
    option.textContent = user.name;
    beneficiarySelect.appendChild(option);
});

username.wallet.cards.forEach(function(card) {
    const option = document.createElement("option");
    option.value = card.numcards;
    option.textContent = card.type + " - " + card.numcards;
    sourceCardSelect.appendChild(option);
});

// ===================== OUVERTURE / FERMETURE TRANSFERT =====================

Trasnfer.addEventListener("click", function() {
    transfSection.classList.remove("hidden");
});

FermeBtn.addEventListener("click", function() {
    transfSection.classList.add("hidden");
});

AnnulerrBtn.addEventListener("click", function() {
    transfSection.classList.add("hidden");
});

// ===================== DECONNEXION =====================

logoutBtn.addEventListener("click", function() {
    sessionStorage.removeItem("Currentuser");
    sessionStorage.removeItem("allUsers");
    document.location.href = "login.html";
});

// ===================== LOGIQUE TRANSFERT =====================

submitTransferBtn.addEventListener("click", function(e) {
    e.preventDefault();

    const amount = parseFloat(document.getElementById("amount").value);
    const beneficiaryName = document.getElementById("beneficiary").value;

    verifierSolde(amount, function() {
        verifierBeneficiaire(beneficiaryName, function(beneficiaire) {
            creerTransactions(amount, beneficiaire, function(sender) { // ✅ receive sender
                updateDashboard(amount, beneficiaire, sender);          // ✅ pass sender
                transfSection.classList.add("hidden");
                alert("Transfert de " + amount + " MAD effectué avec succès vers " + beneficiaire.name + " !");
            });
        });
    });
});

// ========== ETAPE 1 ==========
function verifierSolde(amount, callback) {
    if (!amount || amount <= 0) {
        alert("Veuillez entrer un montant valide !");
        return;
    }
    if (username.wallet.balance < amount) {
        alert("Solde insuffisant ! Votre solde est de " + username.wallet.balance + " " + username.wallet.currency);
        return;
    }
    console.log("Etape 1 : Solde suffisant");
    callback();
}

// ========== ETAPE 2 ==========
function verifierBeneficiaire(beneficiaryName, callback) {
    if (!beneficiaryName || beneficiaryName === "") {
        alert("Veuillez choisir un bénéficiaire !");
        return;
    }
    getUserByName(beneficiaryName, function(beneficiaire) {
        if (!beneficiaire) {
            alert("Bénéficiaire introuvable !");
            return;
        }
        if (beneficiaire.name === username.name) {
            alert("Vous ne pouvez pas vous transférer à vous-même !");
            return;
        }
        console.log("Etape 2 : Bénéficiaire trouvé → " + beneficiaire.name);
        callback(beneficiaire);
    });
}

// ========== ETAPE 3 ==========
function creerTransactions(amount, beneficiaire, callback) {
    const now   = new Date();
    const day   = now.getDate();
    const month = now.getMonth() + 1;
    const year  = String(now.getFullYear()).slice(2);
    const date  = day + "-" + month + "-" + year;

    // ✅ Find sender as direct reference inside database.users
    getUserByName(username.name, function(sender) {

        const newDebit = {
            id:     String(sender.wallet.transactions.length + 1),
            type:   "debit",
            amount: amount,
            date:   date,
            from:   sender.wallet.cards[0].numcards,
            to:     beneficiaire.name
        };

        const newCredit = {
            id:     String(beneficiaire.wallet.transactions.length + 1),
            type:   "credit",
            amount: amount,
            date:   date,
            from:   sender.name,
            to:     beneficiaire.wallet.cards[0].numcards
        };

        sender.wallet.transactions.push(newDebit);
        beneficiaire.wallet.transactions.push(newCredit);

        console.log("Etape 3 : Transactions créées");
        callback(sender); // ✅ pass sender to etape 4
    });
}

// ========== ETAPE 4 ==========
function updateDashboard(amount, beneficiaire, sender) { // ✅ receive sender
    // ✅ sender is a direct reference to database.users — modifying it updates database.users
    sender.wallet.balance    -= amount;
    beneficiaire.wallet.balance += amount;

    // ✅ Now persistDatabase correctly saves Ali's updated balance
    persistDatabase();

    // Update username and sessionStorage for display
    username.wallet.balance = sender.wallet.balance;
    username.wallet.transactions = sender.wallet.transactions;
    sessionStorage.setItem("Currentuser", JSON.stringify(username));

    soldedispo.textContent = username.wallet.balance + " " + username.wallet.currency;

    const Dt = sender.wallet.transactions.filter(function(t) { return t.type === "debit"; });
    const Ct = sender.wallet.transactions.filter(function(t) { return t.type === "credit"; });
    Depenses.textContent = Dt.reduce(function(total, t) { return total + t.amount; }, 0) + " " + username.wallet.currency;
    Revenue.textContent  = Ct.reduce(function(total, t) { return total + t.amount; }, 0) + " " + username.wallet.currency;

    console.log("Etape 4 : Dashboard mis à jour → " + sender.wallet.balance + " MAD");
}