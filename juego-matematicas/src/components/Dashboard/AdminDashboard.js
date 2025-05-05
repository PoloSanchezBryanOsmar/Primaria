import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import axios from 'axios';

// Componente principal del Dashboard
const AdminDashboard = ({ onLogout }) => {
  // Estados para manejar los datos (mantenido igual que en el original)
  const [grades, setGrades] = useState([]);
  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [activeSection, setActiveSection] = useState('grades');
  // Estados para formularios
  const [gradeForm, setGradeForm] = useState({ name: '', level: '' });
  const [groupForm, setGroupForm] = useState({ name: '', gradeId: '' });
  const [teacherForm, setTeacherForm] = useState({ name: '', email: '' });
  const [assignForm, setAssignForm] = useState({ teacherId: '', groupId: '' });
  // Estado para edición
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  // Nuevo estado para notificaciones
  const [notification, setNotification] = useState(null);

  const api = axios.create({ baseURL: 'http://localhost:5000/api/admin' });

  // Función para cargar datos desde el back-end
  const fetchData = async () => {
    try {
      const gradesResponse = await api.get('/grades');
      const groupsResponse = await api.get('/groups');
      const teachersResponse = await api.get('/teachers');
      setGrades(gradesResponse.data);
      setGroups(groupsResponse.data);
      setTeachers(teachersResponse.data);
    } catch (error) {
      console.error('Error al cargar datos:', error.response ? error.response.data : error.message);
      showNotification('error', 'Error al cargar datos del servidor');
    }
  };

  // Cargar datos al iniciar el componente
  useEffect(() => {
    fetchData();
  }, []);

  // Función para mostrar notificaciones
  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Función para reiniciar el formulario actual
  const resetForm = (formType) => {
    setEditMode(false);
    setCurrentId(null);
    switch (formType) {
      case 'grade':
        setGradeForm({ name: '', level: '' });
        break;
      case 'group':
        setGroupForm({ name: '', gradeId: '', teacherId: '' });
        break;
      case 'teacher':
        setTeacherForm({ name: '', email: '' });
        break;
      case 'assign':
        setAssignForm({ teacherId: '', groupId: '' });
        break;
      default:
        break;
    }
  };

  // Manejadores para Grados
  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await api.put(`/grades/${currentId}`, gradeForm);
        showNotification('success', 'Grado actualizado correctamente');
      } else {
        await api.post('/grades', gradeForm);
        showNotification('success', 'Grado creado correctamente');
      }
      fetchData();
      resetForm('grade');
    } catch (error) {
      console.error('Error al guardar el grado:', error.response ? error.response.data : error.message);
      showNotification('error', 'Error al guardar el grado');
    }
  };

  const editGrade = (grade) => {
    setGradeForm({ name: grade.name, level: grade.level });
    setEditMode(true);
    setCurrentId(grade.id);
  };

  const deleteGrade = async (gradeId) => {
    try {
      // Verificar si hay grupos asociados
      const hasGroups = groups.some((group) => group.gradeId === gradeId);
      if (hasGroups) {
        showNotification('error', 'No se puede eliminar este grado porque tiene grupos asociados');
        return;
      }
      await api.delete(`/grades/${gradeId}`);
      showNotification('success', 'Grado eliminado correctamente');
      fetchData();
    } catch (error) {
      console.error('Error al eliminar el grado:', error.response ? error.response.data : error.message);
      showNotification('error', 'Error al eliminar el grado');
    }
  };

  // Manejadores para Grupos
  const handleGroupSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await api.put(`/groups/${currentId}`, groupForm);
        showNotification('success', 'Grupo actualizado correctamente');
      } else {
        await api.post('/groups', groupForm);
        showNotification('success', 'Grupo creado correctamente');
      }
      fetchData();
      resetForm('group');
    } catch (error) {
      console.error('Error al guardar el grupo:', error.response?.data || error.message);
      showNotification('error', 'Error al guardar el grupo');
    }
  };

  const editGroup = (group) => {
    setGroupForm({
      name: group.group_name,
      gradeId: group.grade_id,
      teacherId: group.teacher_id || '',
    });
    setEditMode(true);
    setCurrentId(group.id);
  };

  const deleteGroup = async (groupId) => {
    try {
      await api.delete(`/groups/${groupId}`);
      showNotification('success', 'Grupo eliminado correctamente');
      fetchData();
    } catch (error) {
      console.error('Error al eliminar el grupo:', error.response?.data || error.message);
      showNotification('error', 'Error al eliminar el grupo');
    }
  };

  // Manejadores para Docentes
  const handleTeacherSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await api.put(`/teachers/${currentId}`, teacherForm);
        showNotification('success', 'Docente actualizado correctamente');
      } else {
        await api.post('/teachers', teacherForm);
        showNotification('success', 'Docente registrado correctamente');
      }
      fetchData();
      resetForm('teacher');
    } catch (error) {
      console.error('Error al guardar el docente:', error.response?.data || error.message);
      showNotification('error', 'Error al guardar el docente');
    }
  };

  const editTeacher = (teacher) => {
    setTeacherForm({ name: teacher.name, email: teacher.email });
    setEditMode(true);
    setCurrentId(teacher.id);
  };

  const deleteTeacher = async (teacherId) => {
    try {
      // Verificar si tiene grupos asignados
      const hasGroups = groups.some(group => group.teacher_id === teacherId);
      if (hasGroups) {
        showNotification('error', 'No se puede eliminar este docente porque tiene grupos asignados');
        return;
      }
      await api.delete(`/teachers/${teacherId}`);
      showNotification('success', 'Docente eliminado correctamente');
      fetchData();
    } catch (error) {
      console.error('Error al eliminar el docente:', error);
      showNotification('error', 'Error al eliminar el docente');
    }
  };

  // Manejador para asignar docentes
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/assign', assignForm);
      showNotification('success', 'Docente asignado correctamente');
      fetchData();
      resetForm('assign');
    } catch (error) {
      console.error('Error al asignar docente:', error.response ? error.response.data : error.message);
      showNotification('error', 'Error al asignar docente');
    }
  };

  return (
    <div>
      {/* Boton cerrar sesion */}
      <div className="logout-button-container">
        <button onClick={onLogout} className="btn btn-danger btn-sm logout-btn">
          Cerrar Sesión
        </button>
      </div>
      {/* Titulo */}
      <div className="main-title-container">
        <h1 className="main-title">Dashboard de Administrador - Escuela Primaria</h1>
      </div>

    <div className="container">
      {/* Mostrar notificación si existe */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
      {/* Navegación */}
      <div className="nav-tabs">
        <button
          className={`nav-tab ${activeSection === 'grades' ? 'active' : ''}`}
          onClick={() => setActiveSection('grades')}
        >
          Grados
        </button>
        <button
          className={`nav-tab ${activeSection === 'groups' ? 'active' : ''}`}
          onClick={() => setActiveSection('groups')}
        >
          Grupos
        </button>
        <button
          className={`nav-tab ${activeSection === 'teachers' ? 'active' : ''}`}
          onClick={() => setActiveSection('teachers')}
        >
          Docentes
        </button>
        <button
          className={`nav-tab ${activeSection === 'assign' ? 'active' : ''}`}
          onClick={() => setActiveSection('assign')}
        >
          Asignar Docentes
        </button>
      </div>
      {/* Sección de Grados */}
      {activeSection === 'grades' && (
        <div className="section">
          <h2 className="section-title">Gestión de Grados</h2>
          <div className="section-content">
            {/* Formulario para grados */}
            <form onSubmit={handleGradeSubmit} className="form">
              <h3 className="form-title">{editMode ? 'Editar Grado' : 'Crear Nuevo Grado'}</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Nombre:</label>
                  <input
                    type="text"
                    value={gradeForm.name}
                    onChange={(e) => setGradeForm({ ...gradeForm, name: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Nivel:</label>
                  <input
                    type="number"
                    value={gradeForm.level}
                    onChange={(e) => setGradeForm({ ...gradeForm, level: e.target.value })}
                    className="form-input"
                    required
                    min="1"
                  />
                </div>
              </div>
              <div className="form-buttons">
                <button type="submit" className="btn btn-primary">
                  {editMode ? 'Actualizar' : 'Crear'}
                </button>
                {editMode && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => resetForm('grade')}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
            {/* Lista de grados */}
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Nivel</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map((grade) => (
                    <tr key={grade.id}>
                      <td>{grade.id}</td>
                      <td>{grade.name}</td>
                      <td>{grade.level}</td>
                      <td className="actions-cell">
                        <button
                          onClick={() => editGrade(grade)}
                          className="btn btn-warning btn-sm"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => deleteGrade(grade.id)}
                          className="btn btn-danger btn-sm"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {grades.length === 0 && (
                    <tr>
                      <td colSpan="4" className="empty-message">
                        No hay grados registrados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {/* Sección de Grupos */}
      {activeSection === 'groups' && (
        <div className="section">
          <h2 className="section-title">Gestión de Grupos</h2>
          <div className="section-content">
            {/* Formulario para grupos */}
            <form onSubmit={handleGroupSubmit} className="form">
              <h3 className="form-title">{editMode ? 'Editar Grupo' : 'Crear Nuevo Grupo'}</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Nombre:</label>
                  <input
                    type="text"
                    value={groupForm.name}
                    onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Grado:</label>
                  <select
                    value={groupForm.gradeId}
                    onChange={(e) =>
                      setGroupForm({
                        ...groupForm,
                        gradeId: parseInt(e.target.value),
                      })
                    }
                    className="form-select"
                    required
                  >
                    <option value="">Seleccionar grado</option>
                    {grades.map((grade) => (
                      <option key={grade.id} value={grade.id}>
                        {grade.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Docente (opcional):</label>
                  <select
                    value={groupForm.teacherId || ''}
                    onChange={(e) =>
                      setGroupForm({
                        ...groupForm,
                        teacherId: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    className="form-select"
                  >
                    <option value="">Sin asignar</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-buttons">
                <button type="submit" className="btn btn-primary">
                  {editMode ? 'Actualizar' : 'Crear'}
                </button>
                {editMode && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => resetForm('group')}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
            {/* Lista de grupos */}
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Grado</th>
                    <th>Docente</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group) => (
                    <tr key={group.id}>
                      <td>{group.id}</td>
                      <td>{group.group_name}</td>
                      <td>{group.grade_name || 'No asignado'}</td>
                      <td>{group.teacher_name || 'No asignado'}</td>
                      <td className="actions-cell">
                        <button
                          onClick={() => editGroup(group)}
                          className="btn btn-warning btn-sm"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => deleteGroup(group.id)}
                          className="btn btn-danger btn-sm"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {groups.length === 0 && (
                    <tr>
                      <td colSpan="5" className="empty-message">
                        No hay grupos registrados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {/* Sección de Docentes */}
      {activeSection === 'teachers' && (
        <div className="section">
          <h2 className="section-title">Gestión de Docentes</h2>
          <div className="section-content">
            {/* Formulario para docentes */}
            <form onSubmit={handleTeacherSubmit} className="form">
              <h3 className="form-title">{editMode ? 'Editar Docente' : 'Registrar Nuevo Docente'}</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Nombre completo:</label>
                  <input
                    type="text"
                    value={teacherForm.name}
                    onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Correo electrónico:</label>
                  <input
                    type="email"
                    value={teacherForm.email}
                    onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
              </div>
              <div className="form-buttons">
                <button type="submit" className="btn btn-primary">
                  {editMode ? 'Actualizar' : 'Registrar'}
                </button>
                {editMode && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => resetForm('teacher')}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
            {/* Lista de docentes */}
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Correo electrónico</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((teacher) => (
                    <tr key={teacher.id}>
                      <td>{teacher.id}</td>
                      <td>{teacher.name}</td>
                      <td>{teacher.email}</td>
                      <td className="actions-cell">
                        <button
                          onClick={() => editTeacher(teacher)}
                          className="btn btn-warning btn-sm"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => deleteTeacher(teacher.id)}
                          className="btn btn-danger btn-sm"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {teachers.length === 0 && (
                    <tr>
                      <td colSpan="4" className="empty-message">
                        No hay docentes registrados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {/* Sección de Asignación */}
      {activeSection === 'assign' && (
        <div className="section">
          <h2 className="section-title">Asignación de Docentes a Grupos</h2>
          <div className="section-content">
            {/* Formulario para asignación */}
            <form onSubmit={handleAssignSubmit} className="form">
              <h3 className="form-title">Nueva Asignación</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Docente:</label>
                  <select
                    value={assignForm.teacherId}
                    onChange={(e) => setAssignForm({ ...assignForm, teacherId: e.target.value })}
                    className="form-select"
                    required
                  >
                    <option value="">Seleccionar docente</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Grupo:</label>
                  <select
                    value={assignForm.groupId}
                    onChange={(e) => setAssignForm({ ...assignForm, groupId: e.target.value })}
                    className="form-select"
                    required
                  >
                    <option value="">Seleccionar grupo</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.group_name} - {group.grade_name || 'Sin grado'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-buttons">
                <button type="submit" className="btn btn-primary">
                  Asignar
                </button>
              </div>
            </form>

            {/* Tabla de asignaciones actuales */}
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Grupo</th>
                    <th>Grado</th>
                    <th>Docente</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {groups
                    .filter(group => group.teacher_id) // Mostrar solo grupos con docentes asignados
                    .map((group) => (
                    <tr key={group.id}>
                      <td>{group.id}</td>
                      <td>{group.group_name}</td>
                      <td>{group.grade_name || 'No asignado'}</td>
                      <td>{group.teacher_name || 'No asignado'}</td>
                      <td className="actions-cell">
                        <button
                          onClick={() => {
                            // Crear una nueva asignación que reemplazará la anterior
                            setGroupForm({
                              name: group.group_name,
                              gradeId: group.grade_id,
                              teacherId: '', // Eliminar la asignación actual
                            });
                            setCurrentId(group.id);
                            setEditMode(true);
                            setActiveSection('groups'); // Cambiar a la sección de grupos para editar
                          }}
                          className="btn btn-danger btn-sm"
                        >
                          Desasignar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {groups.filter(group => group.teacher_id).length === 0 && (
                    <tr>
                      <td colSpan="5" className="empty-message">
                        No hay asignaciones registradas
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Tabla de grupos disponibles */}
            <h3 className="subsection-title">Grupos sin docente asignado</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Grupo</th>
                    <th>Grado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {groups
                    .filter(group => !group.teacher_id) // Mostrar solo grupos sin docentes asignados
                    .map((group) => (
                    <tr key={group.id}>
                      <td>{group.id}</td>
                      <td>{group.group_name}</td>
                      <td>{group.grade_name || 'No asignado'}</td>
                      <td className="actions-cell">
                        <button
                          onClick={() => {
                            setAssignForm({ ...assignForm, groupId: group.id });
                            // Hacer scroll al formulario
                            document.querySelector('.form').scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="btn btn-primary btn-sm"
                        >
                          Seleccionar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {groups.filter(group => !group.teacher_id).length === 0 && (
                    <tr>
                      <td colSpan="4" className="empty-message">
                        Todos los grupos tienen docente asignado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default AdminDashboard;