const db = require('../config/db');

// Obtener todos los grados
exports.getGrades = async (req, res) => {
  try {
    // Consulta modificada para incluir información del docente asignado
    const query = `
      SELECT 
        g.id, 
        g.name, 
        g.level, 
        g.teacher_id,
        t.name AS teacher_name
      FROM grades g
      LEFT JOIN teachers t ON g.teacher_id = t.id
    `;
    const [results] = await db.query(query);
    res.status(200).json(results);
  } catch (error) {
    console.error('Error al obtener los grados:', error);
    res.status(500).json({ error: 'Error al obtener los grados' });
  }
};

// Obtener un grado por su ID
exports.getGradeById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Buscando grado con ID: ${id}`);
    
    // Intenta obtener el grado
    const [grades] = await db.query('SELECT * FROM grades WHERE id = ?', [id]);
    
    if (grades.length === 0) {
      console.log(`No se encontró ningún grado con ID: ${id}`);
      return res.status(404).json({ 
        error: 'Grado no encontrado',
        message: `No se encontró ningún grado con ID: ${id}`
      });
    }
    
    console.log(`Grado encontrado: ${JSON.stringify(grades[0])}`);
    res.json({
      message: 'Grado encontrado',
      grade: grades[0]
    });
  } catch (error) {
    console.error('Error al buscar grado:', error);
    res.status(500).json({ error: 'Error al buscar grado: ' + error.message });
  }
};

// Crear un nuevo grado
exports.createGrade = async (req, res) => {
  try {
    const { name, level } = req.body;
    if (!name || !level) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }
    const query = 'INSERT INTO grades (name, level) VALUES (?, ?)';
    const [results] = await db.query(query, [name, level]);
    res.status(201).json({
      message: 'Grado creado exitosamente',
      id: results.insertId,
    });
  } catch (error) {
    console.error('Error al crear el grado:', error);
    res.status(500).json({ error: 'Error al crear el grado' });
  }
};

// Actualizar un grado existente
exports.updateGrade = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, level, teacherId } = req.body;
    
    let query, params;
    
    // Si se incluye teacherId, actualizar también ese campo
    if (teacherId !== undefined) {
      query = 'UPDATE grades SET name = ?, level = ?, teacher_id = ? WHERE id = ?';
      params = [name, level, teacherId || null, id];
    } else {
      query = 'UPDATE grades SET name = ?, level = ? WHERE id = ?';
      params = [name, level, id];
    }
    
    const [results] = await db.query(query, params);
    
    if (results.affectedRows === 0)
      return res.status(404).json({ error: 'Grado no encontrado' });
    
    res.status(200).json({ message: 'Grado actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar el grado:', error);
    res.status(500).json({ error: 'Error al actualizar el grado' });
  }
};

// Eliminar un grado
exports.deleteGrade = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si hay estudiantes asociados
    const checkStudentsQuery = 'SELECT * FROM students WHERE grade_id = ?';
    const [students] = await db.query(checkStudentsQuery, [id]);
    
    if (students.length > 0)
      return res.status(400).json({ error: 'No se puede eliminar este grado porque tiene estudiantes asociados' });
    
    const deleteQuery = 'DELETE FROM grades WHERE id = ?';
    const [results] = await db.query(deleteQuery, [id]);
    
    if (results.affectedRows === 0)
      return res.status(404).json({ error: 'Grado no encontrado' });
    
    res.status(200).json({ message: 'Grado eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar el grado:', error);
    res.status(500).json({ error: 'Error al eliminar el grado' });
  }
};

// Asignar un docente a un grado
exports.assignTeacher = async (req, res) => {
  try {
    console.log('Datos recibidos en la asignación:', req.body);
    
    const { gradeId, teacherId } = req.body;
    
    if (!gradeId) {
      return res.status(400).json({ error: 'ID de grado requerido' });
    }
    
    // Verificar si el grado existe antes de intentar actualizar
    const [gradoExistente] = await db.query('SELECT * FROM grades WHERE id = ?', [gradeId]);
    if (gradoExistente.length === 0) {
      return res.status(404).json({ error: 'Grado no encontrado', gradeId: gradeId });
    }
    
    console.log(`Asignando docente ${teacherId} al grado ${gradeId}`);
    
    const query = 'UPDATE grades SET teacher_id = ? WHERE id = ?';
    const [results] = await db.query(query, [teacherId || null, gradeId]);
    
    console.log('Resultado de la actualización:', results);
    
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'No se pudo actualizar el grado' });
    }
    
    res.json({ message: 'Docente asignado exitosamente' });
  } catch (err) {
    console.error('Error al asignar docente:', err);
    res.status(500).json({ error: 'Error interno: ' + err.message });
  }
};