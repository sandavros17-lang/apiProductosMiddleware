import express, { Request, Response, NextFunction } from 'express';

const app = express();
const PORT = 3000;

// Middleware indispensable para procesar los cuerpos en formato JSON
app.use(express.json());

// Interfaz Producto ----------------------------------------
export interface Producto {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  activo: boolean;
}

// Arreglo de productos para base de datos-----------------------
let productos: Producto[] = [
  { id: 1, nombre: 'Laptop Gamer', precio: 3500000, stock: 5, activo: true },
  { id: 2, nombre: 'Mouse Inalámbrico', precio: 80000, stock: 20, activo: true },
  { id: 3, nombre: 'Teclado Mecánico ', precio: 250000, stock: 15, activo: true },
  { id: 4, nombre: 'Monitor 24" Full HD', precio: 750000, stock: 8, activo: true },
  { id: 5, nombre: 'Auriculares Gaming', precio: 180000, stock: 12, activo: true },
  { id: 6, nombre: 'Silla Ergonómica Oficina', precio: 950000, stock: 4, activo: true },
  { id: 7, nombre: 'Disco Sólido SSD 1TB', precio: 320000, stock: 25, activo: true },
  { id: 8, nombre: 'Webcam 1080p', precio: 150000, stock: 10, activo: true },
  { id: 9, nombre: 'Hub USB-C Multipuertos', precio: 120000, stock: 30, activo: true }
];

//  Middleware validarProducto (Tarea 1)
export const validarProducto = (req: Request, res: Response, next: NextFunction): void => {
  const { nombre, precio } = req.body;

  if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
    res.status(400).json({ error: 'El nombre es obligatorio y debe ser texto.' });
    return;
  }
  
  if (typeof precio !== 'number' || precio <= 0) {
    res.status(400).json({ error: 'El precio debe ser un número mayor a 0.' });
    return;
  }

  next();
};


// Middleware de Control de Roles (tarea 2
export const verificarRol = (rolMinimo: 'MODERADOR' | 'ADMIN') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const rol = req.headers['x-rol'];

    // Si se exige ADMIN y el rol no coincide
    if (!rol || (rolMinimo === 'ADMIN' && rol !== 'ADMIN')) {
      res.status(403).json({ error: 'Acceso denegado. Se requiere rol ADMIN.' });
      return;
    }

    // Si se exige MODERADOR y no es ni MODERADOR ni ADMIN
    if (rolMinimo === 'MODERADOR' && rol !== 'MODERADOR' && rol !== 'ADMIN') {
      res.status(403).json({ error: 'Acceso denegado. Se requiere rol MODERADOR o ADMIN.' });
      return;
    }

    next();
  };
};


// 3. Endpoints original--------------------------------------------------

app.get('/api/productos', (req: Request, res: Response) => {
  res.json(productos);
});

// Endpoint  protegido con el middleware validarProducto--------------------------------

app.post('/api/productos', validarProducto, (req: Request, res: Response) => {
  const nuevoProducto: Producto = {
    id: productos.length > 0 ? productos[productos.length - 1].id + 1 : 1,
    nombre: req.body.nombre,
    precio: req.body.precio,
    stock: req.body.stock ?? 0,
    activo: req.body.activo ?? true
  };

  productos.push(nuevoProducto);
  res.status(201).json({
    mensaje: 'Producto creado exitosamente',
    producto: nuevoProducto
  });
});

// Endpoint Patch Soft Delete solo para MODERADOR o ADMIN
app.patch('/api/productos/soft/:id', verificarRol('MODERADOR'), (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const producto = productos.find(p => p.id === id);

  if (!producto) {
    res.status(404).json({ error: 'Producto no encontrado.' });
    return;
  }

  producto.activo = false;
  res.json({ mensaje: 'Producto desactivado (Soft Delete exitoso)', producto });
});

// Endpoint Delete  Hard Delete solo para ADMIN
app.delete('/api/productos/hard/:id', verificarRol('ADMIN'), (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const index = productos.findIndex(p => p.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'Producto no encontrado.' });
    return;
  }

  productos.splice(index, 1);
  res.json({ mensaje: 'Producto eliminado definitivamente (Hard Delete exitoso)' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});