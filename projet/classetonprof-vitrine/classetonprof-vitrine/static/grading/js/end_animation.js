//Fonction qui s'execute à la fin de l'animation !
const animated = document.getElementById("middle_div");

end_animation=true
second_animation_turn=false //True si c'est la fin de la seconde animation
//Add animation event listener, with attached function.
animated.addEventListener('animationend', () => {
  console.log('Animation ended');
  if (second_animation_turn) {
    set_info(liste_visible, index);
    set_variable_px();
    second_animation_turn=false;
    end_animation=true;
  } else if (window.innerWidth <= 600 && second_animation_turn==false) {
    //On mobile
    set_info(liste_visible, index)
    second_animation_turn=true
    div = document.getElementById("middle_div")
    div.style.animation = 'none';
    div.offsetHeight;
    div.style.animation = null;
    div.style.animation = "middle_reapear " + animation_time + "s"
  } else {
    set_info(liste_visible, index)
    set_variable_px()
    end_animation=true
  }
});