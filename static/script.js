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
const recordButton = document.getElementById('recordButton');
const stopRecordingBtn = document.getElementById('stopRecordingBtn');
const recordingControls = document.getElementById('recordingControls');
const recordingPreview = document.getElementById('recordingPreview');
const recordedAudio = document.getElementById('recordedAudio');
const useRecordingBtn = document.getElementById('useRecordingBtn');
const discardRecordingBtn = document.getElementById('discardRecordingBtn');
const recordingTime = document.getElementById('recordingTime');

let loadingModal;
let audioContext;
let recorder;
let input;
let recordingInterval;
let secondsRecorded = 0;

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

    // Eventos para grabación de audio
    recordButton.addEventListener('click', startRecording);
    stopRecordingBtn.addEventListener('click', stopRecording);
    useRecordingBtn.addEventListener('click', useRecording);
    discardRecordingBtn.addEventListener('click', discardRecording);

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
                    // Si no podemos parsear el JSON, usamos el mensaje genérico
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

// Función para mostrar alertas
function showAlert(message) {
    alert(message);
}

// Función para actualizar el tiempo de grabación
function updateRecordingTime() {
    secondsRecorded++;
    const minutes = Math.floor(secondsRecorded / 60).toString().padStart(2, '0');
    const seconds = (secondsRecorded % 60).toString().padStart(2, '0');
    recordingTime.textContent = `${minutes}:${seconds}`;
}

// Función para detener la grabación
function stopRecording() {
    if (recorder && recorder.recording) {
        recorder.stop();

        // Obtener el audio grabado
        recorder.exportWAV(function(blob) {
            recordedAudio.src = URL.createObjectURL(blob);
            recordingPreview.style.display = 'block';
        });

        // Detener el temporizador
        clearInterval(recordingInterval);
    }
}

// Función para iniciar la grabación
async function startRecording() {
    try {
        // Inicializar el AudioContext
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioContext();

        // Forzar la frecuencia de muestreo a 16kHz
        const originalSampleRate = audioContext.sampleRate;

        // Obtener el stream de audio
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });

        // Crear el nodo de entrada
        input = audioContext.createMediaStreamSource(stream);

        // Crear el grabador con configuración específica para Azure
        recorder = new Recorder(input, {
            numChannels: 1,           // Mono
            type: 'audio/wav',        // Formato WAV
            workerPath: '/static/js/recorderWorker.js' // Asegúrarte de que este archivo existe
        });

        // Iniciar la grabación
        recorder.record();

        // Mostrar controles de grabación
        recordingControls.style.display = 'block';
        recordButton.disabled = true;
        fileButton.disabled = true;

        // Iniciar temporizador
        secondsRecorded = 0;
        updateRecordingTime();
        recordingInterval = setInterval(updateRecordingTime, 1000);

        console.log(`Grabando audio con las siguientes configuraciones:
            Mono: Sí (1 canal),
            Frecuencia de muestreo original: ${originalSampleRate} Hz
            Frecuencia deseada: 16000 Hz`);

    } catch (err) {
        console.error('Error al acceder al micrófono:', err);
        showAlert('No se pudo acceder al micrófono. Por favor, asegúrate de que tienes un micrófono conectado y has dado permiso para usarlo.');
    }
}

// Función para usar la grabación
function useRecording() {
    if (recorder) {
        // Exportar el audio en formato WAV compatible con Azure
        recorder.exportWAV(function(blob) {
            // Convertir el blob si es necesario (remuestreo a 16kHz)
            convertBlobToAzureFormat(blob)
                .then(azureBlob => {
                    // Crear un nombre de archivo con timestamp
                    const timestamp = new Date().getTime();
                    const fileName = `grabacion_${timestamp}.wav`;

                    // Crear un archivo a partir del blob de audio
                    const audioFile = new File([azureBlob], fileName, {
                        type: 'audio/wav'
                    });

                    // Guardar el archivo en el input
                    try {
                        const dataTransfer = new DataTransfer();
                        dataTransfer.items.add(audioFile);
                        fileInput.files = dataTransfer.files;

                        // Actualizar la interfaz
                        fileNameDisplay.value = fileName;
                        fileNameDisplay.classList.add('text-success');
                        fileButton.innerHTML = '<i class="fas fa-check me-2"></i> Archivo seleccionado';
                        fileButton.classList.remove('btn-outline-primary');
                        fileButton.classList.add('btn-outline-success');

                        console.log("Archivo de audio preparado para Azure:", audioFile);
                    } catch (err) {
                        console.error('Error al procesar el archivo de audio:', err);
                        showAlert('Error al procesar la grabación. Por favor, intenta subir un archivo de audio directamente.');
                    }

                    // Ocultar controles de grabación y habilitar botones
                    resetRecordingUI();
                })
                .catch(error => {
                    console.error('Error al convertir audio:', error);
                    showAlert('Error al procesar la grabación. Por favor, intenta subir un archivo de audio directamente.');
                    resetRecordingUI();
                });
        });
    }
}

// Función para convertir el blob a formato compatible con Azure
async function convertBlobToAzureFormat(blob) {
    return new Promise((resolve, reject) => {
        // Crear un FileReader para leer el blob
        const reader = new FileReader();

        reader.onload = async function(event) {
            try {
                // Convertir el ArrayBuffer a AudioBuffer
                const audioBuffer = await audioContext.decodeAudioData(event.target.result);

                // Crear un nuevo AudioContext con la frecuencia de muestreo deseada
                const offlineCtx = new OfflineAudioContext(
                    1,                                             // Mono
                    audioBuffer.duration * 16000,                  // Duración total en muestras a 16kHz
                    16000                                          // Frecuencia de muestreo deseada
                );

                // Crear una fuente de audio desde el buffer
                const source = offlineCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(offlineCtx.destination);

                // Iniciar la fuente de audio (necesario para el remuestreo)
                source.start();

                // Realizar el renderizado offline
                const resampledBuffer = await offlineCtx.startRendering();

                // Convertir el AudioBuffer a WAV
                const wavBuffer = audioBufferToWav(resampledBuffer);

                // Crear un nuevo Blob con el WAV
                const azureBlob = new Blob([wavBuffer], { type: 'audio/wav' });
                resolve(azureBlob);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = function(error) {
            reject(error);
        };

        // Leer el blob como ArrayBuffer
        reader.readAsArrayBuffer(blob);
    });
}

// Función para convertir AudioBuffer a WAV
function audioBufferToWav(buffer) {
    // Información del formato WAV (necesitamos 16 bits, 16kHz, Mono)
    const numChannels = 1;
    const sampleRate = 16000;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = buffer.length * bytesPerSample;
    const chunkSize = 36 + dataSize;
    const arrayBuffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(arrayBuffer);

    // Escribir cabecera WAV conforme a especificaciones RIFF
    // "RIFF"
    view.setUint8(0, 0x52);
    view.setUint8(1, 0x49);
    view.setUint8(2, 0x46);
    view.setUint8(3, 0x46);
    // Tamaño del chunk
    view.setUint32(4, chunkSize, true);
    // "WAVE"
    view.setUint8(8, 0x57);
    view.setUint8(9, 0x41);
    view.setUint8(10, 0x56);
    view.setUint8(11, 0x45);
    // "fmt "
    view.setUint8(12, 0x66);
    view.setUint8(13, 0x6D);
    view.setUint8(14, 0x74);
    view.setUint8(15, 0x20);
    // Tamaño del subchunk fmt
    view.setUint32(16, 16, true);
    // Formato de audio (PCM = 1)
    view.setUint16(20, 1, true);
    // Número de canales
    view.setUint16(22, numChannels, true);
    // Frecuencia de muestreo
    view.setUint32(24, sampleRate, true);
    // Byte rate
    view.setUint32(28, byteRate, true);
    // Block align
    view.setUint16(32, blockAlign, true);
    // Bits por muestra
    view.setUint16(34, bitsPerSample, true);
    // "data"
    view.setUint8(36, 0x64);
    view.setUint8(37, 0x61);
    view.setUint8(38, 0x74);
    view.setUint8(39, 0x61);
    // Tamaño del subchunk data
    view.setUint32(40, dataSize, true);

    // Escribir los datos de audio
    const samples = buffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
        // Convertir de float32 [-1,1] a int16 [-32768, 32767]
        const sample = Math.max(-1, Math.min(1, samples[i]));
        const value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, value, true);
        offset += 2;
    }

    return arrayBuffer;
}

// Función para descartar la grabación
function discardRecording() {
    if (recorder) {
        recorder.clear();
    }
    resetRecordingUI();
}

// Función para resetear la interfaz de grabación
function resetRecordingUI() {
    recordingControls.style.display = 'none';
    recordingPreview.style.display = 'none';
    recordButton.disabled = false;
    fileButton.disabled = false;
    secondsRecorded = 0;
    recordingTime.textContent = '00:00';

    // Limpiar recursos de audio
    if (recorder) {
        recorder.clear();
    }
}