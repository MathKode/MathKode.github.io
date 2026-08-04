/* Pour faire du drag n drop */
const rows = document.querySelectorAll(".row");
const board = document.querySelector("#board");
const colors = ["red", "orange", "yellow", "green", "aquamarine", "violet"];

const onDragOver = (event) => {
    event.preventDefault();
}

const onDrop = (event) => {
    event.preventDefault();
    const draggedCardId = event.dataTransfer.getData("id");
    const draggedCard = document.getElementById(draggedCardId);

    const cardsContainer = event.target.closest(".cards-container");

    if (cardsContainer) {
        cardsContainer.appendChild(draggedCard);
        console.log("Element drop");
    }

    const bank = event.target.closest("#bank");

    if (bank) {
        bank.appendChild(draggedCard);
        console.log("Element drop");
    }
};

rows.forEach((row, index) => {
    const label = row.querySelector(".label");
    label.style.backgroundColor = colors[index];
    row.ondragover = onDragOver;
    row.ondrop = (event) => {
        onDrop(event);
    };
})
