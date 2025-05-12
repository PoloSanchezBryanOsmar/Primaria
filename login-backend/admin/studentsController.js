const db = require('../config/db');

// Obtener estudiantes por grado
exports.getStudentsByGrade = async (req, res) => {
  try {
    const { gradeId } = req.params;
    console.log(`Obteniendo estudiantes para el grado: ${gradeId}`);
    
    const [rows] = await db.query('SELECT * FROM students WHERE grade_id = ?', [gradeId]);
    
    console.log(`Se encontraron ${rows.length} estudiantes para el grado ${gradeId}`);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener estudiantes:', error);
    res.status(500).json({ error: 'Error al obtener estudiantes' });
  }
};

// Crear un nuevo estudiante
exports.createStudent = async (req, res) => {
  try {
    const { name, grade_id } = req.body;
    
    if (!name || !grade_id) {
      return res.status(400).json({ error: 'Nombre y grado son requeridos' });
    }
    
    const [result] = await db.query(
      'INSERT INTO students (name, grade_id) VALUES (?, ?)',
      [name, grade_id]
    );
    
    res.status(201).json({ 
      message: 'Estudiante registrado exitosamente', 
      id: result.insertId 
    });
  } catch (error) {
    console.error('Error al registrar estudiante:', error);
    res.status(500).json({ error: 'Error al registrar estudiante' });
  }
};

// Actualizar un estudiante
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, grade_id, tasks_done, average_grade } = req.body;
    
    // Validación de datos
    if (!name || !grade_id) {
      return res.status(400).json({ error: 'Nombre y grado son requeridos' });
    }
    
    const query = `
      UPDATE students 
      SET name = ?, grade_id = ?, tasks_done = ?, average_grade = ? 
      WHERE id = ?
    `;
    
    const [result] = await db.query(
      query,
      [name, grade_id, tasks_done || 0, average_grade || 0.0, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }
    
    res.json({ message: 'Estudiante actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar estudiante:', error);
    res.status(500).json({ error: 'Error al actualizar estudiante' });
  }
};

// Eliminar un estudiante
exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await db.query('DELETE FROM students WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }
    
    res.json({ message: 'Estudiante eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar estudiante:', error);
    res.status(500).json({ error: 'Error al eliminar estudiante' });
  }
};