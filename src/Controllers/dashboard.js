import finduserbymail, { SaveBD, getUserByName } from "../Models/database.js";

let username = JSON.parse(sessionStorage.getItem("Currentuser"));

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
const recentTransactionsList= document.getElementById("recentTransactionsList");


greetings.textContent  = username.name;
soldedispo.textContent = username.wallet.balance + " " + username.wallet.currency;

const Dtransactions = username.wallet.transactions.filter(function(t) { return t.type === "debit"; });
const Ctransactions = username.wallet.transactions.filter(function(t) { return t.type === "credit"; });

const totalRevenue  = Ctransactions.reduce(function(total, t) { return total + t.amount; }, 0);
const totalDepenses = Dtransactions.reduce(function(total, t) { return total + t.amount; }, 0);

Revenue.textContent  = totalRevenue  + " " + username.wallet.currency;
Depenses.textContent = totalDepenses + " " + username.wallet.currency;

activeCardsEl.textContent = username.wallet.cards.length;


const allUsers = JSON.parse(sessionStorage.getItem("allUsers"));

const autresUsers = allUsers.filter(function(user) {
    return user.name !== username.name;
});
console.log(autresUsers);

autresUsers.forEach(function(user) {
    user.wallet.cards.forEach(function(card) {
        const option = document.createElement("option");
        option.value = user.name; // set the value to the user's name
        option.textContent =  user.name + " - " + card.type + " - " + card.numcards;
        beneficiarySelect.appendChild(option);
    });
});

username.wallet.cards.forEach(function(card) {
    const option = document.createElement("option");
    option.value = card.numcards;
    option.textContent = card.type + " - " + card.numcards;
    sourceCardSelect.appendChild(option);
});


Trasnfer.addEventListener("click", function() {
    transfSection.classList.remove("hidden");
});

FermeBtn.addEventListener("click", function() {
    transfSection.classList.add("hidden");
});

AnnulerrBtn.addEventListener("click", function() {
    transfSection.classList.add("hidden");
});


logoutBtn.addEventListener("click", function() {
    sessionStorage.removeItem("Currentuser");
    sessionStorage.removeItem("allUsers");
    document.location.href = "login.html";
});


submitTransferBtn.addEventListener("click", function(e) {
    e.preventDefault();

    const amount = parseFloat(document.getElementById("amount").value);
    const beneficiaryName = document.getElementById("beneficiary").value;// get the beneficiary's card number from the select input

    verifierSolde(amount).then(function() {

        return verifierBeneficiaire(beneficiaryName).then(function(beneficiaire) {

            return creerTransactions(amount, beneficiaire).then(function(sender) { 
                
                updateDashboard(amount, beneficiaire, sender);          
                transfSection.classList.add("hidden");
                alert("Transfert de " + amount + " MAD effectué avec succès vers " + beneficiaire.name + " !");
            });
        });
    }).catch(function(err){
        alert(err);
    });
});

function verifierSolde(amount) {
    return new Promise((resolve,reject)=>{

        if (!amount || amount <= 0) {
        reject("Veuillez entrer un montant valide !");
        return ;
        }
        if (username.wallet.balance < amount) {
        reject("Solde insuffisant ! Votre solde est de " + username.wallet.balance + " " + username.wallet.currency);
        return ;
        }
        resolve();
    });   
}

function verifierBeneficiaire(beneficiaryName) {
    return new Promise((resolve,reject)=>{
    if (!beneficiaryName || beneficiaryName === "") {
        reject("Veuillez choisir un beneficiaire !");
        return;
    }
    getUserByName(beneficiaryName, function(beneficiaire) {
        if (!beneficiaire) {
            reject("Beneficiaire introuvable !");
            return;
        }
        resolve(beneficiaire);
    });
});
}

function creerTransactions(amount, beneficiaire) {
    return new Promise((resolve)=>{
    const now   = new Date();
    const day   = now.getDate();
    const month = now.getMonth() + 1;
    const year  = String(now.getFullYear()).slice(2);
    const date  = day + "-" + month + "-" + year;

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

        resolve(sender); 
    });
});

}

function updateDashboard(amount, beneficiaire, sender) { 
    sender.wallet.balance -= amount;
    beneficiaire.wallet.balance += amount;

    SaveBD();

    username.wallet.balance = sender.wallet.balance;
    username.wallet.transactions = sender.wallet.transactions;
    sessionStorage.setItem("Currentuser", JSON.stringify(username));

    soldedispo.textContent = username.wallet.balance + " " + username.wallet.currency;

    const Dt = sender.wallet.transactions.filter(function(t) { return t.type === "debit"; });
    const Ct = sender.wallet.transactions.filter(function(t) { return t.type === "credit"; });
    Depenses.textContent = Dt.reduce(function(total, t) { return total + t.amount; }, 0) + " " + username.wallet.currency;
    Revenue.textContent  = Ct.reduce(function(total, t) { return total + t.amount; }, 0) + " " + username.wallet.currency;

}

username.wallet.transactions.forEach((tr) => {
    const transactionEl = document.createElement("div");
    transactionEl.className = "transaction-item";
    const amountColor = tr.type === "credit" ? "color: green;" : "color: red;";
    transactionEl.innerHTML = `
        <span class="date"><strong>${tr.date}</strong></span>
        <span class="from">${tr.from}</span>
        <span class="to">${tr.to}</span>
        <span class="type ${tr.type}"><strong>${tr.type}</strong></span>
        <span class="amount" style="${amountColor}">${tr.amount}</span>
    `;
    recentTransactionsList.appendChild(transactionEl);
})
