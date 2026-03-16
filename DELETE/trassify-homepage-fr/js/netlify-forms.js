(function () {
  function setVisible(element, visible) {
    if (!element) return;
    element.style.display = visible ? "block" : "none";
  }

  function setSubmittingState(button, isSubmitting) {
    if (!button) return;
    if (!button.dataset.originalLabel) {
      button.dataset.originalLabel = button.value || button.textContent || "";
    }

    if (button.tagName === "INPUT") {
      button.value = isSubmitting
        ? button.getAttribute("data-wait") || "Bitte warten..."
        : button.dataset.originalLabel;
    } else {
      button.textContent = isSubmitting
        ? button.getAttribute("data-wait") || "Bitte warten..."
        : button.dataset.originalLabel;
    }

    button.disabled = isSubmitting;
  }

  function showSubmissionState(form, state) {
    var formWrapper = form.closest(".w-form");
    if (!formWrapper) return;

    var success = formWrapper.querySelector(".w-form-done");
    var error = formWrapper.querySelector(".w-form-fail");

    setVisible(success, state === "success");
    setVisible(error, state === "error");
    form.style.display = state === "success" ? "none" : "";
  }

  function encodeFormData(form) {
    var formData = new FormData(form);

    if (!formData.has("form-name")) {
      formData.append("form-name", form.getAttribute("name") || "");
    }

    return new URLSearchParams(formData).toString();
  }

  document.addEventListener("DOMContentLoaded", function () {
    var isLocalPreview =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "::1";

    var forms = document.querySelectorAll("form[data-netlify='true']");

    forms.forEach(function (form) {
      showSubmissionState(form, "idle");

      if (isLocalPreview) return;

      form.addEventListener(
        "submit",
        function (event) {
          event.preventDefault();
          event.stopImmediatePropagation();

          var submitButton =
            event.submitter ||
            form.querySelector('input[type="submit"], button[type="submit"]');

          showSubmissionState(form, "idle");
          setSubmittingState(submitButton, true);

          fetch("/", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: encodeFormData(form),
          })
            .then(function (response) {
              if (!response.ok) {
                throw new Error("Netlify form submission failed");
              }

              form.reset();
              showSubmissionState(form, "success");
            })
            .catch(function () {
              showSubmissionState(form, "error");
            })
            .finally(function () {
              setSubmittingState(submitButton, false);
            });
        },
        true
      );
    });
  });
})();
