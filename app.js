const grid = document.getElementById("grid");
const slidesContainer = document.getElementById("slides");

fetch("data-r.json")
.then(res => res.json())
.then(data => {

    data.forEach(item => {
        const card = document.createElement("div");
        card.className = "card";

card.innerHTML = `
    <a href="${item.play}">
        <div class="thumb">

            <img src="${item.img}" loading="lazy">

            <div class="label lang">
                ${item.label}
            </div>

            <div class="label ep">
                ${item.ep}
            </div>

        </div>

        <div class="card-title">
            ${item.title}
        </div>
    </a>
`;
        grid.appendChild(card);
    });

    data.forEach(item => {
        const slide = document.createElement("div");
        slide.className = "slide";
        slide.style.backgroundImage = `url(${item.img})`;

        slide.innerHTML = `
<div class="slide-content">
    <div class="slide-info">

        <div class="slide-top-tags">

    <div class="slide-label lang">
        ${item.label}
    </div>

    <div class="slide-label ep">
        ${item.ep}
    </div>

</div>

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
let slides = [];
let interval;

function initSlider() {
    slides = document.querySelectorAll(".slide");

    if (slides.length === 0) return;

    slides[0].classList.add("active");

    startAuto();
}

function showSlide(i) {
    slides.forEach(s => s.classList.remove("active"));

    index = (i + slides.length) % slides.length;

    slides[index].classList.add("active");
}

function moveSlide(n) {
    showSlide(index + n);
    resetAuto();
}

function startAuto() {
    interval = setInterval(() => {
        showSlide(index + 1);
    }, 4000);
}

function resetAuto() {
    clearInterval(interval);
    startAuto();
}
