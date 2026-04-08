const grid = document.getElementById("grid");
const slidesContainer = document.getElementById("slides");

fetch("data-r.json")
.then(res => res.json())
.then(data => {

    data.forEach(item => {
        const card = document.createElement("div");
        card.className = "card";

        card.innerHTML = `
            <a href="${item.link}">
                <div class="thumb">
                    <img src="${item.img}" loading="lazy">
                    <div class="label">${item.label}</div>
                </div>
                <div class="card-title">${item.title}</div>
            </a>
        `;

        grid.appendChild(card);
    });

    data.slice(0,5).forEach(item => {
        const slide = document.createElement("div");
        slide.className = "slide";
        slide.style.backgroundImage = `url(${item.img})`;

        slide.innerHTML = `
<div class="slide-content">
    <div class="slide-info">

        <div class="slide-label">${item.label}</div>

        <div class="slide-title">${item.title}</div>

        <div class="slide-desc">
            ${item.desc || "Sin descripción disponible"}
        </div>

        <div class="slide-buttons">
<div class="slide-buttons">

    <a href="${item.play}" class="btn play">
        <i class="fa-solid fa-circle-play"></i> Ver ahora
    </a>

    <a href="${item.info}" class="btn info">
        <i class="fa-solid fa-circle-info"></i> Detalles
    </a>

</div>

    </div>
</div>
`;

        slidesContainer.appendChild(slide);
    });

    initSlider();
});

let index = 0;
let interval;

function showSlide() {
    const total = document.querySelectorAll(".slide").length;
    if (index >= total) index = 0;
    if (index < 0) index = total - 1;

    document.getElementById("slides").style.transform =
        `translateX(-${index * 100}%)`;
}

function moveSlide(n) {
    index += n;
    showSlide();
    resetInterval();
}

function autoSlide() {
    index++;
    showSlide();
}

function resetInterval() {
    clearInterval(interval);
    interval = setInterval(autoSlide, 4000);
}

interval = setInterval(autoSlide, 4000);
