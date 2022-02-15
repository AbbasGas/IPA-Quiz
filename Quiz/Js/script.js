let Languages = [];
let Questions = [];
let Help = [];
let Difficulties = [];
let QuestionsMin = 1;
let QuestionsMax = 20;

let QuestionsAmount;
let LanguageIndex;
let QuestionIndices;
let QuestionNumber;
let CorrectAmount;
let Answers;

function getQuestions(file, index) {

    return $.get(file, function(data) {

        let lines = data.split("\n");

        for (let line of lines) {
            if (line === "") break;

            let lineSplit = line.split("; ");
            let phonemes = lineSplit[0].split(" ");
            let words = lineSplit[1].split(" ");
            Questions[index].push([phonemes, words]);

        }

    });

}

function getHelp(file, index) {

    return $.get(file, function(data) {

        let lines = data.split("\n");

        for (let line of lines) {
            if (line === "") break;

            let lineSplit = line.split("; ");
            let phoneme = lineSplit[0];
            let helpWord = lineSplit[1];

            helpWord = helpWord.replace("(", "<span class=\"highlight\">");
            helpWord = helpWord.replace(")", "</span>");

            let element = document.createElement("p");
            element.setAttribute("class", "text-normal");
            element.innerHTML = helpWord;

            Help[index][phoneme] = element.outerHTML;

        }

    });

}

async function getData() {

    let data = await $.get("Data/languages.txt");
    let lines = data.split("\n");

    for (let i = 0; i < lines.length; i++) {
        if (lines[i] === "") break;

        let lineSplit = lines[i].split("; ");
        Languages.push(lineSplit[0]);
        Questions.push([]);
        Help.push([]);
        Difficulties.push([]);

        let element = document.createElement("option");
        element.innerHTML = lineSplit[0];
        element.setAttribute("value", i);
        $("#selectLanguage").append(element);

        await getQuestions("Data/" + lineSplit[1], i);

        if (lineSplit[2] !== "") {
            await getHelp("Data/" + lineSplit[2], i);
        }

        difficultiesSplit = lineSplit[3].split(", ")

        for (let j = 0; j < difficultiesSplit.length; j += 2) {

            let difficultyName = difficultiesSplit[j];
            let difficultyValue = Number(difficultiesSplit[j + 1]);
            Difficulties[i].push([difficultyName, difficultyValue]);

        }

    }

}

function newGame(questions, language, difficulty) {

    LanguageIndex = language;
    QuestionIndices = [];
    QuestionNumber = 0;
    CorrectAmount = 0;
    Answers = [];

    let difficultyValue = Difficulties[language][difficulty][1];

    while (QuestionIndices.length < Math.min(questions, difficultyValue)) {
        let i = Math.floor(Math.random() * difficultyValue);
        if (QuestionIndices.indexOf(i) == -1) {
            QuestionIndices.push(i);
        }
    }

    QuestionsAmount = QuestionIndices.length;

    nextQuestion();

}

function nextQuestion() {

    let questionIndex = QuestionIndices[QuestionNumber];
    let question = Questions[LanguageIndex][questionIndex];

    let questionText = "Question: " + (QuestionNumber + 1) + "/" + QuestionsAmount;
    $("#questionNumber").html(questionText);

    let correctText = "Correct: " + CorrectAmount;
    $("#correctCurrect").html(correctText);

    $(".phoneme").tooltip("dispose");
    $("#transcription").empty();
    $("#transcription").append("/");

    for (let phoneme of question[0]) {

        let element = document.createElement("span");
        element.innerHTML = phoneme;

        let helpHTML = Help[LanguageIndex][phoneme];
        if (helpHTML != undefined) {

            element.setAttribute("class", "phoneme");

            $(element).tooltip({
                html: true,
                title: helpHTML
            });

        }

        $("#transcription").append(element);

    }

    $("#transcription").append("/");

    $("#inputWord").val("");
    $("#inputWord").removeClass("color-correct");
    $("#inputWord").removeClass("color-wrong");
    $("#inputWord").prop("disabled", false);
    $("#inputWord").focus();

    $("#buttonNextQuestion").hide();
    $("#solutionText").html("");

}

function check() {

    inputWord = $("#inputWord").val()
    inputWord = inputWord.trim();
    inputWord = inputWord.toLowerCase();

    if (inputWord == "") return;

    let questionIndex = QuestionIndices[QuestionNumber];
    let question = Questions[LanguageIndex][questionIndex];

    let correct = false;
    let solutionText = "";

    for (let i = 0; i < question[1].length; i++) {
        let word = question[1][i];

        if (i != 0) {
            solutionText += ", ";
        }
        solutionText += word;

        if (inputWord == word.toLowerCase()) {
            correct = true;
        }
    }

    if (correct) {
        $("#inputWord").addClass("color-correct");
        CorrectAmount++;
    }
    else {
        $("#inputWord").addClass("color-wrong");
    }

    let correctText = "Correct: " + CorrectAmount;
    $("#correctCurrect").html(correctText);

    $("#inputWord").prop("disabled", true);
    $("#buttonNextQuestion").show();
    $("#buttonNextQuestion").focus();
    $("#solutionText").html(solutionText);

    Answers.push([inputWord, correct]);

}

function viewResults() {

    $("#resultsList").empty();

    for (let i = 0; i < QuestionsAmount; i++) {

        let questionIndex = QuestionIndices[i];
        let question = Questions[LanguageIndex][questionIndex];

        let row = document.createElement("div");
        row.setAttribute("class", "row");

        let colTranscr = document.createElement("div");
        colTranscr.setAttribute("class", "col-6");

        let colAnswer = document.createElement("div");
        colAnswer.setAttribute("class", "col-6");

        let transcr = "/";
        for (let phoneme of question[0]) {
            transcr += phoneme;
        }
        transcr += "/";

        let pTranscr = document.createElement("p");
        pTranscr.setAttribute("class", "text-result text-center");
        pTranscr.innerHTML = transcr;

        let classes = "text-result text-center";
        if (Answers[i][1]) {
            classes += " color-correct";
        }
        else {
            classes += " color-wrong";
        }

        let pAnswer = document.createElement("p");
        pAnswer.setAttribute("class", classes);
        pAnswer.innerHTML = Answers[i][0];

        colTranscr.append(pTranscr);
        colAnswer.append(pAnswer);

        row.append(colTranscr);
        row.append(colAnswer);

        $("#resultsList").append(row);

    }

    let correctText = "Correct: " + CorrectAmount + "/" + QuestionsAmount;
    $("#correctFinal").html(correctText);
    $("#buttonNewQuiz").focus();

}

function updateDifficultySelect() {

    let language = Number($("#selectLanguage").val());
    let difficulties = Difficulties[language]

    $("#selectDifficulty").empty();

    for (let i = 0; i < difficulties.length; i++) {

        let element = document.createElement("option");
        element.innerHTML = difficulties[i][0];
        element.setAttribute("value", i);
        $("#selectDifficulty").append(element);

    }

}

$(document).ready(async function() {

    await getData();

    updateDifficultySelect();

});

$("#buttonDecrease").click(function() {

    let questions = Number($("#inputQuestions").val());

    if (Number.isInteger(questions) && QuestionsMin < questions && questions <= QuestionsMax) {
        $("#inputQuestions").val(questions - 1);
    }

});

$("#buttonIncrease").click(function() {

    let questions = Number($("#inputQuestions").val());

    if (Number.isInteger(questions) && QuestionsMin <= questions && questions < QuestionsMax) {
        $("#inputQuestions").val(questions + 1);
    }

});

$("#buttonStartQuiz").click(function() {

    let questions = Number($("#inputQuestions").val());
    let language = Number($("#selectLanguage").val());
    let difficulty = Number($("#selectDifficulty").val());

    if (Number.isInteger(questions) && QuestionsMin <= questions && questions <= QuestionsMax) {

        $("#menu").hide();
        $("#quiz").show();
        newGame(questions, language, difficulty);

    }
    else {

        let text = "Input must be a number between " + QuestionsMin + " and " + QuestionsMax;

        let element = document.createElement("p");
        element.setAttribute("class", "wrong-input-message");
        element.innerHTML = text;

        $("#inputQuestions").tooltip({
            trigger: "manual",
            html: true,
            title: element.outerHTML
        }).tooltip("show");

    }

});

$("#inputQuestions").focus(function() {

    $("#inputQuestions").tooltip("hide");

});

$("#inputWord").keyup(function (event) {

    if (event.keyCode === 13) {
        check();
    }

});

$("#buttonNextQuestion").click(function () {

    QuestionNumber++;
    if (QuestionNumber < QuestionsAmount) {
        nextQuestion();
    }
    else {

        $("#quiz").hide();
        $("#results").show();
        viewResults();

    }

});

$("#buttonNewQuiz").click(function() {

    $("#results").hide();
    $("#menu").show();
    $("#buttonStartQuiz").focus();

});

$("#selectLanguage").change(updateDifficultySelect);
