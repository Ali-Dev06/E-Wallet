const defaultUsers = [
    {id:"1", name:"Ali", email:"Ali@example.com", password:"1232",
     wallet:{ balance:12457, currency:"MAD",
      cards:[
          {numcards:"124847", type:"visa",       balance:"14712", expiry:"14-08-27", vcc:"147"},
          {numcards:"124478", type:"mastercard", balance:"1470",  expiry:"14-08-28", vcc:"257"},
      ],
      transactions:[
          {id:"1", type:"credit", amount:140, date:"14-08-25", from:"Ahmed", to:"124847"},
          {id:"2", type:"debit",  amount:200, date:"13-08-25", from:"124847", to:"Amazon"},
          {id:"3", type:"credit", amount:250, date:"12-08-25", from:"Ahmed",  to:"124478"},
      ]
     }
    },
    {id:"2", name:"Ahmed", email:"Ahmed@example.com", password:"ahmed123",
     wallet:{ balance:8300, currency:"MAD",
      cards:[
          {numcards:"987651", type:"visa",       balance:"5000", expiry:"20-05-27", vcc:"321"},
          {numcards:"987652", type:"mastercard", balance:"3300", expiry:"10-03-28", vcc:"654"},
      ],
      transactions:[
          {id:"1", type:"credit", amount:500, date:"10-03-26", from:"Ali",    to:"987651"},
          {id:"2", type:"debit",  amount:150, date:"09-03-26", from:"987651", to:"Jumia"},
          {id:"3", type:"credit", amount:200, date:"08-03-26", from:"Khalid", to:"987651"},
      ]
     }
    },
    {id:"3", name:"Khalid", email:"Khalid@example.com", password:"khalid456",
     wallet:{ balance:5200, currency:"MAD",
      cards:[
          {numcards:"456781", type:"visa",       balance:"3000", expiry:"01-11-27", vcc:"111"},
          {numcards:"456782", type:"mastercard", balance:"2200", expiry:"15-06-28", vcc:"222"},
          {numcards:"456783", type:"visa",       balance:"0",    expiry:"10-01-29", vcc:"333"},
      ],
      transactions:[
          {id:"1", type:"credit", amount:1000, date:"05-03-26", from:"Sara",   to:"456781"},
          {id:"2", type:"debit",  amount:300,  date:"04-03-26", from:"456781", to:"Netflix"},
          {id:"3", type:"debit",  amount:80,   date:"03-03-26", from:"456782", to:"Spotify"},
      ]
     }
    },
    {id:"4", name:"Aymen", email:"Aymen@example.com", password:"aymen123",
     wallet:{ balance:20100, currency:"MAD",
      cards:[
          {numcards:"321651", type:"mastercard", balance:"15000", expiry:"30-12-28", vcc:"741"},
          {numcards:"321652", type:"visa",       balance:"5100",  expiry:"22-07-27", vcc:"852"},
      ],
      transactions:[
          {id:"1", type:"debit",  amount:1000, date:"05-03-26", from:"321651", to:"Khalid"},
          {id:"2", type:"credit", amount:700,  date:"03-03-26", from:"Ali",    to:"321651"},
          {id:"3", type:"debit",  amount:250,  date:"01-03-26", from:"321652", to:"Amazon"},
          {id:"4", type:"credit", amount:500,  date:"28-02-26", from:"Ahmed",  to:"321651"},
      ]
     }
    }
];

let stored = null;
try {
    stored = JSON.parse(sessionStorage.getItem("databaseUsers"));
} catch { }

let users;
if (stored && Array.isArray(stored)) {
    users = stored;
} else {
    users = defaultUsers;
}

const database = { users: users };

export function persistDatabase() {
    sessionStorage.setItem("databaseUsers", JSON.stringify(database.users));
}

// ✅ Returns direct reference inside database.users
export function getUserByName(name, callback) {
    const user = database.users.find(function(u) {
        return u.name === name;
    });
    callback(user);
}

const finduserbymail = (mail, password) => {
    return database.users.find((u) => u.email === mail && u.password === password);
}

export const getAllUsers = () => database.users;

export default finduserbymail;