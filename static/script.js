const translationForm = document.getElementById('translationForm');
const fileInput = document.getElementById('audioFile');
const fileButton = document.getElementById('fileButton');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const resultCard = document.getElementById('resultCard');
const originalText = document.getElementById('originalText');
const translatedText = document.getElementById('translatedText');
const translatedAudio = document.getElementById('translatedAudio');
const submitBtn = document.getElementById('submitBtn');
const newTranslationBtn = document.getElementById('newTranslationBtn');
let loadingModal;


document.addEventListener('DOMContentLoaded', function() {
    loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'));

    // Selector de archivos
    fileButton.addEventListener('click', function() {
        fileInput.click();
    });

    fileInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const fileName = this.files[0].name;
            fileNameDisplay.value = fileName;
            fileNameDisplay.classList.add('text-success');
            fileButton.innerHTML = '<i class="fas fa-check me-2"></i> Archivo seleccionado';
            fileButton.classList.remove('btn-outline-primary');
            fileButton.classList.add('btn-outline-success');
        } else {
            fileNameDisplay.value = 'Ningún archivo seleccionado';
            fileNameDisplay.classList.remove('text-success');
            fileButton.innerHTML = '<i class="fas fa-upload me-2"></i> Seleccionar archivo';
            fileButton.classList.remove('btn-outline-success');
            fileButton.classList.add('btn-outline-primary');
        }
    });

    translationForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (!fileInput.files || !fileInput.files[0]) {
            showAlert('Por favor, selecciona un archivo de audio.');
            return;
        }

        const originalLanguage = document.getElementById('originalLanguage').value;
        const targetLanguage = document.getElementById('targetLanguage').value;

        if (!originalLanguage || !targetLanguage) {
            showAlert('Por favor, selecciona los idiomas original y destino.');
            return;
        }

        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        formData.append('original_language', originalLanguage);
        formData.append('target_language', targetLanguage);

        try {
            loadingModal.show();

            const response = await fetch('/translate-audio/', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const data = await response.json();

                originalText.textContent = data.texto_original;
                translatedText.textContent = data.texto_traducido;
                translatedAudio.src = data.audio_traducido;

                resultCard.style.display = 'block';

                resultCard.scrollIntoView({ behavior: 'smooth' });
            } else {
                let errorMessage = 'Ocurrió un error al procesar el audio.';
                try {
                    const errorData = await response.json();
                    if (errorData.detail) {
                        errorMessage = `Error: ${errorData.detail}`;
                    }
                } catch (e) {
                }
                showAlert(errorMessage);
            }
        } catch (error) {
            console.error('Error:', error);
            showAlert('Ocurrió un error al comunicarse con el servidor.');
        } finally {
            loadingModal.hide();
        }
    });

    newTranslationBtn.addEventListener('click', function() {
        translationForm.reset();
        fileNameDisplay.value = 'Ningún archivo seleccionado';
        fileNameDisplay.classList.remove('text-success');
        fileButton.innerHTML = '<i class="fas fa-upload me-2"></i> Seleccionar archivo';
        fileButton.classList.remove('btn-outline-success');
        fileButton.classList.add('btn-outline-primary');

        resultCard.style.display = 'none';

        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});

function showAlert(message) {
    alert(message);
}