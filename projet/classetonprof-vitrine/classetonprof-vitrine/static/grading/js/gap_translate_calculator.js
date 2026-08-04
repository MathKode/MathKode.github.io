// Set the translate variable use in css
function set_variable_px() {
    //Set the tuto espacement
    document.documentElement.style.setProperty('--tuto-top', document.getElementById('middle_div').getBoundingClientRect().top + "px");
    
    if (window.innerWidth > 600 ) {
        window.scrollTo(0, 0); //Scroll to the top
    }
    
    if (window.innerWidth <= 600) {
        //alert("on phone")
        console.log("Site consulté sur tel")
        document.documentElement.style.setProperty('--translate-x', (window.innerWidth+20)+"px");
        document.documentElement.style.setProperty('--translate-y', "0px");
        document.documentElement.style.setProperty('--angle', "0deg");
    } else {
        //Consulté sur ordinateur
        //DIV NEXT
        center_x = window.innerWidth / 2;
        //bottom_middle = document.getElementById('middle_div').getBoundingClientRect().bottom/3;
        bottom_middle=100 + (window.innerHeight - document.getElementById('middle_div').getBoundingClientRect().bottom)
        document.documentElement.style.setProperty('--translate-x', (center_x+20)+"px");
        document.documentElement.style.setProperty('--translate-y', bottom_middle+"px");

        //Set variable title school
        space = Number(window.innerWidth - document.getElementById('logo').getBoundingClientRect().right);
        console.log(space)
        if (space < 100) {
            space = 100
        } 
        console.log('Space ' + space)
        document.documentElement.style.setProperty('--title-x', space+"px");
        document.documentElement.style.setProperty('--angle', "23deg");
    }
}
set_variable_px()

const scrollTOP = setInterval(function() {
    if (window.innerWidth > 600){
        window.scrollTo(0, 0);
    } 
}, 5000);