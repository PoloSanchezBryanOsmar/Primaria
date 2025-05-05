const db = require('../config/db');

// Obtener todos los grados
exports.getGrades = async (req, res) => {
  try {
    const query = 'SELECT * FROM grades';
    const [results] = await db.query(query);
    res.status(200).json(results);
  } catch (error) {
    console.error('Error al obtener los grados:', error);
    res.status(500).json({ error: 'Error al obtener los grados' });
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
    const { name, level } = req.body;
    const query = 'UPDATE grades SET name = ?, level = ? WHERE id = ?';
    const [results] = await db.query(query, [name, level, id]);
    
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
      const checkGroupsQuery = 'SELECT * FROM `groups` WHERE grade_id = ?';
      const [groups] = await db.query(checkGroupsQuery, [id]);
      
      if (groups.length > 0) 
        return res.status(400).json({ error: 'No se puede eliminar este grado porque tiene grupos asociados' });
      
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