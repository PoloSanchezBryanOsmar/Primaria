// components/Dashboard/SubjectDetailView.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SubjectDetailView.css';

// Modal para crear/editar asignación
const AssignmentModal = ({ 
  isOpen, 
  onClose, 
  quiz, 
  teacherId, 
  onSave, 
  existingAssignment = null 
}) => {
  const [formData, setFormData] = useState({
    assignmentTitle: '',
    assignmentDescription: '',
    customTimeLimit: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    if (isOpen && quiz) {
      if (existingAssignment) {
        setFormData({
          assignmentTitle: existingAssignment.assignment_title || `Quiz de ${quiz.title}`,
          assignmentDescription: existingAssignment.assignment_description || '',
          customTimeLimit: existingAssignment.custom_time_limit || quiz.time || 60,
          startDate: existingAssignment.start_date ? 
            new Date(existingAssignment.start_date).toISOString().slice(0, 16) : '',
          endDate: existingAssignment.end_date ? 
            new Date(existingAssignment.end_date).toISOString().slice(0, 16) : ''
        });
      } else {
        // Valores por defecto para nueva asignación
        const now = new Date();
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        setFormData({
          assignmentTitle: `${quiz.title} - ${quiz.gradeName} ${quiz.gradeLevel}`,
          assignmentDescription: `Evaluación de ${quiz.title.toLowerCase()} para el grupo.`,
          customTimeLimit: quiz.time || 60,
          startDate: now.toISOString().slice(0, 16),
          endDate: nextWeek.toISOString().slice(0, 16)
        });
      }
    }
  }, [isOpen, quiz, existingAssignment]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.assignmentTitle.trim()) {
      alert('El título de la asignación es requerido');
      return;
    }
    
    if (!formData.startDate || !formData.endDate) {
      alert('Las fechas de inicio y fin son requeridas');
      return;
    }
    
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      alert('La fecha de fin debe ser posterior a la fecha de inicio');
      return;
    }
    
    if (formData.customTimeLimit < 30 || formData.customTimeLimit > 600) {
      alert('El tiempo límite debe estar entre 30 segundos y 10 minutos');
      return;
    }

    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3>{existingAssignment ? 'Editar Asignación' : 'Crear Nueva Asignación'}</h3>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-content">
          {/* Información del Quiz */}
          <div className="form-section">
            <h4>Información del Quiz</h4>
            <div className="quiz-info-grid">
              <div className="info-item">
                <span className="info-label">Quiz:</span>
                <span className="info-value">{quiz?.title}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Grado:</span>
                <span className="info-value">{quiz?.gradeName} - {quiz?.gradeLevel}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Preguntas:</span>
                <span className="info-value">{quiz?.questions} preguntas</span>
              </div>
              <div className="info-item">
                <span className="info-label">Tiempo Original:</span>
                <span className="info-value">{quiz?.time} segundos</span>
              </div>
            </div>
          </div>

          {/* Configuración de la Asignación */}
          <div className="form-section">
            <h4>Configuración de la Asignación</h4>
            
            <div className="form-group">
              <label htmlFor="assignmentTitle">Título de la Asignación *</label>
              <input
                type="text"
                id="assignmentTitle"
                value={formData.assignmentTitle}
                onChange={(e) => setFormData({...formData, assignmentTitle: e.target.value})}
                className="form-input"
                placeholder="Ej: Quiz de Gramática - Semana 1"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="assignmentDescription">Descripción</label>
              <textarea
                id="assignmentDescription"
                value={formData.assignmentDescription}
                onChange={(e) => setFormData({...formData, assignmentDescription: e.target.value})}
                className="form-textarea"
                placeholder="Descripción opcional de la asignación..."
                rows="3"
              />
            </div>

            <div className="form-group">
              <label htmlFor="customTimeLimit">Tiempo Límite (segundos) *</label>
              <input
                type="number"
                id="customTimeLimit"
                value={formData.customTimeLimit}
                onChange={(e) => setFormData({...formData, customTimeLimit: parseInt(e.target.value)})}
                className="form-input"
                min="30"
                max="600"
                step="5"
                required
              />
              <small className="form-hint">
                Tiempo original: {quiz?.time} segundos (30-600 segundos permitidos)
              </small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startDate">Fecha y Hora de Inicio *</label>
                <input
                  type="datetime-local"
                  id="startDate"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  className="form-input"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="endDate">Fecha y Hora de Fin *</label>
                <input
                  type="datetime-local"
                  id="endDate"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  className="form-input"
                  required
                />
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {existingAssignment ? 'Actualizar Asignación' : 'Crear Asignación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Componente principal de la vista de materia
const SubjectDetailView = ({ 
  subject, 
  subjectQuizzes, 
  teacherId, 
  onBack, 
  showNotification,
  handleStartQuiz,
  api 
}) => {
  const [assignments, setAssignments] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('quizzes');

  // Cargar asignaciones de esta materia
  const loadAssignments = async () => {
    if (!teacherId) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/teacher/assignments/${teacherId}/${subject.id}`);
      setAssignments(response.data);
    } catch (error) {
      console.error('Error al cargar asignaciones:', error);
      // Filtrar asignaciones localmente si la API no está lista
      const allAssignmentsResponse = await api.get(`/teacher/assignments/${teacherId}`);
      const subjectAssignments = allAssignmentsResponse.data.filter(
        assignment => assignment.subject_id === subject.id
      );
      setAssignments(subjectAssignments);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, [teacherId, subject.id]);

  // Abrir modal para crear asignación
  const openAssignmentModal = (quiz) => {
    setSelectedQuiz(quiz);
    setEditingAssignment(null);
    setModalOpen(true);
  };

  // Editar asignación existente
  const editAssignment = (assignment, quiz) => {
    setSelectedQuiz(quiz);
    setEditingAssignment(assignment);
    setModalOpen(true);
  };

  // Guardar asignación
  const saveAssignment = async (formData) => {
    try {
      const assignmentData = {
        quizId: selectedQuiz.id,
        gradeId: selectedQuiz.gradeId,
        teacherId: teacherId,
        assignmentTitle: formData.assignmentTitle,
        assignmentDescription: formData.assignmentDescription,
        customTimeLimit: formData.customTimeLimit,
        startDate: formData.startDate,
        endDate: formData.endDate
      };

      if (editingAssignment) {
        await api.put(`/teacher/assignments/${editingAssignment.id}`, assignmentData);
        showNotification('success', 'Asignación actualizada correctamente');
      } else {
        await api.post('/teacher/assignments', assignmentData);
        showNotification('success', 'Asignación creada correctamente');
      }

      setModalOpen(false);
      loadAssignments();
      
    } catch (error) {
      console.error('Error al guardar asignación:', error);
      showNotification('error', 'Error al guardar la asignación');
    }
  };

  // Eliminar asignación
  const deleteAssignment = async (assignmentId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta asignación?')) {
      return;
    }
    try {
      await api.delete(`/teacher/assignments/${assignmentId}`);
      showNotification('success', 'Asignación eliminada correctamente');
      loadAssignments();
    } catch (error) {
      console.error('Error al eliminar asignación:', error);
      showNotification('error', 'Error al eliminar la asignación');
    }
  };

  // Obtener estado de la asignación
  const getAssignmentStatus = (assignment) => {
    const now = new Date();
    const start = new Date(assignment.start_date);
    const end = new Date(assignment.end_date);

    if (now < start) return 'programada';
    if (now >= start && now <= end) return 'activa';
    return 'finalizada';
  };

  // Renderizar estado de asignación
  const renderAssignmentStatus = (assignment) => {
    const status = getAssignmentStatus(assignment);
    const statusConfig = {
      programada: { label: 'Programada', class: 'status-scheduled', icon: '⏰', color: '#fff3cd' },
      activa: { label: 'Activa', class: 'status-active', icon: '✅', color: '#d4edda' },
      finalizada: { label: 'Finalizada', class: 'status-finished', icon: '🏁', color: '#f8d7da' }
    };

    const config = statusConfig[status];
    return (
      <span 
        className={`assignment-status ${config.class}`}
        style={{
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '0.8em',
          fontWeight: '500',
          backgroundColor: config.color,
          color: status === 'activa' ? '#155724' : status === 'programada' ? '#856404' : '#721c24'
        }}
      >
        {config.icon} {config.label}
      </span>
    );
  };

  return (
    <div className="subject-detail-view">
      {/* Header */}
      <div className="subject-detail-header">
        <div className="header-left">
          <button className="back-button" onClick={onBack}>
            ← Volver a Materias
          </button>
          <div className="subject-info">
            <div className="subject-icon-large">{subject.icon}</div>
            <div>
              <h1>{subject.name}</h1>
              <p>{subjectQuizzes.length} quiz{subjectQuizzes.length !== 1 ? 'zes' : ''} disponible{subjectQuizzes.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="subject-tabs">
        <button 
          className={`tab-btn ${activeTab === 'quizzes' ? 'active' : ''}`}
          onClick={() => setActiveTab('quizzes')}
        >
          Quizzes Disponibles
        </button>
        <button 
          className={`tab-btn ${activeTab === 'assignments' ? 'active' : ''}`}
          onClick={() => setActiveTab('assignments')}
        >
          Mis Asignaciones ({assignments.length})
        </button>
      </div>

      {/* Content */}
      <div className="subject-content">
        {activeTab === 'quizzes' && (
          <div className="quizzes-section">
            {subjectQuizzes.length > 0 ? (
              <div className="quizzes-grid">
                {subjectQuizzes.map(quiz => (
                  <div key={quiz.id} className="quiz-card-detailed">
                    <div className="quiz-card-header">
                      <div className="quiz-icon" style={{ backgroundColor: quiz.color }}>
                        {quiz.icon}
                      </div>
                      <div className="quiz-header-info">
                        <h3>{quiz.title}</h3>
                        <p className="quiz-grade">{quiz.gradeName} - {quiz.gradeLevel}</p>
                        <p className="quiz-description">{quiz.description || 'Sin descripción'}</p>
                      </div>
                    </div>

                    <div className="quiz-details">
                      <div className="detail-item">
                        <span className="detail-icon">❓</span>
                        <span>{quiz.questions} preguntas</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">⏱️</span>
                        <span>{quiz.time} segundos</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">📊</span>
                        <span>{quiz.difficulty}</span>
                      </div>
                    </div>

                    <div className="quiz-status-indicator">
                      {quiz.isActiveForStudents 
                        ? <span className="status-active">✅ Activo para estudiantes</span>
                        : <span className="status-inactive">⚪ Inactivo</span>
                      }
                    </div>

                    <div className="quiz-actions">
                      <button 
                        className="btn btn-secondary"
                        onClick={() => handleStartQuiz(quiz)}
                      >
                        Probar Quiz
                      </button>
                      <button 
                        className="btn btn-primary"
                        onClick={() => openAssignmentModal(quiz)}
                      >
                        Crear Asignación
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📚</div>
                <h3>No hay quizzes disponibles</h3>
                <p>El administrador debe activar quizzes de {subject.name} para tus grados.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="assignments-section">
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Cargando asignaciones...</p>
              </div>
            ) : assignments.length > 0 ? (
              <div className="assignments-table">
                <table>
                  <thead>
                    <tr>
                      <th>Título</th>
                      <th>Quiz</th>
                      <th>Grado</th>
                      <th>Tiempo Personalizado</th>
                      <th>Periodo</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((assignment) => {
                      const quiz = subjectQuizzes.find(q => q.id === assignment.quiz_id);
                      return (
                        <tr key={assignment.id}>
                          <td>
                            <div className="assignment-title">
                              <strong>{assignment.assignment_title}</strong>
                              {assignment.assignment_description && (
                                <div className="assignment-description">
                                  {assignment.assignment_description}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>{assignment.quiz_title}</td>
                          <td>{assignment.grade_name} - {assignment.grade_level}</td>
                          <td>
                            <div className="time-info">
                              <strong>{assignment.custom_time_limit}s</strong>
                              {assignment.original_time_limit && 
                               assignment.custom_time_limit !== assignment.original_time_limit && (
                                <small>(Original: {assignment.original_time_limit}s)</small>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="date-range">
                              <div>📅 {new Date(assignment.start_date).toLocaleDateString()}</div>
                              <div>🏁 {new Date(assignment.end_date).toLocaleDateString()}</div>
                            </div>
                          </td>
                          <td>{renderAssignmentStatus(assignment)}</td>
                          <td>
                            <div className="action-buttons">
                              <button 
                                className="btn btn-sm btn-secondary"
                                onClick={() => editAssignment(assignment, quiz)}
                              >
                                Editar
                              </button>
                              <button 
                                className="btn btn-sm btn-danger"
                                onClick={() => deleteAssignment(assignment.id)}
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h3>No tienes asignaciones para {subject.name}</h3>
                <p>Crea una asignación desde la pestaña "Quizzes Disponibles".</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Asignación */}
      <AssignmentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        quiz={selectedQuiz}
        teacherId={teacherId}
        onSave={saveAssignment}
        existingAssignment={editingAssignment}
      />
    </div>
  );
};

export default SubjectDetailView;