const db = require('../config/db');

// Asignar un docente a un grupo
exports.assignTeacherToGroup = async (req, res) => {
  try {
    const { groupId, teacherId } = req.body;
    const query = 'UPDATE `groups` SET teacher_id = ? WHERE id = ?';
    const [results] = await db.query(query, [teacherId, groupId]);
    
    if (results.affectedRows === 0) 
      return res.status(404).json({ error: 'Grupo no encontrado' });
    
    res.status(200).json({ message: 'Docente asignado exitosamente' });
  } catch (err) {
    console.error('Error al asignar el docente al grupo:', err);
    res.status(500).json({ error: 'Error al asignar el docente al grupo' });
  }
};