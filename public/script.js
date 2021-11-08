let qName = 0;
let countQues = 1;
let id = null;
let userAnswers = {};
let myJson;

async function main() {
  const intro = document.querySelector("#introduction");

  const currentAttemptID = localStorage.getItem("attemptID");

  const isAlreadyInAttempt = currentAttemptID !== null;

  console.log(currentAttemptID);

  console.log("isAlreadyInAttempt: ");
  console.log(isAlreadyInAttempt);

  if (isAlreadyInAttempt) {
    myJson = await continueCurrentAttemptWithID(currentAttemptID);
    id = currentAttemptID;
    intro.style.display = "none";
    generateQandA();
  } else {
    intro.style.display = null;
  }
  const start_box = document.querySelector("#blue-button");

  start_box.addEventListener("click", startBox);
}

main();

async function startBox() {
  const intro = document.querySelector("#introduction");
  intro.style.display = "none";

  myJson = await fetchQuestions();
  id = myJson._id;
  localStorage.setItem("attemptID", id);

  await generateQandA();
}

async function generateQandA() {
  const attempQuiz = document.querySelector("#attempt-quiz");

  let button_submit = document.createElement("button");
  let button_div = document.createElement("div");
  button_div.setAttribute("id", "submit-button");

  button_submit.textContent = "Submit your answers >";
  button_submit.classList.add("green");
  button_div.classList.add("box");
  button_div.appendChild(button_submit);

  myJson.questions.forEach((ques) => {
    const quizBody = document.querySelector(".quiz-body");
    quizBody.style.display = "block";

    const titles = document.createElement("p");
    const questions = document.createElement("p");
    const answer_box = document.createElement("div");

    answer_box.classList.add("answer_box");

    titles.classList.add("title", "style");
    titles.textContent = `Question ${countQues} of ${myJson.questions.length}`;

    questions.classList.add("questions", "style");
    questions.textContent = `${ques.text}`;

    quizBody.appendChild(titles);
    quizBody.appendChild(questions);

    //loop for each answer in question
    for (let i = 0; i < ques.answers.length; i++) {
      userAnswers[ques._id] = null;
      const label = document.createElement("label");
      const input = document.createElement("input");
      const div_answers = document.createElement("div");

      input.type = "radio";
      input.id = `Q${qName}`;
      input.name = `${ques._id}`;
      input.value = `${i}`;

      if (myJson.userAnswers)
        if (myJson.userAnswers[ques._id] == input.value) input.checked = true;

      input.addEventListener("click", clickAnswer);

      // CHANGE
      input.addEventListener("change", (event) => {
        // TODO: update the selected answers to server
        updateUserAnswers(id, ques._id, event.target.value);
      });

      // END OF CHANGE

      function clickAnswer(ques) {
        userAnswers[ques.target.name] = ques.target.value;
      }

      div_answers.appendChild(input);
      div_answers.appendChild(label);

      answer_box.appendChild(div_answers);

      label.htmlFor = `Q${qName}`;
      label.textContent = ques.answers[i];
      div_answers.classList.add("background");

      qName++;
    }
    countQues += 1;
    quizBody.appendChild(answer_box);
    quizBody.appendChild(button_div);
  });

  button_submit.addEventListener("click", handleSubmit);
}

async function updateUserAnswers(id, questionID, userAnswer) {
  const url = `/attempts/${id}`;

  const body = {};

  body[questionID] = userAnswer;
  console.log("Saving user temporary answer to the server: ");
  console.log(body);

  await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  console.log("Save completed");
}

async function continueCurrentAttemptWithID(id) {
  const url = `/attempts/${id}`;
  const myResponse = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const myJson = await myResponse.json();
  return myJson;
}

async function fetchQuestions() {
  const url = "/attempts";
  const myResponse = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const myJson = await myResponse.json();
  return myJson;
}

async function fetchResult() {
  const url = `attempts/${id}`;
  console.log(userAnswers);
  const myResponse = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userAnswers),
  });
  const myJson = await myResponse.json();
  return myJson;
}

async function handleSubmit(event) {
  if (!window.confirm("Are you sure want to finish this quiz")) return;

  const button_div = document.querySelector("#submit-button");
  button_div.style.display = "none";

  const myJson = await fetchResult();
  const review_quiz = document.querySelector("#review-quiz");
  const disable = document.querySelectorAll("input");
  const correctAns = myJson.correctAnswers;
  const result_view = document.createElement("div");
  const titles = document.createElement("p");
  const result_score = document.createElement("p");
  const result_percent = document.createElement("p");
  const button_again = document.createElement("button");
  const result_comment = document.createElement("p");
  let scores = 0;
  let result = myJson.scoreText;
  //disable input
  disable.forEach((e) => {
    e.disabled = true;
  });
  //loop for each user answers
  for (const key in userAnswers) {
    const totalInputDom = document.querySelectorAll(`input[name='${key}']`);
    const userInputDom = totalInputDom[userAnswers[key]];
    const correctInputDOM = totalInputDom[correctAns[key]];
    const statusCorrect = document.createElement("div");
    const statusWrong = document.createElement("div");

    statusCorrect.textContent = "Correct Answer";
    statusCorrect.classList.add("correct");
    statusWrong.textContent = "Wrong Answer";
    statusWrong.classList.add("wrong");
    //if user chose an answer
    if (userAnswers[key] != null) {
      //if user answer is correct
      if (userAnswers[key] == correctAns[key]) {
        correctInputDOM.nextElementSibling.style.backgroundColor = "#d4edda";
        correctInputDOM.nextElementSibling.appendChild(statusCorrect);
        scores++;
      }
      //if user answer is wrong
      else {
        correctInputDOM.nextElementSibling.style.backgroundColor = "#ddd";
        userInputDom.nextElementSibling.style.backgroundColor = "#f8d7da";
        correctInputDOM.nextElementSibling.appendChild(statusCorrect);
        userInputDom.nextElementSibling.appendChild(statusWrong);
      }
    }
    //if user did not choose an answer
    else {
      correctInputDOM.nextElementSibling.appendChild(statusCorrect);
      correctInputDOM.nextElementSibling.style.backgroundColor = "#ddd";
    }
  }

  //setup result box
  result_view.classList.add("again-box");

  titles.classList.add("result_title", "style");
  titles.textContent = "Result:";

  result_score.classList.add("score", "style");
  result_score.textContent = `${scores}/10`;

  result_percent.classList.add("questions", "style");
  result_percent.textContent = `${scores * 10}%`;

  result_comment.classList.add("style");
  result_comment.textContent = result;

  button_again.textContent = "Try Again";
  button_again.addEventListener("click", handleTryAgain);
  button_again.classList.add("blue");

  //append result box
  result_view.appendChild(titles);
  result_view.appendChild(result_score);
  result_view.appendChild(result_percent);
  result_view.appendChild(result_comment);
  review_quiz.appendChild(result_view);
  result_view.appendChild(button_again);

  localStorage.removeItem("attemptID");

  //handle try again button
  async function handleTryAgain(e) {
    const quizBody = document.querySelector(".quiz-body");
    const review_quiz = document.querySelector("#review-quiz");
    const intro = document.querySelector("#introduction");

    quizBody.style.display = "block";
    quizBody.innerHTML = "";
    review_quiz.innerHTML = "";
    review_quiz.innerHTML = "";

    intro.style.display = "block";

    userAnswers = {};
    //scroll back to the begin of page
    const beginPage = document.querySelector("#introduction");

    beginPage.scrollIntoView();
    qName = 0;
    countQues = 1;
  }
}
//-------------end of result section-------------//
