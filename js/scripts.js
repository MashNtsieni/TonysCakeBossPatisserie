const gallery = document.querySelector(".gallery");
const lightbox = document.querySelector(".lightbox");

if (gallery && lightbox instanceof HTMLDialogElement) {
    const triggers = Array.from(gallery.querySelectorAll(".lightbox-trigger"));
    const image = lightbox.querySelector(".lightbox-image");
    const caption = lightbox.querySelector(".lightbox-caption");
    const counter = lightbox.querySelector(".lightbox-counter");
    const closeButton = lightbox.querySelector(".lightbox-close");
    const previousButton = lightbox.querySelector(".lightbox-previous");
    const nextButton = lightbox.querySelector(".lightbox-next");
    let activeIndex = 0;

    const showImage = (index) => {
        activeIndex = index;
        const thumbnail = triggers[activeIndex].querySelector("img");
        image.src = thumbnail.currentSrc || thumbnail.src;
        image.alt = thumbnail.alt;
        caption.textContent = thumbnail.alt;
        counter.textContent = `Image ${activeIndex + 1} of ${triggers.length}`;
        previousButton.disabled = activeIndex === 0;
        nextButton.disabled = activeIndex === triggers.length - 1;
    };

    triggers.forEach((trigger, index) => {
        trigger.addEventListener("click", () => {
            showImage(index);
            lightbox.showModal();
            closeButton.focus();
        });
    });

    closeButton.addEventListener("click", () => lightbox.close());
    previousButton.addEventListener("click", () => showImage(activeIndex - 1));
    nextButton.addEventListener("click", () => showImage(activeIndex + 1));

    lightbox.addEventListener("click", (event) => {
        if (event.target === lightbox) {
            lightbox.close();
        }
    });

    lightbox.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft" && activeIndex > 0) {
            event.preventDefault();
            showImage(activeIndex - 1);
        } else if (event.key === "ArrowRight" && activeIndex < triggers.length - 1) {
            event.preventDefault();
            showImage(activeIndex + 1);
        }
    });
}