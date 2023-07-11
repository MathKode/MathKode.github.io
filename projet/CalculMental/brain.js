function centered() {
    var page_height = window.innerHeight
                || document.documentElement.clientHeight
                || document.body.clientHeight;
    //alert(page_height)
    document.getElementById("centered_div").style.height = page_height + "px";
    //alert(document.getElementById("centered_div").style.height)
}
const align_height = setInterval(centered, 3000);

function apparition(question_vr,nb1,nb2) {
    document.getElementById("question_h1").innerText = question_vr
}

function save_result(result) {
    document.getElementById("result").innerHTML = result
}

function question() {
    sign=Math.floor(Math.random()*4)
    if (sign===1 || sign===2) {
        // + ou -
        nb1 = Math.floor(Math.random()*10000)
        nb2 = Math.floor(Math.random()*10000)
        if (sign===1) {
            result = nb1 + nb2
        } else {
            result = nb1 - nb2
        }
    } else {
        // * ou /
        nb1 = Math.floor(Math.random()*100)
        nb2 = Math.floor(Math.random()*12)
        if (sign===0) {
            result = nb1 * nb2
        } else {
            nb2 = Math.floor(Math.random()*12) + 1
            result = Math.floor(nb1 / nb2)
        }
    }
    real_sign = [" * "," + "," - "," / "][sign]
    question_vr = nb1 +real_sign + nb2
    apparition(question_vr,nb1,nb2)
    save_result(result)
}

function reset() {
    document.getElementById("answer_input").value = "";
}

function increase_score() {
    old = Number(document.getElementById("score").innerHTML);
    n = old + 1;
    document.getElementById("score").innerHTML = n;
}

function right() {
    body = document.getElementsByTagName('body')[0]
    body.style.animation = 'none';
    body.offsetHeight;
    body.style.animation = null;
    body.style.animation = "green_answer 2s"
}

function input_change() {
    response = document.getElementById("answer_input").value;
    answer = document.getElementById("result").innerHTML
    if (response===answer) {
        //alert("RIGHT")
        right()
        reset()
        increase_score()
        question()
    }
}
const verif = setInterval(input_change, 10)


document.onload = function() {
    centered()
    question()
}()
