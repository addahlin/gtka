var application_root = __dirname,
    express = require('express'),
    path = require('path'),
    mongoose = require('mongoose'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    mustache = require('mustache'),
    fs = require('fs');

//var app = express.createServer();
var app = express();

//Database
mongoose.connect('mongodb://localhost/gtk_database');

//Config
//apparently app.configure is depreciated
//app.configure(function() {
app.use(bodyParser());
app.use(methodOverride());
app.use(express.static(path.join(application_root, "public")));
//    app.use(express.errorHandler({dumpExceptions: true, showStack: true}));
//});

var Schema = mongoose.Schema;

var Quiz = new Schema({
    quizType: {type: String, required: true, default: "QN"}, //quantitative (QN) or qualitative (QL)
    title: {type: String, required: true},
    desc: {type: String, required: false},
    pub_date: {type: Date, default: Date.now},
    questions: [{
        text: String,
        answers: [String],
        correctAnswer: Number
    }]
});

QuizModel = mongoose.model("Quiz", Quiz);


//Handle errors
app.use(function(err, req, res, next){
    console.error(err.stack);
    res.send(500, 'Something broke!');
});


app.get('/api', function (req, res) {
    res.send("GTK API is running");
});

//Build up a REST API

//Return a list of quizzes
app.get('/api/quizzes', function(req, res) {
    return QuizModel.find(function (err, quizzes) {
        if (!err){
            return res.send(quizzes);
        } else {
            return console.log(err);
        }
    });
});

//Get the quiz specified
app.get('/quizzes/:id', function(req, res) {
    var quizID = req.params.id;
    QuizModel.findById(quizID, function(err, quiz) {
        if (!err){

            var view = {
                "quizID" : quizID
            };
            var templatePath = "./templates/CreateEditQuiz.html";

            fs.readFile(templatePath,function(err,template) {
                if (!err) {
                    template = template.toString();
                    res.send(mustache.to_html(template, view));
                } else {
                    return console.log(err);
                }
            });

        } else {
            return console.log(err);
        }
    });
});

//Create/Edit a quiz
app.get('/admin/quiz/:id?', function(req, res) {
    var quizID = req.params.id;

    if(!quizID)
        quizID = -1;

    var view = {
        "quizID" : quizID
    };
    var templatePath = "./templates/admin/CreateEditQuiz.html";

    fs.readFile(templatePath,function(err,template) {
        if (!err) {
            template = template.toString();
            res.send(mustache.to_html(template, view));
        } else {
            return console.log(err);
        }
    });

});

// Retrieve a specific Quiz
app.get('/api/quizzes/:id', function(req, res) {
    QuizModel.findById(req.params.id, function(err, quiz) {
        if (!err){
            res.send(quiz);
        } else {
            return console.log(err);
        }
    });
});

//Create a Quiz
app.post('/api/quizzes', function(req, res) {
    var quiz;
    console.log ("POST: ");
    console.log(req.body);
    quiz = new QuizModel({
        quizType: req.body.quizType,
        title: req.body.title,
        desc: req.body.desc
        //questions: req.body.questions
    });

    quiz.save(function(err){
        if(!err) {
            return console.log("Created");
        } else {
            return console.log(err);
        }
    })
    return res.send(quiz);
});

//Update a quiz
app.put('/api/quizzes/:id', function(req, res) {
    return QuizModel.findById(req.params.id, function (err, quiz) {
        quiz.title = req.body.title;
        quiz.quizType = req.body.quizType;
        quiz.desc = req.body.desc;

        return quiz.save(function(err) {
            if(!err){
                console.log("updated");
            } else {
                console.log(err);
            }
            return res.send(quiz);
        });
    });
});

//Delete a quiz
app.delete('/api/quizzes/:id', function(req, res) {
   return  QuizModel.findById(req.params.id, function (err, quiz) {
       return quiz.remove(function (err) {
           if (!err) {
               console.log("removed");
               return res.send('');
           } else {
               console.log(err);
           }
       });
   });
});

//Add a question to a quiz
app.post('/api/quizzes/:id/addQuestion', function(req, res) {
    var question;
    console.log ("POST: ");
    console.log(req.body);

    console.log("text: " + req.body.text);

    var quiz = QuizModel.findById(req.params.id, function (err, quiz) {
        if (!err) {
            question = quiz.questions.push({
                text: req.body.text,
                answers: req.body.answers,
                correctAnswer: req.body.correctAnswer
            });

            quiz.save(function(err){
                if(!err) {
                    return console.log("Question Updated");
                } else {
                    return console.log(err);
                }
            });

            return quiz.questions[0];
        } else {
            return console.log("err");

        }
    });


});

//Launch server
var server = app.listen(4242, function(){
    console.log("Listening on port %d", server.address().port);
});