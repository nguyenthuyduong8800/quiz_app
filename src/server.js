const mongodb = require("mongodb");
const express = require("express");

const app = express();

app.use(express.static("public"));

app.use(express.json());
app.use(express.urlencoded());
// decode req.body from post body message

// prepare database
const DATABASE_NAME = "html-quiz";
const MONGO_URL = `mongodb://localhost:27017/${DATABASE_NAME}`;

let db = null;
let questionsCollection = null;
let attemptsCollection = null;

async function startServer() {
  const client = await mongodb.MongoClient.connect(MONGO_URL, {
    useUnifiedTopology: true,
  });
  db = client.db();
  questionsCollection = db.collection("questions");
  attemptsCollection = db.collection("attempts");

  const PORT = 8080;
  await app.listen(PORT);
  console.log(`Listening on port ${PORT}!`);
}
startServer();

// const questionSchema = {text: "", answers: [], correctAnswer: 0};

async function onAttemps(req, res) {
  // take 10 random questions from question collection
  const questionList = await questionsCollection
    .aggregate([{ $sample: { size: 10 } }])
    .toArray();
  // console.log(questionList);

  const questions = [];
  const correctAnswers = {};

  for (let i = 0; i < questionList.length; i++) {
    const question = {};
    question["_id"] = questionList[i]._id;
    question["text"] = questionList[i].text;
    question["answers"] = questionList[i].answers;

    questions.push(question);

    correctAnswers[`${questionList[i]._id}`] = questionList[i].correctAnswer;
  }
  // console.log(questions);
  // console.log(correctAnswers);

  //create attempts
  // const attemptSchema = {questions: [], completed: Boolean, score: 0, scoreText: "", startedAt: Date, correctAnswers: {}, answers: {} }
  //   const attempt0 = {};
  //   attempt0["questions"] = questions;
  //   attempt0["completed"] = false;
  //   attempt0["score"] = 0;
  //   attempt0["startedAt"] = new Date();
  //   attempt0["correctAnswers"] = correctAnswers;

  const attempt0 = {
    questions: questions,
    completed: false,
    score: 0,
    startedAt: new Date(),
    correctAnswers: correctAnswers,
  };

  const attempt1 = await attemptsCollection.insertOne(attempt0);

  const finalAttempt = attempt1.ops[0];
  // console.log(finalAttempt);

  // hide correct answers
  finalAttempt.correctAnswers = {};

  res.json(finalAttempt);
}

async function onSubmit(req, res) {
  //receive the answers
  const userAnswers = req.body;

  //get the attemp by attemp id from user
  const attemptID = req.params.id;
  const attempt = await attemptsCollection.findOne({
    _id: mongodb.ObjectID(attemptID),
  });

  // console.log(answers);
  // console.log(attemptID);
  // console.log(attempt);

  //compare user answers to correct answers to get score
  let score = 0;
  const correctAnswers = attempt.correctAnswers;

  for (let i = 0; i < attempt.questions.length; i++) {
    if (
      userAnswers[attempt.questions[i]._id] ==
      correctAnswers[attempt.questions[i]._id]
    ) {
      score++;
    }
  }
  // console.log(score);

  let scoreText;

  if (score < 5) scoreText = "Practice more to improve it :D";
  else if (score < 7) scoreText = "You are doing great , keep working :D";
  else if (score < 9) scoreText = "Well done!";
  else scoreText = "Perfect!!!";

  // update all the attribute for attempt, add new attribute(userAnswers)

  attempt.completed = true;
  attempt.score = score;
  attempt.scoreText = scoreText;
  attempt.userAnswers = userAnswers;

  // update attempt in database
  await attemptsCollection.updateOne(
    {
      _id: mongodb.ObjectID(attemptID),
    },
    { $set: attempt }
  );
  const submit = await attemptsCollection.findOne({
    _id: mongodb.ObjectID(attemptID),
  });

  res.json(submit);
}

app.post("/attempts/:id", onSubmit);

app.post("/attempts", onAttemps);

app.get("/attempts/:id", async (req, res) => {
  // get the attemp by attemp id from user
  const attemptID = req.params.id;

  const attempt = await attemptsCollection.findOne({
    _id: mongodb.ObjectID(attemptID),
  });

  delete attempt.correctAnswers;

  return res.json(attempt);
});

app.patch("/attempts/:id", async (req, res) => {
  console.log("Hello, world");
  // receive the answers
  const userAnswers = req.body;

  console.log(userAnswers);

  // get the attemp by attemp id from user
  const attemptID = req.params.id;

  const updateParams = {};

  Object.keys(userAnswers).forEach((questionID) => {
    updateParams["userAnswers." + questionID] = userAnswers[questionID];
  });

  await attemptsCollection.updateOne(
    {
      _id: mongodb.ObjectID(attemptID),
    },
    {
      $set: updateParams,
    }
  );

  return res.status(201).send("true");
});
