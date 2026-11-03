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

document.querySelectorAll("form[data-validate-form]").forEach((form) => {
    const status = form.querySelector("[data-form-status]");
    const controls = Array.from(form.querySelectorAll("input, select, textarea"));

    if (!status) {
        return;
    }

    const updateWhitespaceValidity = (control) => {
        if (control.matches('input[type="text"], input[type="email"], input[type="tel"], textarea')) {
            control.setCustomValidity(
                control.value.length > 0 && control.value.trim().length === 0
                    ? "Please enter more than whitespace."
                    : ""
            );
        }
    };

    const pickupDate = form.querySelector("#pickup-date");
    if (pickupDate) {
        const today = new Date();
        const localToday = [
            today.getFullYear(),
            String(today.getMonth() + 1).padStart(2, "0"),
            String(today.getDate()).padStart(2, "0")
        ].join("-");
        pickupDate.min = localToday;
    }

    controls.forEach((control) => {
        control.addEventListener("input", () => {
            updateWhitespaceValidity(control);
            status.textContent = "";
            status.classList.remove("is-error");
        });
        control.addEventListener("change", () => updateWhitespaceValidity(control));
        control.addEventListener("invalid", () => {
            status.textContent = "Please review the highlighted fields and try again.";
            status.classList.add("is-error");
        });
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        controls.forEach(updateWhitespaceValidity);

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formType = form.dataset.validateForm;
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        form.setAttribute("aria-busy", "true");
        status.classList.remove("is-error");
        status.textContent = formType === "order"
            ? "Submitting your order..."
            : "Sending your message...";

        try {
            let response;
            try {
                response = await fetch(form.action, {
                    method: "POST",
                    body: new FormData(form),
                    headers: {
                        Accept: "application/json"
                    }
                });
            } catch {
                status.textContent = "We couldn't connect to submit your form. Check your connection and try again.";
                status.classList.add("is-error");
                return;
            }

            if (!response.ok) {
                status.textContent = `Submission failed (HTTP ${response.status}). Please try again.`;
                status.classList.add("is-error");
                return;
            }

            form.reset();
            status.textContent = formType === "order"
                ? "Your order request was sent successfully. We will be in touch soon."
                : "Your message was sent successfully. We will be in touch soon.";
        } finally {
            submitButton.disabled = false;
            form.removeAttribute("aria-busy");
        }
    });
});
