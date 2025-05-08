// On récupère les éléments HTML : le conteneur et l'image
const container = document.getElementById("test");
const img = document.getElementById("pic1");

// Événement déclenché quand la souris bouge dans le conteneur
container.addEventListener("mousemove", (e) => {
    // Récupère les dimensions et la position du conteneur par rapport à la fenêtre
    const rect = container.getBoundingClientRect();

    // Coordonnées du curseur par rapport au coin supérieur gauche du conteneur
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Centre du conteneur (point d'équilibre pour l'inclinaison)
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Pourcentage de déplacement du curseur par rapport au centre, entre -1 et 1
    const percentX = (x - centerX) / centerX;
    const percentY = (y - centerY) / centerY;

    // Calcule l'inclinaison verticale et horizontale en fonction de la position du curseur
    const rotateX = -percentY * 40; // incline vers le haut/bas (axe X)
    const rotateY = percentX * 40;  // incline vers la gauche/droite (axe Y)

    // Applique la transformation 3D à l'image
    img.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
});

// Quand la souris sort du conteneur, on réinitialise la rotation
container.addEventListener("mouseleave", () => {
    img.style.transform = `rotateX(0deg) rotateY(0deg)`;
});


console.log('JS coded is up !')