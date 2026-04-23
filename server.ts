import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import { fileURLToPath } from "url";

const getDbFile = () => {
  const localPath = path.join(process.cwd(), "db.json");
  try {
    if (fs.existsSync(localPath)) {
      fs.accessSync(localPath, fs.constants.W_OK);
      return localPath;
    }
    // Try to create it to check writability
    fs.writeFileSync(localPath, JSON.stringify(initialData, null, 2));
    return localPath;
  } catch (err) {
    console.warn("Root directory not writable, using /tmp/db.json");
    return path.join("/tmp", "db.json");
  }
};

const DB_FILE = getDbFile();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "dimension-secret-key-123";

// Initial Database Structure
const initialData = {
  users: [
    {
      id: "admin-id",
      username: "RafaelGtz",
      password: bcrypt.hashSync("36312120", 10),
      role: "admin",
      expiryDate: null,
    }
  ],
  categories: [
    { id: "cat-1", name: "Conhecimento" },
    { id: "cat-2", name: "Geometria" }
  ],
  posts: [
    {
      id: "1",
      title: "O Despertar da Consciência Dimensional",
      content: "A jornada para o conhecimento dimensional começa com um passo interno. Muitos buscam fora o que está guardado nas camadas mais profundas da percepção. Neste artigo, exploramos como as frequências vibracionais afetam sua realidade cotidiana e como você pode sintonizar sua vida para um propósito maior.\n\nExperimente meditações guiadas e técnicas de respiração que limpam o campo áurico e permitem que novas informações desçam para o consciente.",
      image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1000&auto=format&fit=crop",
      categoryId: "cat-1",
      createdAt: new Date().toISOString(),
    },
    {
      id: "2",
      title: "Geometria Sagrada na Prática",
      content: "As formas que compõem o universo não são aleatórias. Do micro ao macro, a proporção áurea guia o crescimento e a harmonia. Entender esses padrões é entender a linguagem da criação. Aprenda a utilizar símbolos de geometria sagrada para harmonizar seu ambiente de trabalho e sono.",
      image: "https://images.unsplash.com/photo-1502134273026-acb74b635238?q=80&w=1000&auto=format&fit=crop",
      categoryId: "cat-2",
      createdAt: new Date().toISOString(),
    }
  ]
};

// Database Helpers
function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      console.log("Creating initial database...");
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
      return initialData;
    }
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading database:", error);
    return initialData; // Fallback to initial data if read fails
  }
}

function writeDB(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error writing to database:", error);
    // In ephemeral file systems (like Cloud Run), this might fail.
    // We log it but the app might lose state on restart.
  }
}

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Request Logging
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // Health and Debug
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      time: new Date().toISOString(),
      dbLocation: DB_FILE,
      env: process.env.NODE_ENV
    });
  });

  // --- Auth Middleware ---
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: "Acesso negado" });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ message: "Token inválido" });
      req.user = user;
      next();
    });
  };

  // --- API Routes ---

  // Login
  app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    const db = readDB();
    const user = db.users.find((u: any) => u.username === username);

    if (!user || user.status === 'pending' || user.status === 'rejected') {
      let message = "Usuário ou senha incorretos";
      if (user?.status === 'pending') {
        message = "Sua conta aguarda aprovação do Admin Supremo.";
      } else if (user?.status === 'rejected') {
        message = `Conta rejeitada por: ${user.rejectedBy || 'Administrador'}`;
      }
      return res.status(401).json({ message });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: "Usuário ou senha incorretos" });
    }

    // Check VIP expiry for regular users
    if (user.role !== 'admin' && user.expiryDate) {
      if (new Date(user.expiryDate) < new Date()) {
        return res.status(401).json({ message: "Seu Vip Acabou Renove!" });
      }
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  });

  // Get current user data (including expiry)
  app.get("/api/me", authenticateToken, (req: any, res) => {
    const db = readDB();
    const user = db.users.find((u: any) => u.id === req.user.id);
    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });
    
    const { password, ...safeUser } = user;
    res.json(safeUser);
  });

  // --- Posts Routes ---
  app.get("/api/posts", authenticateToken, (req, res) => {
    const db = readDB();
    res.json(db.posts.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  });

  app.post("/api/posts", authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: "Apenas administradores" });
    const { title, content, image, categoryId } = req.body;
    const db = readDB();
    const newPost = {
      id: Date.now().toString(),
      title,
      content,
      image,
      categoryId: categoryId || null,
      createdAt: new Date().toISOString()
    };
    db.posts.push(newPost);
    writeDB(db);
    res.json(newPost);
  });

  app.put("/api/posts/:id", authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: "Apenas administradores" });
    const { title, content, image, categoryId } = req.body;
    const db = readDB();
    const index = db.posts.findIndex((p: any) => p.id === req.params.id);
    if (index === -1) return res.status(404).json({ message: "Post não encontrado" });

    db.posts[index] = { ...db.posts[index], title, content, image, categoryId: categoryId || null };
    writeDB(db);
    res.json(db.posts[index]);
  });

  app.delete("/api/posts/:id", authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: "Apenas administradores" });
    const db = readDB();
    db.posts = db.posts.filter((p: any) => p.id !== req.params.id);
    writeDB(db);
    res.json({ success: true });
  });

  // --- Categories Routes ---
  app.get("/api/categories", authenticateToken, (req, res) => {
    const db = readDB();
    res.json(db.categories || []);
  });

  app.post("/api/categories", authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: "Apenas administradores" });
    const { name } = req.body;
    const db = readDB();
    if (!db.categories) db.categories = [];
    const newCategory = { id: Date.now().toString(), name };
    db.categories.push(newCategory);
    writeDB(db);
    res.json(newCategory);
  });

  app.delete("/api/categories/:id", authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: "Apenas administradores" });
    const db = readDB();
    db.categories = db.categories.filter((c: any) => c.id !== req.params.id);
    // Also remove category from posts
    db.posts = db.posts.map((p: any) => p.categoryId === req.params.id ? { ...p, categoryId: null } : p);
    writeDB(db);
    res.json({ success: true });
  });

  // --- User Management (Admin only) ---
  app.get("/api/admin/users", authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: "Apenas administradores" });
    const db = readDB();
    
    // Sort users by hierarchy: Super Admin -> Admin -> Others
    const sortedUsers = [...db.users].sort((a: any, b: any) => {
      const getRoleWeight = (u: any) => {
        if (u.username === 'RafaelGtz') return 0;
        if (u.role === 'admin') return 1;
        return 2;
      };
      return getRoleWeight(a) - getRoleWeight(b);
    });

    res.json(sortedUsers.map(({ password, ...u }: any) => u));
  });

  app.post("/api/admin/users", authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: "Apenas administradores" });
    const { username, password, expiryDate, role } = req.body;
    const db = readDB();
    
    if (db.users.some((u: any) => u.username === username)) {
      return res.status(400).json({ message: "Usuário já existe" });
    }

    const newUser = {
      id: Date.now().toString(),
      username,
      password: bcrypt.hashSync(password, 10),
      role: role || 'user',
      expiryDate: expiryDate || null,
      status: req.user.username === 'RafaelGtz' ? 'active' : 'pending',
      createdBy: req.user.username
    };
    db.users.push(newUser);
    writeDB(db);
    res.json({ id: newUser.id, username: newUser.username, expiryDate: newUser.expiryDate, status: newUser.status });
  });

  app.put("/api/admin/users/:id", authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: "Apenas administradores" });
    const { username, password, expiryDate, role, status } = req.body;
    const db = readDB();
    const index = db.users.findIndex((u: any) => u.id === req.params.id);
    if (index === -1) return res.status(404).json({ message: "Usuário não encontrado" });

    const targetUser = db.users[index];
    
    // Permission Control: Only Super Admin can EDIT users
    if (req.user.username !== 'RafaelGtz') {
      return res.status(403).json({ message: "Apenas o Administrador Supremo tem permissão para editar usuários." });
    }

    if (username) db.users[index].username = username;
    if (password && password.trim()) db.users[index].password = bcrypt.hashSync(password, 10);
    if (role && (req.user.username === 'RafaelGtz' || targetUser.role !== 'admin')) {
        db.users[index].role = role;
    }
    
    if (status && req.user.username === 'RafaelGtz') {
        db.users[index].status = status;
        if (status === 'rejected') {
          db.users[index].rejectedBy = req.user.username;
        }
    }
    
    // Only update expiryDate if it was explicitly provided in the request body
    // This prevents the approval process (which often sends partial data) from resetting the date
    if (req.body.hasOwnProperty('expiryDate')) {
        db.users[index].expiryDate = expiryDate || null;
    }

    writeDB(db);
    res.json({ success: true });
  });

  app.delete("/api/admin/users/:id", authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: "Apenas administradores" });
    const db = readDB();
    const userToDelete = db.users.find((u: any) => u.id === req.params.id);
    
    if (!userToDelete) return res.status(404).json({ message: "Usuário não encontrado" });

    // Permission Control: Only Super Admin can DELETE users
    if (req.user.username !== 'RafaelGtz') {
       return res.status(403).json({ message: "Apenas o Administrador Supremo tem permissão para excluir usuários." });
    }

    // Protect Super Admin
    if (userToDelete.username === 'RafaelGtz') {
      return res.status(403).json({ message: "O Administrador Supremo não pode ser excluído." });
    }
    
    db.users = db.users.filter((u: any) => u.id !== req.params.id);
    writeDB(db);
    res.json({ success: true });
  });

  // Catch-all for unknown API routes
  app.all("/api/*", (req: any, res: any) => {
    console.warn(`404 API Route: ${req.method} ${req.url}`);
    res.status(404).json({ message: `Rota de API não encontrada: ${req.method} ${req.url}` });
  });

  // Global Error Handler for API
  app.use("/api", (err: any, req: any, res: any, next: any) => {
    console.error("API Error:", err);
    res.status(500).json({ message: "Erro interno no servidor de API", error: err.message });
  });

  // --- Vite / Frontend Setup ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Server running at http://0.0.0.0:${PORT}`);
    console.log(`DB File Location: ${DB_FILE}`);
  });
}

startServer();
