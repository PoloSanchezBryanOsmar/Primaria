const db = require('../config/db');

// Asignar un docente a un grupo
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