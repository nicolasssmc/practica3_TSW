import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'data.json');

export const ROL = {
  ADMIN: "ADMIN",
  CLIENTE: "CLIENTE",
};

class Identificable {
  _id;
  assignId() {
    this._id = Libreria.genId();
  }
}

export class Libreria {
  libros = [];
  usuarios = [];
  facturas = [];
  static lastId = 0;
  static lastFacturaNumero = 0;

  //AÑADIDO

  constructor() {
    this.loadState();
  }
  saveState() {
    try {
      const data = {
        libros: this.libros,
        usuarios: this.usuarios,
        facturas: this.facturas,
        lastId: Libreria.lastId,
        lastFacturaNumero: Libreria.lastFacturaNumero,
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error("Error guardando estado:", e);
    }
  }
  loadState() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const data = JSON.parse(raw);
        
        if (Array.isArray(data.libros)) this.libros = data.libros;
        if (Array.isArray(data.usuarios)) this.usuarios = data.usuarios;
        if (Array.isArray(data.facturas)) this.facturas = data.facturas;
        if (typeof data.lastId === 'number') Libreria.lastId = data.lastId;
        if (typeof data.lastFacturaNumero === 'number') Libreria.lastFacturaNumero = data.lastFacturaNumero;
      }
    } catch (e) {
      console.error("Error cargando estado:", e);
    }
  }

  static genId() {
    return ++this.lastId;
  }

  static genNumeroFactura() {
    // Simplificamos para servidor, ya guardamos lastFacturaNumero en el JSON general
    return ++this.lastFacturaNumero;
  }

  // CLEANUP: Métodos de reseteo eliminados
  reset() {
    this.libros = [];
    this.usuarios = [];
    this.facturas = [];
    Libreria.lastId = 0;             // <--- ESTO ES LA CLAVE
    Libreria.lastFacturaNumero = 0;  // <--- ESTO TAMBIÉN
    this.saveState();
  }

  /**
   * Libros
   */

  getLibros() {
    return this.libros;
  }

  addLibro(obj) {
    if (!obj.isbn) throw new Error('El libro no tiene ISBN');
    if (this.getLibroPorIsbn(obj.isbn)) throw new Error(`El ISBN ${obj.isbn} ya existe`)
    let libro = new Libro();
    Object.assign(libro, obj);
    libro.assignId();
    this.libros.push(libro);
    this.saveState();
    return libro;
  }

  getLibroPorId(id) {
    return this.libros.find((v) => v._id == id);
  }

  getLibroPorIsbn(isbn) {
    return this.libros.find((v) => v.isbn == isbn);
  }

  getLibroPorTitulo(titulo) {
    titulo = titulo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.libros.find(
      (v) => !!v.titulo.match(new RegExp(titulo, 'i'))
    );
  }

  removeLibro(id) {
    let libro = this.getLibroPorId(id);
    if (!libro) throw new Error('Libro no encontrado');
    else this.libros = this.libros.filter(l => l._id != id);
    this.saveState();
    return libro;
  }


  updateLibro(obj) {
    let libro = this.getLibroPorId(obj._id);
    Object.assign(libro, obj);
    this.saveState();
    return libro;
  }

  // Reemplaza todos los libros (los objetos no tienen _id, la app los asigna)
  setLibros(array) {
    if (!Array.isArray(array)) throw new Error('Se esperaba un array');
    this.libros = [];
    array.forEach(l => this.addLibro(l));
    this.saveState();
    return this.libros;
  }

  // Elimina todos los libros
  removeLibros() {
    const old = this.libros;
    this.libros = [];
    this.saveState();
    return old;
  }

  /**
   * Usuario
   */

  addUsuario(obj) {
    if (obj.rol == ROL.CLIENTE)
      return this.addCliente(obj);
    else if (obj.rol == ROL.ADMIN)
      return this.addAdmin(obj);
    else throw new Error('Rol desconocido');
  }

  addCliente(obj) {
    let cliente = this.getClientePorEmail(obj.email);
    if (cliente) throw new Error('Correo electrónico registrado');
    cliente = new Cliente();
    Object.assign(cliente, obj);
    cliente.assignId();
    this.usuarios.push(cliente);
    this.saveState();
    return cliente;
  }

  addAdmin(obj) {
    let admin = new Administrador();
    Object.assign(admin, obj)
    admin.assignId();
    this.usuarios.push(admin);
    this.saveState();
    return admin;
  }

  getClientes() {
    return this.usuarios.filter((u) => u.rol == ROL.CLIENTE);
  }

  getAdmins() {
    return this.usuarios.filter((u) => u.rol == ROL.ADMIN);
  }

  getUsuarioPorId(_id) {
    return this.usuarios.find((u) => u._id == _id);
  }

  getUsuarioPorEmail(email) {
    return this.usuarios.find((u) => u.email == email);
  }

  getUsuarioPorDni(dni) {
    return this.usuarios.find((u) => u.dni == dni);
  }

  updateUsuario(obj) {
    let usuario = this.getUsuarioPorId(obj._id);
    if (!usuario) throw new Error("Usuario no encontrado");
    usuario.dni = obj.dni || usuario.dni;
    usuario.nombre = obj.nombre || usuario.nombre;
    usuario.apellidos = obj.apellidos || usuario.apellidos;
    usuario.direccion = obj.direccion || usuario.direccion;
    usuario.email = obj.email || usuario.email;
    if (obj.password) {
      usuario.password = obj.password;
    }
    this.saveState();
    return usuario;
  }

  // Cliente específico por DNI
  getClientePorDni(dni) {
    return this.usuarios.find(u => u.rol == ROL.CLIENTE && u.dni == dni);
  }

  // Reemplaza todos los clientes (objetos sin _id)
  setClientes(array) {
    if (!Array.isArray(array)) throw new Error('Se esperaba un array');
    // Mantener administradores, reemplazar clientes
    this.usuarios = this.usuarios.filter(u => u.rol == ROL.ADMIN);
    array.forEach(c => this.addCliente(c));
    this.saveState();
    return this.getClientes();
  }

  // Elimina todos los clientes
  removeClientes() {
    const old = this.getClientes();
    this.usuarios = this.usuarios.filter(u => u.rol == ROL.ADMIN);
    this.saveState();
    return old;
  }

  

  // Admin helpers (nombres pedidos)
  getAdminPorEmail(email) {
    return this.getAdministradorPorEmail(email);
  }

  getAdminPorId(id) {
    return this.usuarios.find(u => u.rol == ROL.ADMIN && u._id == id);
  }

  getAdminPorDni(dni) {
    return this.usuarios.find(u => u.rol == ROL.ADMIN && u.dni == dni);
  }

  // Reemplaza administradores (objetos sin _id)
  setAdmins(array) {
    if (!Array.isArray(array)) throw new Error('Se esperaba un array');
    // Mantener clientes, reemplazar administradores
    this.usuarios = this.usuarios.filter(u => u.rol == ROL.CLIENTE);
    array.forEach(a => this.addAdmin(a));
    this.saveState();
    return this.getAdmins();
  }

  // Elimina todos los administradores
  removeAdmins() {
    const old = this.getAdmins();
    this.usuarios = this.usuarios.filter(u => u.rol == ROL.CLIENTE);
    this.saveState();
    return old;
  }

  // Actualizar cliente (asegura rol)
  updateCliente(obj) {
    let cliente = this.getClientePorId(obj._id);
    if (!cliente) throw new Error('Cliente no encontrado');
    return this.updateUsuario(obj);
  }

  // Actualizar administrador (asegura rol)
  updateAdmin(obj) {
    let admin = this.getAdminPorId(obj._id);
    if (!admin) throw new Error('Administrador no encontrado');
    return this.updateUsuario(obj);
  }

  // Eliminar cliente por id
  removeCliente(id) {
    let cliente = this.getClientePorId(id);
    if (!cliente) throw new Error('Cliente no encontrado');
    this.usuarios = this.usuarios.filter(u => !(u.rol == ROL.CLIENTE && u._id == id));
    this.saveState();
    return cliente;
  }

  // Eliminar admin por id
  removeAdmin(id) {
    let admin = this.getAdminPorId(id);
    if (!admin) throw new Error('Administrador no encontrado');
    this.usuarios = this.usuarios.filter(u => !(u.rol == ROL.ADMIN && u._id == id));
    this.saveState();
    return admin;
  }

  // Facturas: reemplazar y eliminar colecciones
  setFacturas(array) {
    if (!Array.isArray(array)) throw new Error('Se esperaba un array');
    this.facturas = [];
    array.forEach(f => {
      let factura = new Factura();
      // Copiar propiedades excepto items para procesar correctamente
      const items = Array.isArray(f.items) ? f.items : [];
      Object.assign(factura, f);
      factura.assignId();
      factura.genNumero();
      factura.items = [];
      items.forEach(it => factura.addItem(it));
      this.facturas.push(factura);
    });
    this.saveState();
    return this.getFacturas();
  }

  removeFacturas() {
    const old = this.facturas;
    this.facturas = [];
    this.saveState();
    return old;
  }

  getClientePorEmail(email) {
    return this.usuarios.find(u => u.rol == ROL.CLIENTE && u.email == email);
  }

  getClientePorId(id) {
    return this.usuarios.find(u => u.rol == ROL.CLIENTE && u._id == id);
  }

  getAdministradorPorEmail(email) {
    return this.usuarios.find(u => u.rol == ROL.ADMIN && u.email == email);
  }

  autenticar(obj) {
    let email = obj.email;
    let password = obj.password;
    let usuario;

    if (obj.rol == ROL.CLIENTE) usuario = this.getClientePorEmail(email);
    else if (obj.rol == ROL.ADMIN) usuario = this.getAdministradorPorEmail(email);
    else throw new Error('Rol no encontrado');

    if (!usuario) throw new Error('Usuario no encontrado');
    
    // Verificación defensiva: si el método verificar no existe, comparar directamente
    const passwordValido = typeof usuario.verificar === 'function' 
      ? usuario.verificar(password) 
      : usuario.password === password;
    
    if (passwordValido) return usuario;
    else throw new Error('Error en la contraseña');
  }

  addClienteCarroItem(id, item) {
    item.libro = this.getLibroPorId(item.libro);
    item = this.getClientePorId(id).addCarroItem(item);
    this.saveState();
    return item;
  }

  setClienteCarroItemCantidad(id, index, cantidad) {
    let cliente = this.getClientePorId(id);
    const res = cliente.setCarroItemCantidad(index, cantidad);
    this.saveState();
    return res;
  }

  getCarroCliente(id) {
    return this.getClientePorId(id).carro;
  }

  /**
   * Factura
   */

  getFacturas() {
    return this.facturas;
  }

  getFacturaPorId(id) {
    return this.facturas.find((f) => f._id == id);
  }

  getFacturaPorNumero(numero) {
    return this.facturas.find((f) => f.numero == numero);
  }

  getFacturasPorCliente(clienteId) {
    return this.facturas.filter((f) => f.cliente && f.cliente._id == clienteId);
  }

  facturarCompraCliente(obj) {
    if (!obj.cliente) throw new Error('Cliente no definido');
    let cliente = this.getClientePorId(obj.cliente);
    if (cliente.getCarro().items.length < 1) throw new Error('No hay que comprar');

    for (const item of cliente.getCarro().items) {
      if (item.libro.stock < item.cantidad) {
        throw new Error(`Stock insuficiente para "${item.libro.titulo}". Solo quedan ${item.libro.stock}.`);
      }
    }
    // Actualiza stock - buscar el libro real en la librería
    cliente.getCarro().items.forEach(item => {
      let libroReal = this.getLibroPorId(item.libro._id);
      if (libroReal) {
        libroReal.decStockN(item.cantidad);
      }
    });

    let factura = new Factura();
    Object.assign(factura, obj)
    factura.assignId();
    factura.genNumero();
    factura.cliente = new Cliente();
    Object.assign(factura.cliente, cliente);
    delete factura.cliente.carro;
    Object.assign(factura, cliente.carro);
    cliente.getCarro().removeItems();
    this.facturas.push(factura);
    this.saveState();
    return factura;
  }

  removeFactura(id) {
    let factura = this.getFacturaPorId(id);
    if (!factura) throw new Error('Factura no encontrada');
    this.facturas = this.facturas.filter(f => f._id != id);
    this.saveState();
    return factura;
  }
}

class Libro extends Identificable {
  isbn;
  titulo;
  autores;
  portada;
  resumen;
  stock;
  precio;
  constructor() {
    super();
  }

  incStockN(n) {
    this.stock = this.stock + n;
  }

  decStockN(n) {
    this.stock = this.stock - n;
  }

  incPrecioP(porcentaje) {
    this.precio = this.precio * (1 + porcentaje / 100);
  }

  dexPrecioP(porcentaje) {
    this.precio = this.precio * (porcentaje / 100);
  }
}

class Usuario extends Identificable {
  dni;
  nombre;
  apellidos;
  direccion;
  rol;
  email;
  password;

  verificar(password) {
    return this.password == password;
  }
}

class Cliente extends Usuario {
  carro;
  constructor() {
    super();
    this.rol = ROL.CLIENTE;
    this.carro = new Carro();
  }


  getCarro() {
    return this.carro;
  }
  addCarroItem(item) {
    return this.carro.addItem(item);
  }
  setCarroItemCantidad(index, cantidad) {
    this.getCarro().setItemCantidad(index, cantidad);
  }
  borrarCarroItem(index) {
    this.carro.borrarItem(index);
  }

}

class Administrador extends Usuario {
  constructor() {
    super();
    this.rol = ROL.ADMIN;
  }
}

class Factura extends Identificable {
  numero;
  fecha;
  razonSocial;
  direccion;
  email;
  dni;
  items = [];
  subtotal;
  iva;
  total;
  cliente;

  genNumero() {
    this.numero = Libreria.genNumeroFactura();
  }

  addItem(obj) {
    let item = new Item();
    Object.assign(item, obj);
    this.items.push(item);
    this.calcular();
    return item;
  }

  removeItems() {
    this.items = [];
    this.calcular();
  }

  calcular() {
    this.subtotal = this.items.reduce((total, i) => total + i.total, 0);
    this.iva = this.subtotal * 0.21;
    this.total = this.subtotal + this.iva;
  }
}

class Item {
  cantidad;
  libro;
  total;
  constructor() {
    this.cantidad = 0;
  }

  calcular() {
    this.total = this.cantidad * this.libro.precio;
  }
}

class Carro {
  items;
  subtotal;
  iva;
  total;
  constructor() {
    this.items = [];
    this.subtotal = 0;
    this.iva = 0;
    this.total = 0;
  }

  addItem(obj) {
    let item = this.items.find(i => i.libro._id == obj.libro._id);
    if (!item) {
      item = new Item();
      Object.assign(item, obj);
      item.calcular();
      this.items.push(item);
    } else {
      item.cantidad = item.cantidad + obj.cantidad;
      // Calcular el total manualmente si el item no tiene el método calcular
      if (typeof item.calcular === 'function') {
        item.calcular();
      } else {
        item.total = item.cantidad * item.libro.precio;
      }
    }
    this.calcular();
    return item;
  }

  setItemCantidad(index, cantidad) {
    if (cantidad < 0) throw new Error('Cantidad inferior a 0')
    if (cantidad == 0) this.items = this.items.filter((v, i) => i != index);
    else {
      let item = this.items[index];
      item.cantidad = cantidad;
      // Calcular el total manualmente si el item no tiene el método calcular
      if (typeof item.calcular === 'function') {
        item.calcular();
      } else {
        item.total = item.cantidad * item.libro.precio;
      }
    }
    this.calcular();
  }

  removeItems() {
    this.items = [];
    this.calcular();
  }
  calcular() {
    this.subtotal = this.items.reduce((total, i) => total + i.total, 0);
    this.iva = this.subtotal * 0.21;
    this.total = this.subtotal + this.iva;
  }

}

export const model = new Libreria();