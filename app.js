const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const Razorpay = require("razorpay");

const app = express();

app.set('view engine', 'ejs');

mongoose.connect("mongodb+srv://DARKFAITH:QAZwsx0611@cluster0.dtzfcae.mongodb.net/tapamusers", {useNewUrlParser: true});

var instance = new Razorpay({
    key_id: 'rzp_test_g8NLJl87sdKhv2',
    key_secret: 'lewV6E1ZJMqoAWRkv0SoS4LG',
  });

// API signature
// {razorpayInstance}.{resourceName}.{methodName}(resourceId [, params])

// example

// instance.payments.fetch(paymentId)

const projectSchema = new mongoose.Schema({
    ideaTitle: {
        type: String,
        required: true
    },
    domain: {
        type: String,
        required: true
    },
    problemStatement: {
        type: String,
        required: true
    },
    implementation: {
        type: String,
        required: true
    },
    cost: {
        type: Number,
        required: true
    },
    fundingRaised: {
        type: Number
    },
    fundingArray: {
        type:[Number]
    },
    upiId: {
        type: String,
        required: true
    },
    accountNumber: {
        type: Number,
        required: true
    },
    ifscCode: {
        type: String,
        required: true
    },
    benificiaryName: {
        type: String,
        required: true
    }
});

const Project = mongoose.model("Project", projectSchema);

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: String,
    email: {
        type: String,
        required: true
    },
    password: String,
    description: {
        type: String,
        required: true
    },
    projects: [projectSchema]
});

const User = mongoose.model("User", userSchema);



app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


app.get("/", function(req, res){
    Project.find({}).then(function(projects){
        res.render("main", {projects: projects});
    }).catch(function(err){
        console.log(err);
    });
});

app.get("/login.html", function(req, res){
    res.sendFile(__dirname + "/login.html");
});

app.get("/signup.html", function(req, res){
    res.sendFile(__dirname + "/signup.html");
});

app.get("/main.html", function(req, res){
    Project.find({}).then(function(projects){
        res.render("main", {projects: projects});
    }).catch(function(err){
        console.log(err);
    });
});

app.get("/innovators.html", function(req, res){
    Project.find({}).then(function(projects){
        User.find({}).then(function(users){
            res.render("innovators", {projects: projects, users: users});
        }).catch(function(err){
            console.log(err);
        });
    }).catch(function(err){
        console.log(err);
    });
});

app.get("/idea.html", function(req, res){
    res.render("idea", {errorMessage: "GO for it....."});
});

app.get("/forgotpassword.html", function(req, res){
    res.render("forgotpassword", {errorMessage: ""});
});

app.post("/", function(req, res){
    const userFirstName = _.lowerCase(_.trimEnd(_.trimStart(req.body.userFirstName)));
    const userLastName = _.lowerCase(_.trimEnd(_.trimStart(req.body.userLastName)));
    const userEmail = _.trimEnd(_.trimStart(req.body.userEmail));
    const userPassword = req.body.userPassword;
    const userConfirmPassword = req.body.userConfirmPassword;
    const userDescription = _.trimEnd(_.trimStart(req.body.userDescription));


    const newUser = new User({
        firstName: userFirstName,
        lastName: userLastName,
        email: userEmail,
        password: userPassword,
        description: userDescription,
        projects: []
    });
    User.findOne({email: userEmail}).then(function(foundUser){
        if(!foundUser){
            if(userConfirmPassword === userPassword){
                newUser.save();
                res.sendFile(__dirname + "/login.html");
                // console.log("Succesfully added user.");
            }
            else{
                const errorMessage = "Password and confirm password doesn't match.";
                res.render('signup', { errorMessage: errorMessage });
            }
        }
        else{
            const errorMessage = "User already exists with this email id.";
            res.render('signup', { errorMessage: errorMessage });
        }
    }).catch(function(err){
        console.log(err);
    });
});


app.post("/login", function(req, res){
    const email = req.body.userEmail;
    const password = req.body.userPassword;

    User.findOne({email: email}). then(function(foundUser){
        if(foundUser){
            if(password != foundUser.password){
                //document.querySelector("h5").innerHTML = "No user with this ID.";
                const errorMessage = "Incorrect Password";
                res.render('login', { errorMessage: errorMessage });
            }
            else{
                res.render('idea', {userEmail : email, userEmailForm : email, errorMessage: "GO for it...."});
            }
        }
        else{
            const errorMessage = "No user with this email id. Please Sign up.";
            res.render('login', { errorMessage: errorMessage });
        }
    }).catch(function(err){
        console.log(err);
    });
});

app.post("/submitIdea", function(req, res){
    const userEmail = req.body.userEmail;
    const userIdeaTitle = req.body.ideaTitle;
    const userDomainName = req.body.domainName;
    const userProblemStatement = req.body.problemStatement;
    const userImplementation = req.body.ideaImplementation;
    const userCost = req.body.cost;
    const userUpiId = req.body.upiId;
    const userAccountNumber = Number(req.body.userAccountNumber);
    const reenterAccountNumber = Number(req.body.userReAccountNumber);
    const userIFSC = _.capitalize(req.body.userIFSC);
    const userBenificiaryName = req.body.userBenificiaryName;

    const newProject = new Project({
        ideaTitle: userIdeaTitle,
        domain: userDomainName,
        problemStatement: userProblemStatement,
        implementation: userImplementation,
        cost: userCost,
        fundingRaised: 0,
        fundingArray:[],
        upiId: userUpiId,
        accountNumber: userAccountNumber,
        ifscCode: userIFSC,
        benificiaryName: userBenificiaryName
    });


    Project.findOne({ideaTitle: userIdeaTitle}). then(function(foundProject){
        if(foundProject === null || !foundProject.ideaTitle){
            if(userAccountNumber != reenterAccountNumber){
                const errorMessage ="Account Number doesn't match";
                res.render("idea", {userEmail : userEmail, errorMessage: errorMessage});
            }
            else {
                newProject.save();
                User.updateOne({email: userEmail}, {$push: {projects: newProject}}).then(function(){
                    res.render("idea", {userEmail : userEmail, errorMessage: "Project added to your ID"});
            }).catch(function(err){
                console.log(err);
            });
                
            }
        }
        else{
            const errorMessage = "The idea is available with the same title.";
            res.render('idea', {userEmail : userEmail, errorMessage: errorMessage});
        }
    }).catch(function(err){
        console.log(err);
    });
    res.render('idea', {userEmail : userEmail, errorMessage: "Go for it...."});

});

app.post("/fundingpage", function(req,res){
    const projectId = req.body.projectId;
    // console.log(projectId);
    Project.findOne({_id: projectId}).then(function(foundProject){
        res.render("fundingpage", {projectID: foundProject._id, ideaTitle: foundProject.ideaTitle, domain: foundProject.domain, problemStatement: foundProject.problemStatement, implementation: foundProject.implementation, cost: foundProject.cost, raised: foundProject.fundingRaised, upiId: foundProject.upiId});

    }).catch(function(err){
        console.log(err);
    });
});


app.post("/payment", function(req, res){
    const upiId = req.body.upiId;
    const amount = Number(req.body.amount);
    const projectID = req.body.projectID;
    const raised = Number(req.body.raised);
    

    var options = {
        amount: amount * 100,  // amount in the smallest currency unit
        currency: "INR"
      };
      instance.orders.create(options).then(function(order){
        res.render("checkout", {orderId: order.id, amount: order.amount / 100});
        
      }).catch(function (err){
        console.log(err);
      });

    Project.updateOne({_id: projectID}, {fundingRaised: raised + amount, $push: {fundingArray: amount}})
    .then(function(){
    })
    .catch(function(err){
        console.log(err);
    });
});


app.post("/paymentVerification", function(req, res){
    console.log("In pv");
    console.log();
    console.log();
});

app.post("/forgotPassword", function(req, res){
    const userEmail = req.body.userEmail;
    const newPassword = req.body.userNewPassword;
    const confirmPassword = req.body.userConfirmPassword;
    if(newPassword != confirmPassword){
        res.render("forgotPassword", {errorMessage: "Password and Confirm Password doesnt match."});
    }
    else{
        User.updateOne({email: userEmail}, {password: newPassword}).then(function(){
            res.render("login", {errorMessage: "Password updated successfully"});
        }).catch(function(err){
            console.log(err);
        })
        
    }

});


app.listen(3000, function(){
    console.log("Server started on port 3000");
});