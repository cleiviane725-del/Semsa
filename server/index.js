import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Constants
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'semad-legal-system-secret-key';
const COOKIE_NAME = 'auth_token';
const ADMIN_USERNAME = 'SEMAD';
const ADMIN_PASSWORD = 'PIN25ADM';

// Initialize Express app
const app = express();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize database
const db = new Database(join(__dirname, 'database.sqlite'));

// Setup middleware
app.use(cors({
  origin: true, // Permite qualquer origem para testes em rede
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Initialize database schema
const initializeDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      number TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('Database initialized');
};

// Auth middleware
const authenticate = (req, res, next) => {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ message: 'Não autenticado' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};

// Auth routes
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '8h' });
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      maxAge: 8 * 60 * 60 * 1000,
      sameSite: 'lax',
      secure: false, // Não usar true em ambiente local
    });
    return res.status(200).json({ message: 'Login bem-sucedido' });
  }

  return res.status(401).json({ message: 'Usuário ou senha incorretos' });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.status(200).json({ message: 'Logout bem-sucedido' });
});

app.get('/api/auth/validate', authenticate, (req, res) => {
  res.status(200).json({ valid: true });
});

// Processos
app.post('/api/cases', authenticate, (req, res) => {
  const { name, number, description } = req.body;

  if (!name || !number || !description) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
  }

  try {
    const stmt = db.prepare('INSERT INTO cases (name, number, description) VALUES (?, ?, ?)');
    const result = stmt.run(name, number, description);
    return res.status(201).json({ id: result.lastInsertRowid, message: 'Processo cadastrado com sucesso' });
  } catch (error) {
    console.error('Erro no banco:', error);
    return res.status(500).json({ message: 'Erro ao salvar o processo' });
  }
});

app.get('/api/cases/search', authenticate, (req, res) => {
  const { term, type } = req.query;

  if (!term) {
    return res.status(400).json({ message: 'Termo de busca é obrigatório' });
  }

  const searchTerm = `%${term}%`;
  try {
    let stmt;
    switch (type) {
      case 'name':
        stmt = db.prepare('SELECT * FROM cases WHERE name LIKE ? ORDER BY created_at DESC');
        return res.json(stmt.all(searchTerm));
      case 'number':
        stmt = db.prepare('SELECT * FROM cases WHERE number LIKE ? ORDER BY created_at DESC');
        return res.json(stmt.all(searchTerm));
      case 'description':
        stmt = db.prepare('SELECT * FROM cases WHERE description LIKE ? ORDER BY created_at DESC');
        return res.json(stmt.all(searchTerm));
      default:
        stmt = db.prepare(`
          SELECT * FROM cases 
          WHERE name LIKE ? OR number LIKE ? OR description LIKE ?
          ORDER BY created_at DESC
        `);
        return res.json(stmt.all(searchTerm, searchTerm, searchTerm));
    }
  } catch (error) {
    console.error('Erro na busca:', error);
    return res.status(500).json({ message: 'Erro ao realizar a busca' });
  }
});

// Servir arquivos estáticos da build Vite
app.use(express.static(join(__dirname, '../dist')));

// Fallback para SPA
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../dist/index.html'));
});

// Iniciar banco e servidor
initializeDatabase();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse pela rede: http://192.168.1.104:3000`);
});
