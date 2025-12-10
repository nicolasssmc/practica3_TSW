import mongoose from 'mongoose';

// Configuración de conexión
const uri = 'mongodb://127.0.0.1/libreria';
mongoose.set('strictQuery', false);

export async function connectDB() {
  try {
    await mongoose.connect(uri);
    console.log('Conectado a MongoDB');
  } catch (err) {
    console.error('Error conectando a MongoDB', err);
  }
}

export const ROL = {
  ADMIN: "ADMIN",
  CLIENTE: "CLIENTE",
};

// --- SCHEMAS Y MODELOS DE MONGOOSE ---

// 1. Schema Libro
const libroSchema = new mongoose.Schema({
  isbn: { type: String, required: true, unique: true },
  titulo: { type: String, required: true },
  autores: { type: String },
  portada: { type: String },
  resumen: { type: String },
  stock: { type: Number, default: 0 },
  precio: { type: Number, required: true },
});
const LibroModel = mongoose.model('Libro', libroSchema);

// 2. Schema Item (para Carro y Factura)
const itemSchema = new mongoose.Schema({
  cantidad: { type: Number, default: 1 },
  libro: { type: mongoose.Schema.Types.ObjectId, ref: 'Libro' },
  total: { type: Number, default: 0 } // Se recalcula
});

// 3. Schema Carro
const carroSchema = new mongoose.Schema({
  items: [itemSchema],
  subtotal: { type: Number, default: 0 },
  iva: { type: Number, default: 0 },
  total: { type: Number, default: 0 }
});

// 4. Schema Usuario (Base)
const usuarioSchema = new mongoose.Schema({
  dni: { type: String, required: true, unique: true },
  nombre: { type: String, required: true },
  apellidos: { type: String },
  direccion: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  rol: { type: String, enum: [ROL.ADMIN, ROL.CLIENTE], required: true }
}, { discriminatorKey: 'rol' });

const UsuarioModel = mongoose.model('Usuario', usuarioSchema);

// 5. Discriminadores (Herencia en Mongoose)
const AdminModel = UsuarioModel.discriminator(ROL.ADMIN, new mongoose.Schema({}));

const ClienteModel = UsuarioModel.discriminator(ROL.CLIENTE, new mongoose.Schema({
  carro: { type: carroSchema, default: () => ({ items: [], subtotal: 0, iva: 0, total: 0 }) }
}));

// 6. Schema Factura
const facturaSchema = new mongoose.Schema({
  numero: { type: Number, unique: true },
  fecha: { type: Date, default: Date.now },
  razonSocial: String,
  direccion: String,
  email: String,
  dni: String,
  items: [itemSchema], // Copia de items
  subtotal: Number,
  iva: Number,
  total: Number,
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }
});
const FacturaModel = mongoose.model('Factura', facturaSchema);


// --- CLASE LIBRERIA (ADAPTADA A ASYNC) ---

export class Libreria {
  
  constructor() {}

  // --- LIBROS ---

  async getLibros() {
    return await LibroModel.find();
  }

  async getLibroPorId(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await LibroModel.findById(id);
  }

  async getLibroPorIsbn(isbn) {
    return await LibroModel.findOne({ isbn: isbn });
  }

  async getLibroPorTitulo(titulo) {
    return await LibroModel.find({ titulo: { $regex: titulo, $options: 'i' } });
  }

  async addLibro(obj) {
    if (obj.precio < 0) throw new Error("El precio no puede ser negativo");
    const existe = await this.getLibroPorIsbn(obj.isbn);
    if (existe) throw new Error(`El ISBN ${obj.isbn} ya existe`);
    
    const nuevoLibro = new LibroModel(obj);
    return await nuevoLibro.save();
  }

  async updateLibro(obj) {
    return await LibroModel.findByIdAndUpdate(obj._id, obj, { new: true });
  }

  async removeLibro(id) {
    return await LibroModel.findByIdAndDelete(id);
  }

  async setLibros(array) {
    await LibroModel.deleteMany({});
    return await LibroModel.insertMany(array);
  }

  async removeLibros() {
    return await LibroModel.deleteMany({});
  }

  // --- USUARIOS (CLIENTES / ADMINS) ---

  async addUsuario(obj) {
    // 1. Validar Rol
    const rolesValidos = ['CLIENTE', 'ADMIN']; 
    if (obj.rol && !rolesValidos.includes(obj.rol)) {
        throw new Error("Rol desconocido");
    }

    // 2. Validar Contraseña
    if (obj.password && obj.password.length < 4) {
        throw new Error("La contraseña es demasiado corta");
    }

    // 3. Validar duplicados
    const existe = await UsuarioModel.findOne({ email: obj.email });
    if (existe) throw new Error("El email ya está registrado");

    const nuevoUsuario = new UsuarioModel(obj);
    return await nuevoUsuario.save();
  }

  async addCliente(obj) {
    const existe = await UsuarioModel.findOne({ email: obj.email });
    if (existe) throw new Error('Correo electrónico registrado');
    
    // Validar contraseña aquí también por si acaso
    if (obj.password && obj.password.length < 4) throw new Error("La contraseña es demasiado corta");

    const cliente = new ClienteModel({ ...obj, rol: ROL.CLIENTE });
    return await cliente.save();
  }

  async addAdmin(obj) {
    const existe = await UsuarioModel.findOne({ email: obj.email });
    if (existe) throw new Error('Correo electrónico registrado');
    
    if (obj.password && obj.password.length < 4) throw new Error("La contraseña es demasiado corta");

    const admin = new AdminModel({ ...obj, rol: ROL.ADMIN });
    return await admin.save();
  }

  // --- GETTERS ESPECÍFICOS (CORREGIDOS PARA REST) ---

  async getClientes() {
    return await ClienteModel.find({ rol: ROL.CLIENTE });
  }

  async getAdmins() {
    return await AdminModel.find({ rol: ROL.ADMIN });
  }

  // ¡¡¡ NUEVOS MÉTODOS AÑADIDOS PARA ARREGLAR ERROR 500 EN FILTROS !!!
  async getClientePorDni(dni) {
    return await ClienteModel.findOne({ dni: dni, rol: ROL.CLIENTE });
  }

  async getAdminPorDni(dni) {
    return await AdminModel.findOne({ dni: dni, rol: ROL.ADMIN });
  }

  async getUsuarioPorId(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await UsuarioModel.findById(id);
  }

  async getUsuarioPorEmail(email) {
    return await UsuarioModel.findOne({ email: email });
  }

  async getClientePorEmail(email) {
    return await ClienteModel.findOne({ email: email, rol: ROL.CLIENTE });
  }

  async getAdministradorPorEmail(email) {
    return await AdminModel.findOne({ email: email, rol: ROL.ADMIN });
  }

  async updateUsuario(obj) {
    return await UsuarioModel.findByIdAndUpdate(obj._id, obj, { new: true });
  }

  // --- REMOVERS (CORREGIDOS PARA REST) ---
  // Estos faltaban y causaban el Error 500 en DELETE/PUT masivos

  async removeClientes() {
    return await UsuarioModel.deleteMany({ rol: ROL.CLIENTE });
  }

  async removeAdmins() {
    return await UsuarioModel.deleteMany({ rol: ROL.ADMIN });
  }

  async setClientes(array) {
    await UsuarioModel.deleteMany({ rol: ROL.CLIENTE });
    const clientes = array.map(c => ({ ...c, rol: ROL.CLIENTE }));
    return await ClienteModel.insertMany(clientes);
  }

  async setAdmins(array) {
    await UsuarioModel.deleteMany({ rol: ROL.ADMIN });
    const admins = array.map(a => ({ ...a, rol: ROL.ADMIN }));
    return await AdminModel.insertMany(admins);
  }

  async removeCliente(id) {
    return await ClienteModel.findByIdAndDelete(id);
  }

  async removeAdmin(id) {
    return await AdminModel.findByIdAndDelete(id);
  }

  async removeUsuario(id) {
    return await UsuarioModel.findByIdAndDelete(id);
  }

  async autenticar(obj) {
    const { email, password, rol } = obj;
    const usuario = await UsuarioModel.findOne({ email, rol });
    
    if (!usuario) throw new Error('Usuario no encontrado');
    if (usuario.password !== password) throw new Error('Error en la contraseña');
    
    return usuario;
  }

  // --- CARRO DE COMPRA ---

  async getCarroCliente(clienteId) {
    const cliente = await ClienteModel.findById(clienteId).populate('carro.items.libro');
    if (!cliente) return null;
    return cliente.carro;
  }

  async addClienteCarroItem(clienteId, itemData) {
    const cliente = await ClienteModel.findById(clienteId);
    if (!cliente) throw new Error("Cliente no encontrado");

    const libroIdBuscado = itemData.libro.toString();

    const index = cliente.carro.items.findIndex(
      (i) => i.libro.toString() === libroIdBuscado
    );

    if (index >= 0) {
      cliente.carro.items[index].cantidad += itemData.cantidad;
    } else {
      const libro = await LibroModel.findById(itemData.libro);
      if (!libro) throw new Error("Libro no encontrado");

      cliente.carro.items.push({
        libro: itemData.libro, 
        cantidad: itemData.cantidad,
        total: itemData.cantidad * libro.precio
      });
    }

    this._recalcularCarro(cliente.carro);
    await cliente.save();
    return cliente.carro;
  }

  async setClienteCarroItemCantidad(clienteId, index, cantidad) {
    if (cantidad < 0) {
      throw new Error("La cantidad no puede ser inferior a 0");
    }

    const cliente = await ClienteModel.findById(clienteId).populate('carro.items.libro');
    if (!cliente) throw new Error("Cliente no encontrado");

    const item = cliente.carro.items[index];
    if (!item) throw new Error("Item no encontrado");

    if (cantidad <= 0) {
      cliente.carro.items.splice(index, 1);
    } else {
      item.cantidad = cantidad;
      item.total = item.cantidad * item.libro.precio;
    }

    this._recalcularCarro(cliente.carro);
    return await cliente.save();
  }

  // Helper único para recalcular
  _recalcularCarro(carro) {
    carro.subtotal = carro.items.reduce((acc, item) => acc + (item.total || 0), 0);
    carro.iva = carro.subtotal * 0.21;
    carro.total = carro.subtotal + carro.iva;
  }

  // --- FACTURAS ---

  async getFacturas() {
    return await FacturaModel.find().populate('cliente').populate('items.libro');
  }

  async getFacturaPorId(id) {
    return await FacturaModel.findById(id).populate('cliente').populate('items.libro');
  }

  async getFacturasPorCliente(idCliente) {
    return await FacturaModel.find({ cliente: idCliente }).populate('cliente').populate('items.libro');
  }

  async getFacturaPorNumero(num) {
    return await FacturaModel.findOne({ numero: Number(num) }).populate('cliente').populate('items.libro');
  }

  async removeFacturas() {
    return await FacturaModel.deleteMany({});
  }

  async facturarCompraCliente(obj) {
    const cliente = await ClienteModel.findById(obj.cliente).populate('carro.items.libro');
    if (!cliente) throw new Error('Cliente no encontrado');
    if (cliente.carro.items.length === 0) throw new Error('El carro está vacío');

    // 1. Verificar Stock
    for (const item of cliente.carro.items) {
      if (item.libro.stock < item.cantidad) {
        throw new Error(`Stock insuficiente para ${item.libro.titulo}`);
      }
    }

    // 2. Descontar Stock
    for (const item of cliente.carro.items) {
      await LibroModel.findByIdAndUpdate(item.libro._id, {
        $inc: { stock: -item.cantidad }
      });
    }

    // 3. Crear Factura
    const count = await FacturaModel.countDocuments();
    const numeroFactura = count + 1;

    const nuevaFactura = new FacturaModel({
      ...obj,
      numero: numeroFactura,
      items: cliente.carro.items,
      subtotal: cliente.carro.subtotal,
      iva: cliente.carro.iva,
      total: cliente.carro.total,
      cliente: cliente._id
    });

    await nuevaFactura.save();

    // 4. Vaciar Carro
    cliente.carro.items = [];
    cliente.carro.subtotal = 0;
    cliente.carro.iva = 0;
    cliente.carro.total = 0;
    await cliente.save();

    return nuevaFactura;
  }

  // Para tests
  async reset() {
    await LibroModel.deleteMany({});
    await UsuarioModel.deleteMany({});
    await FacturaModel.deleteMany({});
    console.log("Base de datos reseteada");
  }

}

export const model = new Libreria();
export { LibroModel, ClienteModel, AdminModel, FacturaModel };