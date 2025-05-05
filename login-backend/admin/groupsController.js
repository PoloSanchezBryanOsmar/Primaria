const db = require('../config/db');

// Obtener todos los grupos
exports.getGroups = async (req, res) => {
  try {
    const query = `
      SELECT 
        g.id, 
        g.name AS group_name, 
        g.grade_id,
        g.teacher_id,
        gr.name AS grade_name, 
        t.name AS teacher_name
      FROM \`groups\` g
      LEFT JOIN grades gr ON g.grade_id = gr.id
      LEFT JOIN teachers t ON g.teacher_id = t.id
    `;
    const [results] = await db.query(query);
    res.status(200).json(results);
  } catch (err) {
    console.error('Error al obtener los grupos:', err);
    res.status(500).json({ error: 'Error al obtener los grupos' });
  }
};
// Crear un nuevo grupo
exports.createGroup = async (req, res) => {
    try {
      const { name, gradeId, teacherId } = req.body;
      // Validar datos de entrada
      if (!name || !gradeId) {
        return res.status(400).json({ error: 'Nombre y grado son requeridos' });
      }
      
      const query = 'INSERT INTO `groups` (name, grade_id, teacher_id) VALUES (?, ?, ?)';
      const [results] = await db.query(query, [name, gradeId, teacherId || null]);
      res.status(201).json({ message: 'Grupo creado exitosamente', id: results.insertId });
    } catch (err) {
      console.error('Error al crear el grupo:', err);
      res.status(500).json({ error: 'Error al crear el grupo' });
    }
  };
  
// Actualizar un grupo existente
exports.updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, gradeId, teacherId } = req.body;
    const query = 'UPDATE `groups` SET name = ?, grade_id = ?, teacher_id = ? WHERE id = ?';
    const [results] = await db.query(query, [name, gradeId, teacherId || null, id]);
    
    if (results.affectedRows === 0) 
      return res.status(404).json({ error: 'Grupo no encontrado' });
    
    res.status(200).json({ message: 'Grupo actualizado exitosamente' });
  } catch (err) {
    console.error('Error al actualizar el grupo:', err);
    res.status(500).json({ error: 'Error al actualizar el grupo' });
  }
};

// Eliminar un grupo
exports.deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const query = 'DELETE FROM `groups` WHERE id = ?';
    const [results] = await db.query(query, [id]);
    
    if (results.affectedRows === 0) 
      return res.status(404).json({ error: 'Grupo no encontrado' });
    
    res.status(200).json({ message: 'Grupo eliminado exitosamente' });
  } catch (err) {
    console.error('Error al eliminar el grupo:', err);
    res.status(500).json({ error: 'Error al eliminar el grupo' });
  }
};