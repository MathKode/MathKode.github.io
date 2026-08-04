function printMousePos(event) {
    if (window.innerWidth <= 600) {
        //Site sur tel
        if ((index+1)<liste_visible.length) {
            document.getElementById('bt1').style.opacity = 0.8;
        } else {
            document.getElementById('bt1').style.opacity = 0;
        }
        if (index != 0) {
            document.getElementById('bt2').style.opacity = 0.8;
        } else {
            document.getElementById('bt2').style.opacity = 0;
        }   
    } else {
        mouse_x = event.clientX;
        //mouse_y = event.clientY;
        
        //Calcul 45% de l'écran X
        size = Number(window.innerWidth*0.42) //Activation de l'effet
        size2 = Number(window.innerWidth*0.17) //Zone ou l'opacité est de 100%

        //Distance mouse -> Button right
        x_bt = document.getElementById('bt1').getBoundingClientRect().left;
        dif = x_bt-mouse_x;
        //120px = 0% visible
        //40px = 100% visible
        if (dif<size && (index+1)<liste_visible.length) {
            dif= dif - size2
            if (dif>0) {
                value = 1 - dif/(size-size2)
            } else {
                value = 1
            }

            //PAS DE SMOOTH SHADOW ENTER (ligne qui suit à supprimer si on veut un smooth shadow)
            value=1

            document.getElementById('bt1').style.opacity = value;
        } else {
            //PAS DE SMOOTH SHADOW ENTER (ligne qui suit à supprimer si on veut un smooth shadow)
            value=1

            document.getElementById('bt1').style.opacity = 0;
        }


        //SAME POUR LE BOUTTON 2

        x_bt = document.getElementById('bt2').getBoundingClientRect().left;
        dif = mouse_x-x_bt;
        //120px = 0% visible
        //40px = 100% visible
        if (dif<size && index != 0) {
            dif= dif - 120
            if (dif>0) {
                value = 1 - dif/(size-120)
            } else {
                value = 1
            }

            //PAS DE SMOOTH SHADOW ENTER (ligne qui suit à supprimer si on veut un smooth shadow)
            value=1

            document.getElementById('bt2').style.opacity = value;
        } else {
            //PAS DE SMOOTH SHADOW ENTER (ligne qui suit à supprimer si on veut un smooth shadow)
            value=1
            
            document.getElementById('bt2').style.opacity = 0;
        }
    }
}

document.addEventListener("mousemove", printMousePos);
document.getElementById('bt1').addEventListener("click", printMousePos);
document.getElementById('bt2').addEventListener("click", printMousePos);