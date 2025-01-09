// Funktion zum Abrufen eines Abfrageparameters nach Name
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Funktion zum Extrahieren des Seitentitels aus der Referrer-URL
function getParentPageTitle() {
    const referrer = document.referrer;
    if (!referrer) {
        console.warn('Kein Referrer gefunden. Der übergeordnete Seitentitel kann nicht abgerufen werden.');
        return '';
    }

    try {
        const url = new URL(referrer);
        const pathSegments = url.pathname.split('/').filter(segment => segment.length > 0);

        // Suche nach dem Segment 'allgemeinbildung'
        const targetSegment = 'allgemeinbildung';
        const targetIndex = pathSegments.indexOf(targetSegment);

        if (targetIndex === -1) {
            console.warn(`Segment '${targetSegment}' wurde im Pfad der Referrer-URL nicht gefunden.`);
            return '';
        }

        // Extrahiere alle Segmente nach 'allgemeinbildung'
        const relevantSegments = pathSegments.slice(targetIndex + 1);

        if (relevantSegments.length === 0) {
            console.warn('Keine Pfadsegmente nach dem Zielsegment gefunden.');
            return '';
        }

        // Ersetze '+', '-', '_' durch Leerzeichen und dekodiere URI-Komponenten
        const formattedSegments = relevantSegments.map(segment => {
            return decodeURIComponent(segment.replace(/[-_+]/g, ' ')).replace(/\b\w/g, char => char.toUpperCase());
        });

        // Verbinde die Segmente mit ' - ' als Trenner
        const formattedTitle = formattedSegments.join(' - ');

        return formattedTitle;
    } catch (e) {
        console.error('Fehler beim Parsen der Referrer-URL:', e);
        return '';
    }
}

const STORAGE_PREFIX = 'boxsuk-assignment_'; // Eindeutiger Präfix für boxsuk
const assignmentId = getQueryParam('assignmentId') || 'defaultAssignment';
const parentTitle = getParentPageTitle();
const assignmentInfo = document.getElementById('assignmentInfo');

// Entferne das Präfix 'assignment', um das Suffix zu erhalten
// Anpassung: Verwende einen case-insensitive regulären Ausdruck
const assignmentSuffix = assignmentId.replace(/^assignment[_-]?/i, '');

// Setze den Text auf 'Textsorte: {Suffix}'
assignmentInfo.textContent = assignmentSuffix ? `Textsorte: ${assignmentSuffix}` : 'Textsorte';

// Initialisiere den Quill-Editor
const quill = new Quill('#answerBox', {
    theme: 'snow',
    placeholder: 'Gib hier deinen Text ein...',
    modules: {
        toolbar: [
            ['bold', 'italic', 'underline'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['clean']
        ]
    }
});

// Anzeigeelemente
const savedAnswerContainer = document.getElementById('savedAnswerContainer');
const savedAssignmentTitle = document.getElementById('savedAssignmentTitle');
const savedAnswer = document.getElementById('savedAnswer');
const copyAnswerBtn = document.getElementById('copyAnswerBtn');
const saveIndicator = document.getElementById('saveIndicator'); // Save Indicator Element

// Funktion zur Anzeige des gespeicherten Textes
function displaySavedAnswer(content) {
    // Kombiniere parentTitle und assignmentSuffix, falls verfügbar
    const titleText = parentTitle
        ? `${parentTitle}\nTextsorte: ${assignmentSuffix}`
        : `Textsorte: ${assignmentSuffix}`;
    savedAssignmentTitle.textContent = titleText;
    savedAnswer.innerHTML = content;
    savedAnswerContainer.style.display = 'block';
}

// Funktion zum Kopieren des Textes in die Zwischenablage
copyAnswerBtn.addEventListener('click', function() {
    const textToCopy = parentTitle
        ? `${parentTitle}\nTextsorte: ${assignmentSuffix}\n${quill.root.innerHTML}`
        : `Textsorte: ${assignmentSuffix}\n${quill.root.innerHTML}`;
    copyTextToClipboard(textToCopy);
});

// Funktion zum Kopieren von Text in die Zwischenablage
function copyTextToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function() {
            // Bestätigung entfernt
            console.log("Text erfolgreich kopiert");
        }, function(err) {
            console.error('Fehler beim Kopieren des Textes: ', err);
            fallbackCopyTextToClipboard(text);
        });
    } else {
        // Fallback zu execCommand
        fallbackCopyTextToClipboard(text);
    }
}

// Fallback-Funktion zum Kopieren von Text in die Zwischenablage
function fallbackCopyTextToClipboard(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    // Verstecke das Textarea-Element
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
        const successful = document.execCommand('copy');
        if (successful) {
            // Bestätigung entfernt
            console.log("Text erfolgreich kopiert (Fallback)");
        } else {
            throw new Error("Fallback-Kopieren nicht erfolgreich");
        }
    } catch (err) {
        console.error('Fehler beim Kopieren des Textes (Fallback): ', err);
        // Bestätigung entfernt
    }

    document.body.removeChild(textarea);
}

// Funktion zum Speichern des Textes in localStorage
function saveToLocal() {
    const htmlContent = quill.root.innerHTML;
    const textContent = quill.getText().trim();
    if (textContent === "") {
        // Bestätigung entfernt
        console.log("Versuch, mit leerem Textfeld zu speichern");
        return;
    }
    const storageKey = STORAGE_PREFIX + assignmentId;
    localStorage.setItem(storageKey, htmlContent);
    // Bestätigung entfernt
    console.log(`Text für ${storageKey} gespeichert`);
    displaySavedAnswer(htmlContent); // Aktualisiere die Anzeige des gespeicherten Textes
    showSaveIndicator(); // Zeige den "Gespeichert"-Hinweis
    loadAllAnswers(); // Aktualisiere die Liste aller gespeicherten Antworten
}

// Funktion zum Löschen aller gespeicherten Texte aus localStorage
function clearLocalStorage() {
    // Bestätigung entfernen
    // Entferne nur Schlüssel mit dem boxsuk-Präfix
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(STORAGE_PREFIX)) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    quill.setText(''); // Leere den Quill-Editor
    savedAnswerContainer.style.display = 'none';
    console.log("Alle gespeicherten boxsuk-Texte wurden gelöscht");
    loadAllAnswers(); // Aktualisiere die Liste aller gespeicherten Antworten
}

// Funktion zum Löschen aller Antworten (Bulk)
function clearAllLocalStorage() {
    if(confirm("Sind Sie sicher, dass Sie alle gespeicherten Antworten löschen möchten?")) {
        localStorage.clear();
        quill.setText(''); // Leere den Quill-Editor
        savedAnswerContainer.style.display = 'none';
        console.log("Alle localStorage-Elemente gelöscht");
        loadAllAnswers(); // Aktualisiere die Liste aller gespeicherten Antworten
    }
}

// Event Listener für den Button "Text drucken / als PDF speichern"
document.getElementById("downloadAllBtn").addEventListener('click', function() {
    const storageKeys = Object.keys(localStorage).filter(key => key.startsWith(STORAGE_PREFIX));

    console.log(`Gefundene ${storageKeys.length} gespeicherte boxsuk-Assignments zum Drucken`);
    if(storageKeys.length === 0) {
        console.log("Versuch, alle Texte zu drucken, aber keine sind gespeichert");
        alert("Keine gespeicherten Antworten zum Drucken oder Speichern als PDF.");
        return;
    }

    console.log("Drucken aller Texte wird initiiert");

    // Erstelle ein temporäres Div zum Drucken aller Texte
    const printAllContent = document.createElement('div');
    printAllContent.id = 'printAllContent';

    // Füge einmal den Titel der übergeordneten Seite hinzu
    if (parentTitle) {
        const parentTitleElement = document.createElement("h2");
        parentTitleElement.textContent = parentTitle;
        printAllContent.appendChild(parentTitleElement);
    }

    // Sortiere die storageKeys basierend auf der numerischen Komponente oder dem Suffix
    storageKeys.sort((a, b) => {
        const suffixA = a.replace(STORAGE_PREFIX, '');
        const suffixB = b.replace(STORAGE_PREFIX, '');
        return suffixA.localeCompare(suffixB, undefined, {numeric: true, sensitivity: 'base'});
    });

    storageKeys.forEach(assignmentKey => {
        const text = localStorage.getItem(assignmentKey);
        if(text) {
            const draftDiv = document.createElement("div");
            draftDiv.className = "draft";
            
            const assignmentSuffix = assignmentKey.replace(STORAGE_PREFIX, '');
            const title = document.createElement("h3");
            title.textContent = assignmentSuffix ? `Textsorte: ${assignmentSuffix}` : 'Textsorte';
            draftDiv.appendChild(title);
            
            const answerDiv = document.createElement("div");
            answerDiv.innerHTML = text; // HTML-Inhalt rendern
            draftDiv.appendChild(answerDiv);
            
            printAllContent.appendChild(draftDiv);
        }
    });

    // Füge zum Body hinzu
    document.body.appendChild(printAllContent);

    // Füge der Body-Klasse 'print-all' hinzu
    document.body.classList.add('print-all');

    window.print();

    // Entferne die Klasse 'print-all' und das printAllContent-Div nach dem Drucken
    document.body.classList.remove('print-all');
    document.body.removeChild(printAllContent);
});

// Event Listener für die neue "Alle Antworten drucken / Als PDF speichern" Schaltfläche
document.getElementById("downloadAllBtnBulk").addEventListener('click', function() {
    const storageKeys = Object.keys(localStorage).filter(key => key.startsWith(STORAGE_PREFIX));

    console.log(`Gefundene ${storageKeys.length} gespeicherte boxsuk-Assignments zum Drucken`);
    if(storageKeys.length === 0) {
        console.log("Versuch, alle Texte zu drucken, aber keine sind gespeichert");
        alert("Keine gespeicherten Antworten zum Drucken oder Speichern als PDF.");
        return;
    }

    console.log("Drucken aller Texte wird initiiert");

    // Erstelle ein temporäres Div zum Drucken aller Texte
    const printAllContent = document.createElement('div');
    printAllContent.id = 'printAllContent';

    // Füge einmal den Titel der übergeordneten Seite hinzu
    if (parentTitle) {
        const parentTitleElement = document.createElement("h2");
        parentTitleElement.textContent = parentTitle;
        printAllContent.appendChild(parentTitleElement);
    }

    // Sortiere die storageKeys basierend auf der numerischen Komponente oder dem Suffix
    storageKeys.sort((a, b) => {
        const suffixA = a.replace(STORAGE_PREFIX, '');
        const suffixB = b.replace(STORAGE_PREFIX, '');
        return suffixA.localeCompare(suffixB, undefined, {numeric: true, sensitivity: 'base'});
    });

    storageKeys.forEach(assignmentKey => {
        const text = localStorage.getItem(assignmentKey);
        if(text) {
            const draftDiv = document.createElement("div");
            draftDiv.className = "draft";
            
            const assignmentSuffix = assignmentKey.replace(STORAGE_PREFIX, '');
            const title = document.createElement("h3");
            title.textContent = assignmentSuffix ? `Textsorte: ${assignmentSuffix}` : 'Textsorte';
            draftDiv.appendChild(title);
            
            const answerDiv = document.createElement("div");
            answerDiv.innerHTML = text; // HTML-Inhalt rendern
            draftDiv.appendChild(answerDiv);
            
            printAllContent.appendChild(draftDiv);
        }
    });

    // Füge zum Body hinzu
    document.body.appendChild(printAllContent);

    // Füge der Body-Klasse 'print-all' hinzu
    document.body.classList.add('print-all');

    window.print();

    // Entferne die Klasse 'print-all' und das printAllContent-Div nach dem Drucken
    document.body.classList.remove('print-all');
    document.body.removeChild(printAllContent);
});

// Event Listener für die "Alle Antworten kopieren" Schaltfläche
document.getElementById("copyAllBtn").addEventListener('click', copyAllAnswersToClipboard);

// Event Listener für die "Alle auswählen" Checkbox
document.getElementById("selectAll").addEventListener('change', function() {
    const checkboxes = document.querySelectorAll(".select-answer");
    checkboxes.forEach(cb => cb.checked = this.checked);
    toggleBulkDeleteButton();
});

// Event Listener für die "Ausgewählte löschen" Schaltfläche
document.getElementById("bulkDeleteBtn").addEventListener('click', bulkDeleteAnswers);

// Funktion zum Laden und Anzeigen aller gespeicherten Antworten
function loadAllAnswers() {
    const draftContainer = document.getElementById("draftContainer");
    draftContainer.innerHTML = ""; // Container leeren

    const storageKeys = Object.keys(localStorage).filter(key => key.startsWith(STORAGE_PREFIX));

    console.log(`Gefundene ${storageKeys.length} gespeicherte boxsuk-Assignments`);

    if(storageKeys.length === 0) {
        draftContainer.innerHTML = "<p>Keine gespeicherten Antworten gefunden.</p>";
        return;
    }

    // Sortieren der storageKeys basierend auf dem Suffix
    storageKeys.sort((a, b) => {
        const suffixA = a.replace(STORAGE_PREFIX, '');
        const suffixB = b.replace(STORAGE_PREFIX, '');
        return suffixA.localeCompare(suffixB, undefined, {numeric: true, sensitivity: 'base'});
    });

    console.log("Sortierte Assignment-IDs:", storageKeys);

    storageKeys.forEach(assignmentId => {
        const text = localStorage.getItem(assignmentId);
        if(text) {
            console.log(`Lade Assignment: ${assignmentId}`);
            const draftDiv = document.createElement("div");
            draftDiv.className = "draft";

            // Erstellen einer Checkbox
            const checkboxDiv = document.createElement("div");
            checkboxDiv.style.position = "absolute";
            checkboxDiv.style.top = "10px";
            checkboxDiv.style.left = "10px";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.className = "select-answer";
            checkbox.value = assignmentId; // assignmentId als Wert verwenden
            checkbox.addEventListener('change', toggleBulkDeleteButton);

            const checkboxLabel = document.createElement("label");
            checkboxLabel.textContent = " Auswählen";

            checkboxDiv.appendChild(checkbox);
            checkboxDiv.appendChild(checkboxLabel);
            draftDiv.appendChild(checkboxDiv);

            const assignmentIdMatch = assignmentId.match(/^boxsuk-assignment[_-]?(.+)$/);
            const assignmentIdClean = assignmentIdMatch ? assignmentIdMatch[1] : assignmentId;

            const title = document.createElement("h3");
            title.textContent = `Textsorte ${assignmentIdClean}`;
            draftDiv.appendChild(title);

            const answerDiv = document.createElement("div");
            answerDiv.className = "answerText";
            answerDiv.innerHTML = text; // HTML-Inhalt rendern
            answerDiv.style.marginLeft = "30px"; // Platz für die Checkbox schaffen
            draftDiv.appendChild(answerDiv);

            // Erstellen der Button-Gruppe
            const buttonGroup = document.createElement("div");
            buttonGroup.className = "button-group";

            // Kopieren-Schaltfläche
            const copyBtn = document.createElement("button");
            copyBtn.textContent = "Antwort kopieren";
            copyBtn.className = "copyAnswerBtn";
            copyBtn.addEventListener('click', function() {
                copyToClipboard(text);
            });
            buttonGroup.appendChild(copyBtn);

            // Löschen-Schaltfläche
            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "Antwort löschen";
            deleteBtn.className = "deleteAnswerBtn";
            deleteBtn.addEventListener('click', function() {
                deleteAnswer(assignmentId);
            });
            buttonGroup.appendChild(deleteBtn);

            draftDiv.appendChild(buttonGroup);

            draftContainer.appendChild(draftDiv);
        }
    });

    // Nach dem Laden der Antworten:
    toggleBulkDeleteButton();
}

// Funktion zum Neuladen aller Antworten
function reloadAllAnswers() {
    loadAllAnswers();
}

// Funktion zum Kopieren einer einzelnen Antwort
function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function() {
            alert("Antwort wurde in die Zwischenablage kopiert.");
            console.log("Antwort erfolgreich kopiert");
        }, function(err) {
            console.error('Fehler beim Kopieren der Antwort: ', err);
            fallbackCopyTextToClipboard(text);
        });
    } else {
        // Fallback zu execCommand
        fallbackCopyTextToClipboard(text);
    }
}

// Funktion für die Bulk Delete
function bulkDeleteAnswers() {
    const selectedCheckboxes = document.querySelectorAll(".select-answer:checked");
    if(selectedCheckboxes.length === 0) {
        alert("Bitte wählen Sie mindestens eine Antwort zum Löschen aus.");
        return;
    }

    if(!confirm(`Sind Sie sicher, dass Sie ${selectedCheckboxes.length} ausgewählte Antwort(en) löschen möchten?`)) {
        return;
    }

    selectedCheckboxes.forEach(cb => {
        const assignmentId = cb.value;
        localStorage.removeItem(assignmentId);
        console.log(`Antwort für ${assignmentId} gelöscht.`);
    });

    alert(`${selectedCheckboxes.length} Antwort(en) wurden gelöscht.`);
    loadAllAnswers(); // Aktualisiere die Liste der gespeicherten Antworten
}

// Funktion zum Kopieren aller Antworten
function copyAllAnswersToClipboard() {
    const storageKeys = Object.keys(localStorage).filter(key => key.startsWith(STORAGE_PREFIX));
    
    if(storageKeys.length === 0) {
        alert("Keine gespeicherten Antworten zum Kopieren.");
        console.log("Copy all attempted with no stored answers");
        return;
    }

    // Sortieren der storageKeys basierend auf dem Suffix
    storageKeys.sort((a, b) => {
        const suffixA = a.replace(STORAGE_PREFIX, '');
        const suffixB = b.replace(STORAGE_PREFIX, '');
        return suffixA.localeCompare(suffixB, undefined, {numeric: true, sensitivity: 'base'});
    });

    let allText = '';
    storageKeys.forEach(assignmentId => {
        const text = localStorage.getItem(assignmentId);
        if(text) {
            const assignmentIdMatch = assignmentId.match(/^boxsuk-assignment[_-]?(.+)$/);
            const assignmentIdClean = assignmentIdMatch ? assignmentIdMatch[1] : assignmentId;
            allText += `Textsorte ${assignmentIdClean}:\n${text}\n\n`;
        }
    });

    // Überprüfen, ob die Clipboard API verfügbar ist
    if (navigator.clipboard && navigator.clipboard.writeText) {
        // Verwenden der Clipboard API
        navigator.clipboard.writeText(allText).then(function() {
            alert("Alle Antworten wurden in die Zwischenablage kopiert.");
            console.log("Alle Antworten erfolgreich kopiert");
        }).catch(function(err) {
            console.error('Fehler beim Kopieren der Antworten: ', err);
            fallbackCopyTextToClipboard(allText);
        });
    } else {
        // Fallback zu execCommand
        fallbackCopyTextToClipboard(allText);
    }
}

// Funktion zum Kopieren als Fallback
function fallbackCopyTextToClipboard(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    // Verstecke das textarea Element
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
        const successful = document.execCommand('copy');
        if (successful) {
            alert("Antwort wurde in die Zwischenablage kopiert.");
            console.log("Antwort erfolgreich kopiert (Fallback)");
        } else {
            throw new Error("Fallback copy unsuccessful");
        }
    } catch (err) {
        console.error('Fehler beim Kopieren der Antwort (Fallback): ', err);
        alert("Fehler beim Kopieren der Antwort.");
    }

    document.body.removeChild(textarea);
}

// Funktion zum Löschen einer einzelnen Antwort
function deleteAnswer(assignmentId) {
    if(confirm("Sind Sie sicher, dass Sie diese Antwort löschen möchten?")) {
        localStorage.removeItem(assignmentId);
        alert("Antwort wurde gelöscht.");
        console.log(`Antwort für ${assignmentId} gelöscht.`);
        loadAllAnswers(); // Aktualisiere die Liste der gespeicherten Antworten
    }
}

// Funktion zum Aktivieren/Deaktivieren der Bulk Delete Schaltfläche
function toggleBulkDeleteButton() {
    const selected = document.querySelectorAll(".select-answer:checked").length;
    const bulkDeleteBtn = document.getElementById("bulkDeleteBtn");
    bulkDeleteBtn.disabled = selected === 0;
}

// Funktion zum Anzeigen des "Gespeichert"-Hinweises
function showSaveIndicator() {
    saveIndicator.style.display = 'block';
    saveIndicator.style.backgroundColor = 'green'; // Set background color to green
    saveIndicator.style.color = 'white'; // Set text color to white for better contrast
    setTimeout(() => {
        saveIndicator.style.display = 'none';
    }, 2000); // Verstecken nach 1 Sekunde
}


// Debounce-Funktion zur Begrenzung der Ausführungsrate
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Debounced-Version von saveToLocal (z.B. speichert 2 Sekunden nachdem der Benutzer aufgehört hat zu tippen)
const debouncedSave = debounce(saveToLocal, 2000);

// Event Listener für Textänderungen zur automatischen Speicherung
quill.on('text-change', function(delta, oldDelta, source) {
    if (source === 'user') { // Stelle sicher, dass die Änderung vom Benutzer stammt
        debouncedSave();
    }
});

// Lade gespeicherten Inhalt und setze ihn im Quill-Editor
const savedText = localStorage.getItem(STORAGE_PREFIX + assignmentId);
if (savedText) {
    quill.root.innerHTML = savedText;
    console.log(`Gespeicherten Text für ${STORAGE_PREFIX + assignmentId} geladen`);
    displaySavedAnswer(savedText);
} else {
    console.log(`Kein gespeicherter Text für ${STORAGE_PREFIX + assignmentId} gefunden`);
}

// Funktion zum Laden und Anzeigen aller gespeicherten Antworten beim Laden der Seite
document.addEventListener("DOMContentLoaded", function() {
    loadAllAnswers();
});

// Optional: Log the initial state of localStorage for debugging
console.log("Initialer Zustand von localStorage:");
for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    console.log(`${key}: ${localStorage.getItem(key)}`);
}
