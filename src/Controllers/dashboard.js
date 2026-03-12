import finduserbymail from "../Models/database.js";


// Recuperer Dom
const username = JSON.parse(sessionStorage.getItem("Currentuser"));

const greetings = document.getElementById("greetingName");

const soldedispo = document.getElementById("availableBalance");

const Revenue = document.getElementById("monthlyIncome");

const Depenses = document.getElementById("monthlyExpenses");

const activeCardsEl = document.getElementById("activeCards");

const Trasnfer = document.getElementById("quickTransfer");

const transfSection = document.getElementById("transfer-section");


const submitTransferBtn = document.getElementById("submitTransferBtn");


const FermeBtn = document.getElementById("closeTransferBtn");
const AnnulerrBtn = document.getElementById("cancelTransferBtn");


// Afficher le nom de l'utilisateur
greetings.textContent = username.name;

// Afficher le solde disponible
soldedispo.textContent = username.wallet.balance + " " + username.wallet.currency;

// Filtrer les transactions debit / credit
const Dtransactions = username.wallet.transactions.filter((t) => t.type === "debit");
const Ctransactions = username.wallet.transactions.filter((t) => t.type === "credit");

// Calculer revenus et dépenses
const totalRevenue = Ctransactions.reduce((total, t) => total + t.amount, 0);
const totalDepenses = Dtransactions.reduce((total, t) => total + t.amount, 0);

// Afficher revenus et dépenses
Revenue.textContent = totalRevenue + " " + username.wallet.currency;
Depenses.textContent = totalDepenses + " " + username.wallet.currency;

//  Cartes actives (expiry >= aujourd'hui)
const today = new Date();

const activeCards = username.wallet.cards.filter(card => {
    const [day, month, year] = card.expiry.split("-");
    const expiryDate = new Date(`20${year}`, month - 1, day);
    return expiryDate >= today;
});

activeCardsEl.textContent = activeCards.length;

// Transfert (Afficher section de transfert - c.a.d en enleve la "hidden" );
Trasnfer.addEventListener("click", Handlertransfer);

function Handlertransfer() {
    transfSection.classList.remove("hidden");
}

FermeBtn.addEventListener("click", function() {
    transfSection.classList.add("hidden");
});

AnnulerrBtn.addEventListener("click", function() {
    transfSection.classList.add("hidden");
});




submitTransferBtn.addEventListener("click", function(e) {
    e.preventDefault();

    const amount = parseFloat(document.getElementById("amount").value);
    const beneficiaryName = document.getElementById("beneficiary").value;

    // Callbacks imbriquées
    verifierSolde(amount, function() {
        verifierBeneficiaire(beneficiaryName, function(beneficiaire) {
            creerTransactions(amount, beneficiaire, function() {
                updateDashboard(amount, beneficiaire);
                transfSection.classList.add("hidden");
                alert(" Transfert de " + amount + " MAD Success  " + beneficiaire.name + " !");
            });
        });
    });
});

// ========== ETAPE 1 ==========
function verifierSolde(amount, callback) {
    if (!amount || amount <= 0) {
        alert(" Veuillez entrer un montant valide !");
        return;
    }
    if (username.wallet.balance < amount) {
        alert(" Solde insuffisant ! Votre solde est de " + username.wallet.balance + " " + username.wallet.currency);
        return;
    }
    console.log(" Etape 1 : Solde suffisant");
    callback();
}

// ========== ETAPE 2 ==========
function verifierBeneficiaire(beneficiaryName, callback) {
    if (!beneficiaryName || beneficiaryName === "") {
        alert(" Veuillez choisir un bénéficiaire !");
        return;
    }
    const allUsers = JSON.parse(sessionStorage.getItem("allUsers"));
    const beneficiaire = allUsers.find(u => u.name === beneficiaryName);

    if (!beneficiaire) {
        alert(" Bénéficiaire introuvable !");
        return;
    }
    if (beneficiaire.name === username.name) {
        alert("Vous ne pouvez pas vous transférer à vous-même !");
        return;
    }
    console.log("✅ Etape 2 : Bénéficiaire trouvé → " + beneficiaire.name);
    callback(beneficiaire);
}

// ========== ETAPE 3 ==========
function creerTransactions(amount, beneficiaire, callback) {

    // Construction manuelle de la date DD-MM-YY
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth() + 1;   // getMonth() commence à 0
    const year = String(now.getFullYear()).slice(2); // 2026 → "26"
    const date = day + "-" + month + "-" + year;    // "12-3-26"

    const newDebit = {
        id: String(username.wallet.transactions.length + 1),
        type: "debit",
        amount: amount,
        date: date,
        from: username.wallet.cards[0].numcards,
        to: beneficiaire.name
    };

    const newCredit = {
        id: String(beneficiaire.wallet.transactions.length + 1),
        type: "credit",
        amount: amount,
        date: date,
        from: username.name,
        to: beneficiaire.wallet.cards[0].numcards
    };

    username.wallet.transactions.push(newDebit);
    beneficiaire.wallet.transactions.push(newCredit);

    console.log("✅ Etape 3 : Transactions créées");
    callback();
}

// ========== ETAPE 4 ==========
function updateDashboard(amount, beneficiaire) {
    username.wallet.balance -= amount;
    beneficiaire.wallet.balance += amount;

    // Sauvegarder dans sessionStorage
    sessionStorage.setItem("Currentuser", JSON.stringify(username));

    // Update l'affichage HTML
    soldedispo.textContent = username.wallet.balance + " " + username.wallet.currency;

    const Dt = username.wallet.transactions.filter(t => t.type === "debit");
    const Ct = username.wallet.transactions.filter(t => t.type === "credit");
    Depenses.textContent = Dt.reduce((total, t) => total + t.amount, 0) + " " + username.wallet.currency;
    Revenue.textContent  = Ct.reduce((total, t) => total + t.amount, 0) + " " + username.wallet.currency;

    console.log(" Etape 4 : Dashboard mis à jour");
    console.log("   → Nouveau solde " + username.name + " : " + username.wallet.balance + " MAD");
}


const beneficiarySelect = document.getElementById("beneficiary");
const sourceCardSelect = document.getElementById("sourceCard");





// Bénéficiaires   SAUF l'utilisateur connecté 
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

// Cartes source : cartes ACTIVES 
activeCards.forEach(function(card) {
    const option = document.createElement("option");
    option.value = card.numcards;
    option.textContent = card.type + " - " + card.numcards;
    sourceCardSelect.appendChild(option);
});


// Dans les déclarations DOM en haut
const logoutBtn = document.getElementById("logoutBtn");

// Logique déconnexion
logoutBtn.addEventListener("click", function() {
    sessionStorage.removeItem("Currentuser");
    sessionStorage.removeItem("allUsers");
    document.location.href = "login.html";
});