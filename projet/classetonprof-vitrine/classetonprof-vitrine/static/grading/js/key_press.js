function wait(ms){
    var start = new Date().getTime();
    var end = start;
    while(end < start + ms) {
      end = new Date().getTime();
   }
}

if (window.innerWidth <= 600) {
    //On phone
    animation_time = 0.3
} else {
    animation_time = 0.7
}


function animation_set(name_next, name_middle, name_old, long_div) {

    div_next = document.getElementById("next_div")
    div_next.style.animation = 'none';
    div_next.offsetHeight;
    div_next.style.animation = null;
    div_next.style.animation = name_next + " " + animation_time + "s"

    div_middle = document.getElementById("middle_div")
    div_middle.style.animation = 'none';
    div_middle.offsetHeight;
    div_middle.style.animation = null;
    div_middle.style.animation = name_middle + " " + animation_time + "s"

    div_old = document.getElementById("old_div")
    div_old.style.animation = 'none';
    div_old.offsetHeight;
    div_old.style.animation = null;
    div_old.style.animation = name_old + " " + animation_time + "s"

    div_anim = document.getElementById(long_div)
    div_anim.style.animation = 'none';
    div_anim.offsetHeight;
    div_anim.style.animation = null;
    div_anim.style.animation = long_div + " " + animation_time + "s"
}

function left_arrow() {
    if (end_animation == true) {
        if (index>0) {
            index=index-1;
            animation_set("next_old","middle_old","old_old","old_old_div")
            end_animation = false;
        } else {
            console.log("STOP you're out of the list")
        }
    } else {
        console.log("Wait the end of animation")
    }
}

function right_arrow() {
    if (end_animation == true) {
        if (index<liste_visible.length-1) {
            index=index+1;
            animation_set("next_next","middle_next","old_next","next_next_div")
            end_animation=false
        } else {
            console.log("STOP we can't show on your rigth")
        }
    } else {
        console.log("WAIT the end of animation")
    }
}
document.getElementById("bt1").addEventListener("click", right_arrow, false);
document.getElementById("bt2").addEventListener("click", left_arrow, false);

document.onkeydown = checkKey;

function checkKey(e) {
    //SUPP le tuto si ce n'est pas déjà fait
    var screen = document.querySelector("#tuto-wrapper");
    screen.style = "display:none;"

     e = e || window.event;
    

     if (e.keyCode == '38') {
        // up arrow
     }
     else if (e.keyCode == '32') {
        // Space Press = SUPP le tuto

     }
     else if (e.keyCode == '37') {
        // left arrow
        left_arrow()
        //set_info(liste, index)
         
     }
     else if (e.keyCode == '39') {
        // right arrow NEXT MOVE
        right_arrow()
        //Animation du movement
        
        //Change de personne
        // -> Voir le code animates.addEventListener('animatedend')
     }
 
 }