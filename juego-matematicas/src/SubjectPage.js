import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './SubjectPage.css';

const SubjectPage = ({ user }) => {
  const { subject } = useParams();
  const navigate = useNavigate();
  
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estado para el formulario de nuevo alumno
  const [newStudent, setNewStudent] = useState({
    name: '',
    group_id: '',
    tasks_done: 0,
    average_grade: 0
  });
  
  // Estado para el alumno que se está editando
  const [editingStudent, setEditingStudent] = useState(null);
  
  // Estado para mostrar/ocultar el formulario
  const [showForm, setShowForm] = useState(false);
  
  // Estado para los grupos disponibles
  const [selectedGroup, setSelectedGroup] = useState('');
  
  // Cargar los grupos disponibles para este docente
  useEffect(() => {
    if (user && user.assignedGroups && user.assignedGroups.length > 0) {
      // Seleccionar el primer grupo por defecto
      setSelectedGroup(user.assignedGroups[0].groupId);
      setNewStudent(prev => ({ ...prev, group_id: user.assignedGroups[0].groupId }));
    }
  }, [user]);
  
  // Cargar estudiantes cuando cambia el grupo seleccionado
  useEffect(() => {
    if (selectedGroup) {
      fetchStudents(selectedGroup);
    }
  }, [selectedGroup]);
  
  // Función para cargar los estudiantes de un grupo específico
  const fetchStudents = async (groupId) => {
    setLoading(true);
    try {
      // ¡Importante! Observa que estamos usando la ruta correcta de tu API
      const response = await fetch(`http://localhost:5000/api/admin/students/${groupId}`);
      
      if (!response.ok) {
        throw new Error('No se pudieron cargar los estudiantes');
      }
      
      const data = await response.json();
      setStudents(data);
    } catch (err) {
      setError('Error al cargar los estudiantes: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Manejar cambio de grupo seleccionado
  const handleGroupChange = (e) => {
    const groupId = e.target.value;
    setSelectedGroup(groupId);
    setNewStudent(prev => ({ ...prev, group_id: groupId }));
  };
  
  // Manejar cambios en el formulario de nuevo alumno
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewStudent(prev => ({ ...prev, [name]: value }));
  };
  
  // Guardar un nuevo alumno
  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      // Usamos la ruta correcta de tu API, sin enviar el token
      const response = await fetch('http://localhost:5000/api/admin/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newStudent)
      });
      
      if (!response.ok) {
        throw new Error('Error al crear el alumno');
      }
      
      // Refrescar la lista de alumnos
      fetchStudents(selectedGroup);
      
      // Limpiar el formulario
      setNewStudent({
        name: '',
        group_id: selectedGroup,
        tasks_done: 0,
        average_grade: 0
      });
      
      setShowForm(false);
    } catch (err) {
      setError('Error al añadir alumno: ' + err.message);
    }
  };
  
  // Preparar para editar un alumno
  const handleEdit = (student) => {
    setEditingStudent(student);
    setNewStudent({
      name: student.name,
      group_id: student.group_id,
      tasks_done: student.tasks_done || 0,
      average_grade: student.average_grade || 0
    });
    setShowForm(true);
  };
  
  // Actualizar un alumno existente
  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/admin/students/${editingStudent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newStudent)
      });
      
      if (!response.ok) {
        throw new Error('Error al actualizar el alumno');
      }
      
      // Refrescar la lista de alumnos
      fetchStudents(selectedGroup);
      
      // Limpiar el formulario
      setEditingStudent(null);
      setNewStudent({
        name: '',
        group_id: selectedGroup,
        tasks_done: 0,
        average_grade: 0
      });
      
      setShowForm(false);
    } catch (err) {
      setError('Error al actualizar alumno: ' + err.message);
    }
  };
  
  // Eliminar un alumno
  const handleDeleteStudent = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este alumno?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/admin/students/${id}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error('Error al eliminar el alumno');
        }
        
        // Refrescar la lista de alumnos
        fetchStudents(selectedGroup);
      } catch (err) {
        setError('Error al eliminar alumno: ' + err.message);
      }
    }
  };
  
  // Volver al dashboard
  const handleBack = () => {
    navigate('/docente', { replace: true });
  };
  
  return (
    <div className="subject-page">
      <header className="subject-header">
        <button onClick={handleBack} className="back-button">← Volver</button>
        <h1>Materia: {subject}</h1>
      </header>
      
      {error && <div className="error-alert">{error}</div>}
      
      {user && user.assignedGroups && user.assignedGroups.length > 0 ? (
        <>
          <div className="group-selector">
            <label>Selecciona un grupo:</label>
            <select 
              onChange={handleGroupChange}
              value={selectedGroup}
            >
              {user.assignedGroups.map(group => (
                <option key={group.groupId} value={group.groupId}>
                  {group.groupName} - {group.gradeName}
                </option>
              ))}
            </select>
          </div>
          
          <div className="student-controls">
            <button onClick={() => {
              setEditingStudent(null);
              setNewStudent({
                name: '',
                group_id: selectedGroup,
                tasks_done: 0,
                average_grade: 0
              });
              setShowForm(!showForm);
            }} className="add-button">
              {showForm ? 'Cancelar' : 'Agregar Alumno'}
            </button>
          </div>
          
          {showForm && (
            <form onSubmit={editingStudent ? handleUpdateStudent : handleAddStudent} className="student-form">
              <h3>{editingStudent ? 'Editar Alumno' : 'Nuevo Alumno'}</h3>
              <div className="form-group">
                <label>Nombre:</label>
                <input
                  type="text"
                  name="name"
                  value={newStudent.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              {editingStudent && (
                <>
                  <div className="form-group">
                    <label>Tareas Completadas:</label>
                    <input
                      type="number"
                      name="tasks_done"
                      value={newStudent.tasks_done}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Calificación Promedio:</label>
                    <input
                      type="number"
                      name="average_grade"
                      value={newStudent.average_grade}
                      onChange={handleInputChange}
                      min="0"
                      max="10"
                      step="0.01"
                    />
                  </div>
                </>
              )}
              <button type="submit" className="save-button">
                {editingStudent ? 'Actualizar' : 'Guardar'}
              </button>
            </form>
          )}
          
          <div className="students-table-container">
            <h2>Lista de Alumnos</h2>
            {loading ? (
              <p>Cargando...</p>
            ) : students.length === 0 ? (
              <p>No hay alumnos registrados en este grupo.</p>
            ) : (
              <table className="students-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Tareas Completadas</th>
                    <th>Calificación Promedio</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student.id}>
                      <td>{student.name}</td>
                      <td>{student.tasks_done || 0}</td>
                      <td>{student.average_grade || 0}</td>
                      <td className="action-buttons">
                        <button onClick={() => handleEdit(student)} className="edit-button">Editar</button>
                        <button onClick={() => handleDeleteStudent(student.id)} className="delete-button">Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        <div className="no-groups-message">
          <p>No tienes grupos asignados. Contacta con el administrador para que te asigne grupos.</p>
        </div>
      )}
    </div>
  );
};

export default SubjectPage;