function set_matiere(div_name,number){
    //Définit la matière en fonction du numéro
    dic_name = {1:"Maths",
              2:"SVT",
              3:"Physique-Chimie",
              4:"Anglais",
              5:"Espagnol",
              6:"Allemand",
              7:"Philo",
              8:"Histoire-Géo",
              9:"EMC",
              10:"Musique",
              11:"Art",
              12:"EPS"};
    dic_picture={1:"math.png",
              2:"biochimie.png",
              3:"chimie.png",
              4:"ang.png",
              5:"esp.png",
              6:"all.png",
              7:"philo.png",
              8:"geo.png",
              9:"emc.png",
              10:"musique.png",
              11:"arts.png",
              12:"eps.png"};
    dic_color={1:"#2BFF99",
              2:"#83FFB1",
              3:"#83C3FF",
              4:"#43EAFF",
              5:"#FFF786",
              6:"#FFC6AD",
              7:"#2BFF99",
              8:"#2BFF99",
              9:"#FFFFFF",
              10:"#2BFF99",
              11:"#2BFF99",
              12:"#C3F6FF"};
    div = document.getElementById(div_name); //icon ; icon_old ; icon_next
    div.style.background = dic_color[Number(number)]
    link = static_url + "grading/icon_grading/" + dic_picture[Number(number)]
    div.children[0].src = link
    
    div.children[1].innerText = dic_name[Number(number)];
}