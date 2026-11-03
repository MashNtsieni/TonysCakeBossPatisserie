function initializeLightbox() {
    const gallery = document.querySelector(".gallery");
    const lightbox = document.querySelector(".lightbox");

    if (!gallery || !(lightbox instanceof HTMLDialogElement)) {
        return;
    }

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

function initializeForms() {
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
                const response = await fetch(form.action, {
                    method: "POST",
                    body: new FormData(form),
                    headers: {
                        Accept: "application/json"
                    }
                });

                if (!response.ok) {
                    status.textContent = `Submission failed (HTTP ${response.status}). Please try again.`;
                    status.classList.add("is-error");
                    return;
                }

                form.reset();
                status.textContent = formType === "order"
                    ? "Your order request was sent successfully. We will be in touch soon."
                    : "Your message was sent successfully. We will be in touch soon.";
            } catch {
                status.textContent = "We couldn't connect to submit your form. Check your connection and try again.";
                status.classList.add("is-error");
            } finally {
                submitButton.disabled = false;
                form.removeAttribute("aria-busy");
            }
        });
    });
}

function updateDocumentMetadata(nextDocument) {
    document.title = nextDocument.title;

    ["description", "keywords"].forEach((name) => {
        const incoming = nextDocument.querySelector(`meta[name="${name}"]`);
        const current = document.querySelector(`meta[name="${name}"]`);

        if (incoming && current) {
            current.content = incoming.content;
        } else if (incoming) {
            document.head.append(document.importNode(incoming, true));
        } else if (current) {
            current.remove();
        }
    });
}

function updateCurrentNavigation() {
    document.querySelectorAll(".main-nav a[href]").forEach((link) => {
        const destination = new URL(link.href, window.location.href);
        if (destination.pathname === window.location.pathname) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
    });
}

let activeNavigation;

async function loadPage(url, { updateHistory = true } = {}) {
    activeNavigation?.abort();
    const request = new AbortController();
    activeNavigation = request;
    document.querySelector("main")?.setAttribute("aria-busy", "true");

    try {
        const response = await fetch(url.href, { signal: request.signal });
        if (!response.ok) {
            throw new Error(`Page request failed with HTTP ${response.status}.`);
        }

        const page = new DOMParser().parseFromString(await response.text(), "text/html");
        const newMain = page.querySelector("main");
        const currentMain = document.querySelector("main");
        if (!newMain || !currentMain) {
            throw new Error("The requested page does not contain a main content section.");
        }

        currentMain.replaceWith(document.importNode(newMain, true));

        const currentLightbox = document.querySelector("dialog.lightbox");
        const newLightbox = page.querySelector("dialog.lightbox");
        if (newLightbox) {
            const importedLightbox = document.importNode(newLightbox, true);
            if (currentLightbox) {
                currentLightbox.replaceWith(importedLightbox);
            } else {
                document.body.append(importedLightbox);
            }
        } else {
            currentLightbox?.remove();
        }

        updateDocumentMetadata(page);
        if (updateHistory) {
            window.history.pushState({}, "", url.href);
        }
        updateCurrentNavigation();
        initializeLightbox();
        initializeForms();
        window.scrollTo(0, 0);

        const loadedMain = document.querySelector("main");
        loadedMain.removeAttribute("aria-busy");
        loadedMain.setAttribute("tabindex", "-1");
        loadedMain.focus({ preventScroll: true });
    } catch (error) {
        if (error.name === "AbortError") {
            return;
        }

        console.error("Unable to load page dynamically; falling back to normal navigation.", error);
        window.location.assign(url.href);
    } finally {
        if (activeNavigation === request) {
            activeNavigation = undefined;
            document.querySelector("main")?.removeAttribute("aria-busy");
        }
    }
}

document.addEventListener("click", (event) => {
    if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
    ) {
        return;
    }

    const link = event.target instanceof Element
        ? event.target.closest("a[href]")
        : null;
    if (!link || link.target || link.hasAttribute("download")) {
        return;
    }

    const url = new URL(link.href, window.location.href);
    if (
        url.origin !== window.location.origin ||
        !url.pathname.endsWith(".html") ||
        url.hash
    ) {
        return;
    }

    event.preventDefault();
    loadPage(url);
});

window.addEventListener("popstate", () => {
    loadPage(new URL(window.location.href), { updateHistory: false });
});

initializeLightbox();
initializeForms();
updateCurrentNavigation();
