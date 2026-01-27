// Array para almacenar los cursos agregados
let courses = [];
let scheduleSettings = {
    title: '',
    titleSize: '2rem',
    titleColor: '#1976D2'
};

// ========================================
// SISTEMA DE ALERTAS PERSONALIZADAS
// ========================================
function showAlert(message, type = 'error', title = '') {
    const icons = {
        error: '❌',
        warning: '⚠️',
        success: '✅',
        info: 'ℹ️'
    };

    const titles = {
        error: title || 'Error',
        warning: title || 'Advertencia',
        success: title || 'Éxito',
        info: title || 'Información'
    };

    const overlay = document.createElement('div');
    overlay.className = 'custom-alert-overlay';
    overlay.innerHTML = `
        <div class="custom-alert">
            <div class="custom-alert-icon ${type}">
                ${icons[type]}
            </div>
            <div class="custom-alert-title">${titles[type]}</div>
            <div class="custom-alert-message">${message}</div>
            <button class="custom-alert-button">Entendido</button>
        </div>
    `;

    document.body.appendChild(overlay);

    const button = overlay.querySelector('.custom-alert-button');
    button.addEventListener('click', () => {
        overlay.style.animation = 'fadeIn 0.2s ease reverse';
        setTimeout(() => overlay.remove(), 200);
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.style.animation = 'fadeIn 0.2s ease reverse';
            setTimeout(() => overlay.remove(), 200);
        }
    });
}

function showConfirmDelete(course) {
    const overlay = document.createElement('div');
    overlay.className = 'custom-alert-overlay';
    overlay.innerHTML = `
        <div class="custom-alert">
            <div class="custom-alert-icon warning">
                🗑️
            </div>
            <div class="custom-alert-title">Eliminar Curso</div>
            <div class="custom-alert-message">¿Estás seguro de que deseas eliminar "${course.name}"?</div>
            <div style="display: flex; gap: 10px;">
                <button class="custom-alert-button" style="background: #6c757d;" id="cancelBtn">Cancelar</button>
                <button class="custom-alert-button" style="background: linear-gradient(135deg, #f44336, #d32f2f);" id="confirmBtn">Eliminar</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    const confirmBtn = overlay.querySelector('#confirmBtn');
    const cancelBtn = overlay.querySelector('#cancelBtn');

    confirmBtn.addEventListener('click', () => {
        removeCourse(course);
        overlay.remove();
    });

    cancelBtn.addEventListener('click', () => {
        overlay.remove();
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
}

// ========================================
// FUNCIONES DE TIEMPO
// ========================================
function timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

function minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// ========================================
// VALIDACIONES
// ========================================
function hasScheduleConflict(newCourse) {
    const newStartMin = timeToMinutes(newCourse.startTime);
    const newEndMin = timeToMinutes(newCourse.endTime);

    for (const course of courses) {
        const commonDays = newCourse.days.filter(day => course.days.includes(day));
        
        if (commonDays.length > 0) {
            const courseStartMin = timeToMinutes(course.startTime);
            const courseEndMin = timeToMinutes(course.endTime);

            if ((newStartMin < courseEndMin && newEndMin > courseStartMin)) {
                const dayNames = {
                    0: 'Domingo',
                    1: 'Lunes',
                    2: 'Martes',
                    3: 'Miércoles',
                    4: 'Jueves',
                    5: 'Viernes',
                    6: 'Sábado'
                };
                const conflictDays = commonDays.map(d => dayNames[d]).join(', ');
                
                return {
                    hasConflict: true,
                    message: `El horario de "${newCourse.name}" (${newCourse.startTime} - ${newCourse.endTime}) se superpone con "${course.name}" (${course.startTime} - ${course.endTime}) el día ${conflictDays}.`
                };
            }
        }
    }

    return { hasConflict: false };
}

function isDuplicateCourse(newCourse) {
    for (const course of courses) {
        const commonDays = newCourse.days.filter(day => course.days.includes(day));
        
        if (commonDays.length > 0 &&
            course.name === newCourse.name &&
            course.startTime === newCourse.startTime &&
            course.endTime === newCourse.endTime) {
            
            const dayNames = {
                0: 'Domingo',
                1: 'Lunes',
                2: 'Martes',
                3: 'Miércoles',
                4: 'Jueves',
                5: 'Viernes',
                6: 'Sábado'
            };
            const duplicateDays = commonDays.map(d => dayNames[d]).join(', ');
            
            return {
                isDuplicate: true,
                message: `Ya existe el curso "${newCourse.name}" en el horario ${newCourse.startTime} - ${newCourse.endTime} el día ${duplicateDays}.`
            };
        }
    }

    return { isDuplicate: false };
}

// ========================================
// GENERACIÓN DE SLOTS DE TIEMPO
// ========================================
function generateTimeSlots() {
    if (courses.length === 0) {
        const slots = [];
        for (let hour = 7; hour <= 22; hour++) {
            slots.push({
                start: `${hour.toString().padStart(2, '0')}:00`,
                end: `${hour.toString().padStart(2, '0')}:50`
            });
        }
        return slots;
    }

    const timeSet = new Set();
    
    courses.forEach(course => {
        const startMin = timeToMinutes(course.startTime);
        const endMin = timeToMinutes(course.endTime);
        timeSet.add(startMin);
        timeSet.add(endMin);
    });
    
    const sortedTimes = Array.from(timeSet).sort((a, b) => a - b);
    
    const slots = [];
    for (let i = 0; i < sortedTimes.length - 1; i++) {
        slots.push({
            start: minutesToTime(sortedTimes[i]),
            end: minutesToTime(sortedTimes[i + 1]),
            startMin: sortedTimes[i],
            endMin: sortedTimes[i + 1]
        });
    }
    
    return slots;
}

function courseSpansSlot(course, slotStartMin, slotEndMin) {
    const courseStartMin = timeToMinutes(course.startTime);
    const courseEndMin = timeToMinutes(course.endTime);
    return courseStartMin <= slotStartMin && courseEndMin >= slotEndMin;
}

function isFirstSlotOfCourse(course, slotStartMin) {
    const courseStartMin = timeToMinutes(course.startTime);
    return courseStartMin === slotStartMin;
}

function countSlotsForCourse(course, allSlots, startIndex) {
    const courseEndMin = timeToMinutes(course.endTime);
    let count = 0;
    
    for (let i = startIndex; i < allSlots.length; i++) {
        if (allSlots[i].startMin < courseEndMin) {
            count++;
        } else {
            break;
        }
    }
    
    return count;
}

// ========================================
// RENDERIZADO DE HORARIOS
// ========================================
function renderSchedule() {
    const tbody = document.getElementById('scheduleBody');
    if (!tbody) {
        console.error('No se encontró el elemento scheduleBody');
        return;
    }
    
    tbody.innerHTML = '';
    
    if (courses.length === 0) {
        return;
    }
    
    const timeSlots = generateTimeSlots();
    const occupiedCells = {};
    
    timeSlots.forEach((slot, slotIndex) => {
        const row = document.createElement('tr');
        
        const hourCell = document.createElement('td');
        hourCell.className = 'hours-column';
        hourCell.textContent = `${slot.start} - ${slot.end}`;
        row.appendChild(hourCell);
        
        for (let day = 1; day <= 7; day++) {
            const actualDay = day === 7 ? 0 : day;
            const cellKey = `${slotIndex}-${day}`;
            
            if (occupiedCells[cellKey]) {
                continue;
            }
            
            const dayCell = document.createElement('td');
            
            let courseAdded = false;
            courses.forEach(course => {
                if (course.days.includes(actualDay) && 
                    courseSpansSlot(course, slot.startMin, slot.endMin) &&
                    isFirstSlotOfCourse(course, slot.startMin)) {
                    
                    const rowSpan = countSlotsForCourse(course, timeSlots, slotIndex);
                    const isSmallCell = rowSpan <= 2;
                    
                    const courseDiv = document.createElement('div');
                    courseDiv.className = 'course-cell';
                    
                    if (isSmallCell) {
                        const compactText = document.createElement('div');
                        compactText.className = 'course-compact';
                        
                        const nameSpan = document.createElement('span');
                        nameSpan.style.display = 'block';
                        nameSpan.style.fontWeight = '700';
                        nameSpan.textContent = course.name;
                        compactText.appendChild(nameSpan);
                        
                        if (course.room || course.modality) {
                            const infoSpan = document.createElement('span');
                            infoSpan.style.display = 'block';
                            infoSpan.style.fontSize = '0.85em';
                            infoSpan.style.marginTop = '0.1rem';
                            
                            let infoText = '';
                            if (course.room) infoText += course.room;
                            if (course.modality) {
                                const icon = course.modality === 'Presencial' ? '🏫' : '💻';
                                infoText += (course.room ? ' ' : '') + icon;
                            }
                            infoSpan.textContent = infoText;
                            compactText.appendChild(infoSpan);
                        }
                        
                        courseDiv.appendChild(compactText);
                    } else {
                        const courseName = document.createElement('div');
                        courseName.className = 'course-name';
                        courseName.textContent = course.name;
                        courseDiv.appendChild(courseName);
                        
                        if (course.room || course.modality) {
                            const courseInfo = document.createElement('div');
                            courseInfo.className = 'course-info';
                            
                            if (course.room) {
                                const roomSpan = document.createElement('span');
                                roomSpan.className = 'course-room';
                                roomSpan.textContent = course.room;
                                courseInfo.appendChild(roomSpan);
                            } else {
                                const emptySpan = document.createElement('span');
                                courseInfo.appendChild(emptySpan);
                            }
                            
                            if (course.modality) {
                                const modalitySpan = document.createElement('span');
                                modalitySpan.className = 'course-modality';
                                const icon = course.modality === 'Presencial' ? '🏫' : '💻';
                                modalitySpan.textContent = icon;
                                courseInfo.appendChild(modalitySpan);
                            }
                            
                            courseDiv.appendChild(courseInfo);
                        }
                    }
                    
                    courseDiv.style.backgroundColor = course.color;
                    
                    if (rowSpan > 1) {
                        dayCell.rowSpan = rowSpan;
                        for (let i = 1; i < rowSpan; i++) {
                            occupiedCells[`${slotIndex + i}-${day}`] = true;
                        }
                    }
                    
                    courseDiv.addEventListener('click', function() {
                        showConfirmDelete(course);
                    });
                    
                    dayCell.appendChild(courseDiv);
                    courseAdded = true;
                }
            });
            
            row.appendChild(dayCell);
        }
        
        tbody.appendChild(row);
    });
}

// ========================================
// AGREGAR CURSO
// ========================================
function addCourse() {
    const courseName = document.getElementById('courseName').value.trim();
    const timeFrom = document.getElementById('timeFrom').value;
    const timeTo = document.getElementById('timeTo').value;
    const color = document.getElementById('courseColor').value;
    const room = document.getElementById('courseRoom').value.trim();
    const modality = document.getElementById('courseModality').value;
    
    const selectedDays = [];
    const dayCheckboxes = ['dayL', 'dayK', 'dayM', 'dayJ', 'dayV', 'dayS', 'dayD'];
    
    dayCheckboxes.forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox && checkbox.checked) {
            selectedDays.push(parseInt(checkbox.value));
        }
    });
    
    // Validaciones
    if (!courseName) {
        showAlert('Por favor, ingresa el nombre del curso.', 'warning', 'Campo Requerido');
        return;
    }
    
    if (selectedDays.length === 0) {
        showAlert('Por favor, selecciona al menos un día de la semana para el curso.', 'warning', 'Día Requerido');
        return;
    }
    
    if (!timeFrom || !timeTo) {
        showAlert('Por favor, selecciona las horas de inicio y fin del curso.', 'warning', 'Horario Requerido');
        return;
    }
    
    if (timeToMinutes(timeFrom) >= timeToMinutes(timeTo)) {
        showAlert('La hora de inicio debe ser anterior a la hora de fin.', 'error', 'Horario Inválido');
        return;
    }
    
    const newCourse = {
        id: Date.now(),
        name: courseName,
        days: selectedDays,
        startTime: timeFrom,
        endTime: timeTo,
        color: color,
        room: room,
        modality: modality
    };

    // Validar duplicados
    const duplicateCheck = isDuplicateCourse(newCourse);
    if (duplicateCheck.isDuplicate) {
        showAlert(duplicateCheck.message, 'warning', 'Curso Duplicado');
        return;
    }

    // Validar conflictos de horario
    const conflictCheck = hasScheduleConflict(newCourse);
    if (conflictCheck.hasConflict) {
        showAlert(conflictCheck.message, 'error', 'Conflicto de Horario');
        return;
    }
    
    courses.push(newCourse);
    renderSchedule();
    showAlert(`El curso "${courseName}" ha sido agregado exitosamente al horario.`, 'success', '¡Listo!');
}

// ========================================
// ELIMINAR CURSO
// ========================================
function removeCourse(course) {
    courses = courses.filter(c => c.id !== course.id);
    renderSchedule();
    showAlert(`El curso "${course.name}" ha sido eliminado del horario.`, 'info', 'Curso Eliminado');
}

// ========================================
// CREAR NUEVO HORARIO
// ========================================
function createNewSchedule() {
    if (courses.length > 0) {
        const overlay = document.createElement('div');
        overlay.className = 'custom-alert-overlay';
        overlay.innerHTML = `
            <div class="custom-alert">
                <div class="custom-alert-icon warning">
                    ⚠️
                </div>
                <div class="custom-alert-title">Crear Nuevo Horario</div>
                <div class="custom-alert-message">¿Estás seguro de que deseas crear un nuevo horario? Se perderán todos los cursos actuales.</div>
                <div style="display: flex; gap: 10px;">
                    <button class="custom-alert-button" style="background: #6c757d;" id="cancelBtn">Cancelar</button>
                    <button class="custom-alert-button" id="confirmBtn">Crear Nuevo</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const confirmBtn = overlay.querySelector('#confirmBtn');
        const cancelBtn = overlay.querySelector('#cancelBtn');

        confirmBtn.addEventListener('click', () => {
            courses = [];
            renderSchedule();
            document.getElementById('courseName').value = '';
            document.getElementById('courseRoom').value = '';
            document.getElementById('courseModality').value = '';
            document.querySelectorAll('.form-check-input').forEach(cb => cb.checked = false);
            overlay.remove();
            showAlert('Se ha creado un nuevo horario vacío.', 'success', '¡Listo!');
        });

        cancelBtn.addEventListener('click', () => {
            overlay.remove();
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });
    } else {
        showAlert('El horario ya está vacío. Puedes comenzar a agregar cursos.', 'info', 'Horario Vacío');
    }
}

// ========================================
// DESCARGAS
// ========================================
function downloadAsImage(format) {
    const element = document.getElementById('scheduleTable');
    
    if (typeof html2canvas === 'undefined') {
        showAlert('Error: La librería html2canvas no está cargada correctamente.', 'error', 'Error de Sistema');
        return;
    }
    
    html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff'
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = `horario.${format}`;
        link.href = canvas.toDataURL(`image/${format}`);
        link.click();
        showAlert(`Horario descargado como ${format.toUpperCase()}.`, 'success', 'Descarga Exitosa');
    });
}

function downloadAsPDF() {
    const element = document.getElementById('scheduleTable');
    
    if (typeof html2canvas === 'undefined') {
        showAlert('Error: html2canvas no está cargada correctamente.', 'error', 'Error de Sistema');
        return;
    }
    
    if (typeof jspdf === 'undefined') {
        showAlert('Error: jsPDF no está cargada correctamente.', 'error', 'Error de Sistema');
        return;
    }
    
    html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff'
    }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jspdf.jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });
        
        const imgWidth = 280;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
        pdf.save('horario.pdf');
        showAlert('Horario descargado como PDF.', 'success', 'Descarga Exitosa');
    });
}

// ========================================
// TÍTULO PERSONALIZADO
// ========================================
function updateScheduleTitle() {
    const titleElement = document.getElementById('customTitle');
    
    if (scheduleSettings.title) {
        titleElement.textContent = scheduleSettings.title;
        titleElement.style.fontSize = scheduleSettings.titleSize;
        titleElement.style.color = scheduleSettings.titleColor;
        titleElement.classList.add('active');
    } else {
        titleElement.classList.remove('active');
    }
}

// ========================================
// INICIALIZACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    const btnAgregar = document.getElementById('btnAgregar');
    if (btnAgregar) {
        btnAgregar.addEventListener('click', addCourse);
    }
    
    const btnNuevo = document.getElementById('btnNuevoHorario');
    if (btnNuevo) {
        btnNuevo.addEventListener('click', createNewSchedule);
    }
    
    const downloadJPG = document.getElementById('downloadJPG');
    if (downloadJPG) {
        downloadJPG.addEventListener('click', function(e) {
            e.preventDefault();
            downloadAsImage('jpeg');
        });
    }
    
    const downloadPNG = document.getElementById('downloadPNG');
    if (downloadPNG) {
        downloadPNG.addEventListener('click', function(e) {
            e.preventDefault();
            downloadAsImage('png');
        });
    }
    
    const downloadPDF = document.getElementById('downloadPDF');
    if (downloadPDF) {
        downloadPDF.addEventListener('click', function(e) {
            e.preventDefault();
            downloadAsPDF();
        });
    }
    
    const btnDarkMode = document.getElementById('btnDarkMode');
    if (btnDarkMode) {
        btnDarkMode.addEventListener('click', function() {
            document.body.classList.toggle('dark-mode');
            if (document.body.classList.contains('dark-mode')) {
                btnDarkMode.textContent = '☀️ Modo Claro';
            } else {
                btnDarkMode.textContent = '🌙 Modo Oscuro';
            }
        });
    }
    
    const btnPersonalizar = document.getElementById('btnPersonalizar');
    if (btnPersonalizar) {
        btnPersonalizar.addEventListener('click', function() {
            const modal = new bootstrap.Modal(document.getElementById('personalizarModal'));
            modal.show();
        });
    }
    
    const btnAplicar = document.getElementById('btnAplicarPersonalizacion');
    if (btnAplicar) {
        btnAplicar.addEventListener('click', function() {
            const title = document.getElementById('scheduleTitle').value.trim();
            const titleSize = document.getElementById('titleSize').value;
            const titleColor = document.getElementById('titleColor').value;
            
            scheduleSettings.title = title;
            scheduleSettings.titleSize = titleSize;
            scheduleSettings.titleColor = titleColor;
            
            updateScheduleTitle();
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('personalizarModal'));
            modal.hide();
            
            showAlert('La personalización se ha aplicado correctamente.', 'success', '¡Listo!');
        });
    }
    
    renderSchedule();
});