const db = require('../config/db');

// Obtener todos los docentes
exports.getTeachers = async (req, res) => {
  try {
    const query = 'SELECT * FROM teachers';
    const [results] = await db.query(query);
    res.status(200).json(results);
  } catch (err) {
    console.error('Error al obtener los docentes:', err);
    res.status(500).json({ error: 'Error al obtener los docentes' });
  }
};

// Crear un nuevo docente y su cuenta de usuario
exports.createTeacher = async (req, res) => {
  try {
    const { name, email } = req.body;
    
    // Validar datos de entrada
    if (!name || !email) {
      return res.status(400).json({ error: 'Nombre y email son requeridos' });
    }
    
    // Insertar en teachers
    const teacherQuery = 'INSERT INTO teachers (name, email) VALUES (?, ?)';
    const [teacherResult] = await db.query(teacherQuery, [name, email]);
    
    // Insertar en users con contraseña predeterminada y tipo "docente"
    const userQuery = `
      INSERT INTO users (username, password, name, user_type)
      VALUES (?, ?, ?, 'docente')
    `;
    await db.query(userQuery, [name, '123456', name]); // Contraseña temporal
    
    res.status(201).json({ message: 'Docente creado exitosamente', id: teacherResult.insertId });
  } catch (err) {
    console.error('Error al crear el docente:', err);
    res.status(500).json({ error: 'Error al crear el docente' });
  }
};

// Actualizar un docente existente
exports.updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;
    
    const query = 'UPDATE teachers SET name = ?, email = ? WHERE id = ?';
    const [results] = await db.query(query, [name, email, id]);
    
    if (results.affectedRows === 0)
      return res.status(404).json({ error: 'Docente no encontrado' });
    
    res.status(200).json({ message: 'Docente actualizado exitosamente' });
  } catch (err) {
    console.error('Error al actualizar el docente:', err);
    res.status(500).json({ error: 'Error al actualizar el docente' });
  }
};

// Eliminar un docente
exports.deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si el docente está asignado a algún grado
    const checkGradesQuery = 'SELECT * FROM grades WHERE teacher_id = ?';
    const [grades] = await db.query(checkGradesQuery, [id]);
    
    if (grades.length > 0)
      return res.status(400).json({ error: 'No se puede eliminar este docente porque está asignado a grados' });
    
    const deleteQuery = 'DELETE FROM teachers WHERE id = ?';
    const [results] = await db.query(deleteQuery, [id]);
    
    if (results.affectedRows === 0)
      return res.status(404).json({ error: 'Docente no encontrado' });
    
    res.status(200).json({ message: 'Docente eliminado exitosamente' });
  } catch (err) {
    console.error('Error al eliminar el docente:', err);
    res.status(500).json({ error: 'Error al eliminar el docente' });
  }
};

exports.getTeacherStats = async (req, res) => {
  try {
    const totalQuery = 'SELECT COUNT(*) as total FROM teachers';
    const [totalResult] = await db.query(totalQuery);
    const lastMonthQuery = `
      SELECT COUNT(*) as total 
      FROM teachers 
      WHERE created_at < DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)
    `;
    const [lastMonthResult] = await db.query(lastMonthQuery);
    
    const currentTotal = totalResult[0].total;
    const lastMonthTotal = lastMonthResult[0].total;
    
    let percentChange = 0;
    if (lastMonthTotal > 0) {
      percentChange = Math.round(((currentTotal - lastMonthTotal) / lastMonthTotal) * 100);
    }
    
    res.status(200).json({
      total: currentTotal,
      change: percentChange
    });
  } catch (err) {
    console.error('Error al obtener estadísticas de docentes:', err);
    res.status(500).json({ error: 'Error al obtener estadísticas de docentes' });
  }
};
