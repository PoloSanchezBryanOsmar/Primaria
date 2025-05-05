import React, { useState, useEffect } from 'react';
import './Admin.css'; // Asegúrate de crear este archivo CSS

// Componente principal del Dashboard
const AdminDashboard = () => {
  // Estados para manejar los datos
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

  // Datos de ejemplo (simulando backend)
  useEffect(() => {
    // Cargar datos iniciales (simulación)
    setGrades([
      { id: 1, name: 'Primer Grado', level: 1 },
      { id: 2, name: 'Segundo Grado', level: 2 },
    ]);
    
    setGroups([
      { id: 1, name: 'Grupo A', gradeId: 1, teacherId: 1 },
      { id: 2, name: 'Grupo B', gradeId: 1, teacherId: 2 },
      { id: 3, name: 'Grupo A', gradeId: 2, teacherId: 3 },
    ]);
    
    setTeachers([
      { id: 1, name: 'María López', email: 'maria@escuela.edu' },
      { id: 2, name: 'Juan Pérez', email: 'juan@escuela.edu' },
      { id: 3, name: 'Ana Rodríguez', email: 'ana@escuela.edu' },
      { id: 4, name: 'Carlos Sánchez', email: 'carlos@escuela.edu' },
    ]);
  }, []);

  // Manejadores para Grados
  const handleGradeSubmit = (e) => {
    e.preventDefault();
    if (editMode) {
      // Actualizar grado existente
      const updatedGrades = grades.map(grade => 
        grade.id === currentId ? { ...grade, ...gradeForm } : grade
      );
      setGrades(updatedGrades);
      setEditMode(false);
    } else {
      // Crear nuevo grado
      const newGrade = {
        id: grades.length > 0 ? Math.max(...grades.map(g => g.id)) + 1 : 1,
        ...gradeForm
      };
      setGrades([...grades, newGrade]);
    }
    setGradeForm({ name: '', level: '' });
    setCurrentId(null);
  };

  const editGrade = (grade) => {
    setGradeForm({ name: grade.name, level: grade.level });
    setEditMode(true);
    setCurrentId(grade.id);
  };

  const deleteGrade = (gradeId) => {
    // Verificar si hay grupos asociados
    const hasGroups = groups.some(group => group.gradeId === gradeId);
    if (hasGroups) {
      alert('No se puede eliminar este grado porque tiene grupos asociados');
      return;
    }
    setGrades(grades.filter(grade => grade.id !== gradeId));
  };

  // Manejadores para Grupos
  const handleGroupSubmit = (e) => {
    e.preventDefault();
    if (editMode) {
      // Actualizar grupo existente
      const updatedGroups = groups.map(group => 
        group.id === currentId ? { ...group, ...groupForm } : group
      );
      setGroups(updatedGroups);
      setEditMode(false);
    } else {
      // Crear nuevo grupo
      const newGroup = {
        id: groups.length > 0 ? Math.max(...groups.map(g => g.id)) + 1 : 1,
        ...groupForm,
        teacherId: groupForm.teacherId || null
      };
      setGroups([...groups, newGroup]);
    }
    setGroupForm({ name: '', gradeId: '', teacherId: '' });
    setCurrentId(null);
  };

  const editGroup = (group) => {
    setGroupForm({ 
      name: group.name, 
      gradeId: group.gradeId,
      teacherId: group.teacherId || ''
    });
    setEditMode(true);
    setCurrentId(group.id);
  };

  const deleteGroup = (groupId) => {
    setGroups(groups.filter(group => group.id !== groupId));
  };

  // Manejadores para Docentes
  const handleTeacherSubmit = (e) => {
    e.preventDefault();
    if (editMode) {
      // Actualizar docente existente
      const updatedTeachers = teachers.map(teacher => 
        teacher.id === currentId ? { ...teacher, ...teacherForm } : teacher
      );
      setTeachers(updatedTeachers);
      setEditMode(false);
    } else {
      // Crear nuevo docente
      const newTeacher = {
        id: teachers.length > 0 ? Math.max(...teachers.map(t => t.id)) + 1 : 1,
        ...teacherForm
      };
      setTeachers([...teachers, newTeacher]);
    }
    setTeacherForm({ name: '', email: '' });
    setCurrentId(null);
  };

  const editTeacher = (teacher) => {
    setTeacherForm({ name: teacher.name, email: teacher.email });
    setEditMode(true);
    setCurrentId(teacher.id);
  };

  const deleteTeacher = (teacherId) => {
    // Verificar si hay grupos asociados
    const hasGroups = groups.some(group => group.teacherId === teacherId);
    if (hasGroups) {
      alert('No se puede eliminar este docente porque está asignado a grupos');
      return;
    }
    setTeachers(teachers.filter(teacher => teacher.id !== teacherId));
  };

  // Manejador para asignar docentes
  const handleAssignSubmit = (e) => {
    e.preventDefault();
    const updatedGroups = groups.map(group => 
      group.id === parseInt(assignForm.groupId) 
        ? { ...group, teacherId: parseInt(assignForm.teacherId) } 
        : group
    );
    setGroups(updatedGroups);
    setAssignForm({ teacherId: '', groupId: '' });
  };

  // Función para obtener nombre de grado
  const getGradeName = (gradeId) => {
    const grade = grades.find(g => g.id === gradeId);
    return grade ? grade.name : 'No asignado';
  };

  // Función para obtener nombre de docente
  const getTeacherName = (teacherId) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? teacher.name : 'No asignado';
  };

  return (
    <div className="container">
      <h1 className="main-title">Dashboard de Administrador - Escuela Primaria</h1>
      
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
          
          {/* Formulario para grados */}
          <form onSubmit={handleGradeSubmit} className="form">
            <h3 className="form-title">{editMode ? 'Editar Grado' : 'Crear Nuevo Grado'}</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Nombre:</label>
                <input 
                  type="text"
                  value={gradeForm.name}
                  onChange={(e) => setGradeForm({...gradeForm, name: e.target.value})}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label>Nivel:</label>
                <input 
                  type="number"
                  value={gradeForm.level}
                  onChange={(e) => setGradeForm({...gradeForm, level: e.target.value})}
                  className="form-input"
                  required
                  min="1"
                />
              </div>
              <div className="form-buttons">
                <button type="submit" className="btn btn-primary">
                  {editMode ? 'Actualizar' : 'Crear'}
                </button>
                {editMode && (
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      setEditMode(false);
                      setGradeForm({ name: '', level: '' });
                      setCurrentId(null);
                    }}
                  >
                    Cancelar
                  </button>
                )}
              </div>
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
                {grades.map(grade => (
                  <tr key={grade.id}>
                    <td>{grade.id}</td>
                    <td>{grade.name}</td>
                    <td>{grade.level}</td>
                    <td>
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
                    <td colSpan="4" className="empty-message">No hay grados registrados</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Sección de Grupos */}
      {activeSection === 'groups' && (
        <div className="section">
          <h2 className="section-title">Gestión de Grupos</h2>
          
          {/* Formulario para grupos */}
          <form onSubmit={handleGroupSubmit} className="form">
            <h3 className="form-title">{editMode ? 'Editar Grupo' : 'Crear Nuevo Grupo'}</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Nombre:</label>
                <input 
                  type="text"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({...groupForm, name: e.target.value})}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label>Grado:</label>
                <select 
                  value={groupForm.gradeId}
                  onChange={(e) => setGroupForm({...groupForm, gradeId: parseInt(e.target.value)})}
                  className="form-select"
                  required
                >
                  <option value="">Seleccionar grado</option>
                  {grades.map(grade => (
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
                  onChange={(e) => setGroupForm({
                    ...groupForm, 
                    teacherId: e.target.value ? parseInt(e.target.value) : null
                  })}
                  className="form-select"
                >
                  <option value="">Sin asignar</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-buttons">
                <button type="submit" className="btn btn-primary">
                  {editMode ? 'Actualizar' : 'Crear'}
                </button>
                {editMode && (
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      setEditMode(false);
                      setGroupForm({ name: '', gradeId: '', teacherId: '' });
                      setCurrentId(null);
                    }}
                  >
                    Cancelar
                  </button>
                )}
              </div>
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
                {groups.map(group => (
                  <tr key={group.id}>
                    <td>{group.id}</td>
                    <td>{group.name}</td>
                    <td>{getGradeName(group.gradeId)}</td>
                    <td>{group.teacherId ? getTeacherName(group.teacherId) : 'No asignado'}</td>
                    <td>
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
                    <td colSpan="5" className="empty-message">No hay grupos registrados</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Sección de Docentes */}
      {activeSection === 'teachers' && (
        <div className="section">
          <h2 className="section-title">Gestión de Docentes</h2>
          
          {/* Formulario para docentes */}
          <form onSubmit={handleTeacherSubmit} className="form">
            <h3 className="form-title">{editMode ? 'Editar Docente' : 'Registrar Nuevo Docente'}</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Nombre completo:</label>
                <input 
                  type="text"
                  value={teacherForm.name}
                  onChange={(e) => setTeacherForm({...teacherForm, name: e.target.value})}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label>Correo electrónico:</label>
                <input 
                  type="email"
                  value={teacherForm.email}
                  onChange={(e) => setTeacherForm({...teacherForm, email: e.target.value})}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-buttons">
                <button type="submit" className="btn btn-primary">
                  {editMode ? 'Actualizar' : 'Registrar'}
                </button>
                {editMode && (
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      setEditMode(false);
                      setTeacherForm({ name: '', email: '' });
                      setCurrentId(null);
                    }}
                  >
                    Cancelar
                  </button>
                )}
              </div>
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
                {teachers.map(teacher => (
                  <tr key={teacher.id}>
                    <td>{teacher.id}</td>
                    <td>{teacher.name}</td>
                    <td>{teacher.email}</td>
                    <td>
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
                    <td colSpan="4" className="empty-message">No hay docentes registrados</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Sección de Asignación */}
      {activeSection === 'assign' && (
        <div className="section">
          <h2 className="section-title">Asignación de Docentes a Grupos</h2>
          
          {/* Formulario para asignación */}
          <form onSubmit={handleAssignSubmit} className="form">
            <div className="form-row">
              <div className="form-group">
                <label>Docente:</label>
                <select 
                  value={assignForm.teacherId}
                  onChange={(e) => setAssignForm({...assignForm, teacherId: e.target.value})}
                  className="form-select"
                  required
                >
                  <option value="">Seleccionar docente</option>
                  {teachers.map(teacher => (
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
                  onChange={(e) => setAssignForm({...assignForm, groupId: e.target.value})}
                  className="form-select"
                  required
                >
                  <option value="">Seleccionar grupo</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name} - {getGradeName(group.gradeId)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-buttons">
                <button type="submit" className="btn btn-primary">
                  Asignar
                </button>
              </div>
            </div>
          </form>
          
          {/* Vista de asignaciones actuales */}
          <div className="assignments-view">
            <h3 className="subsection-title">Asignaciones actuales</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Grupo</th>
                    <th>Grado</th>
                    <th>Docente Asignado</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map(group => (
                    <tr key={group.id}>
                      <td>{group.name}</td>
                      <td>{getGradeName(group.gradeId)}</td>
                      <td>
                        {group.teacherId ? getTeacherName(group.teacherId) : 'No asignado'}
                      </td>
                    </tr>
                  ))}
                  {groups.length === 0 && (
                    <tr>
                      <td colSpan="3" className="empty-message">No hay grupos registrados</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;