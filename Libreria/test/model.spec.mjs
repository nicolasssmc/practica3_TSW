// Node-compatible tests: import chai and the model class directly
import chai from 'chai';
import { Libreria, ROL, model as serverModel } from '../model/model.mjs';
const assert = chai.assert;

function createLibro(overrides = {}) {
  return {
    isbn: overrides.isbn ?? 'ISBN-001',
    titulo: overrides.titulo ?? 'El Quijote',
    autores: overrides.autores ?? 'Cervantes',
    portada: overrides.portada ?? '',
    resumen: overrides.resumen ?? '',
    stock: overrides.stock ?? 5,
    precio: overrides.precio ?? 100,
  };
}

function createCliente(overrides = {}) {
  return {
    dni: overrides.dni ?? '12345678',
    nombre: overrides.nombre ?? 'Ana',
    apellidos: overrides.apellidos ?? 'Pérez',
    direccion: overrides.direccion ?? 'Calle 1',
    rol: ROL.CLIENTE,
    email: overrides.email ?? 'ana@example.com',
    password: overrides.password ?? 'secret',
  };
}

function createAdmin(overrides = {}) {
  return {
    dni: overrides.dni ?? '87654321',
    nombre: overrides.nombre ?? 'Juan',
    apellidos: overrides.apellidos ?? 'García',
    direccion: overrides.direccion ?? 'Calle Admin',
    rol: ROL.ADMIN,
    email: overrides.email ?? 'admin@example.com',
    password: overrides.password ?? 'admin123',
  };
}

describe('Libreria - Pruebas', function () {
  let libreria;

  beforeEach(function () {
    // En navegador usamos localStorage real; limpiamos para aislar pruebas
    if (typeof localStorage !== 'undefined' && localStorage.clear) localStorage.clear();
    // Crear una instancia fresca por prueba
    libreria = new Libreria();
    libreria.libros = [];
    libreria.usuarios = [];
    libreria.facturas = [];
  });

  //Getters y Setters
  describe('Getters y Setters', function () {
    it('debe agregar libro y recuperarlo por id/título/isbn', function () {
      const l = libreria.addLibro(createLibro({ isbn: 'ABC', titulo: 'Aprendiendo JS' }));
      assert.equal(libreria.getLibroPorId(l._id).titulo, 'Aprendiendo JS');
      assert.equal(libreria.getLibroPorIsbn('ABC').isbn, 'ABC');
      assert.equal(libreria.getLibroPorTitulo('aprendiendo').titulo, 'Aprendiendo JS');
    });

    it('debe actualizar datos de libro', function () {
      const l = libreria.addLibro(createLibro({ titulo: 'A' }));
      const updated = libreria.updateLibro({ _id: l._id, titulo: 'B' });
      assert.equal(updated.titulo, 'B');
      assert.equal(libreria.getLibroPorId(l._id).titulo, 'B');
    });

    it('debe setear cantidad de item del carro del cliente', function () {
      const cliente = libreria.addCliente(createCliente());
      const libro = libreria.addLibro(createLibro({ precio: 10 }));
      libreria.addClienteCarroItem(cliente._id, { libro: libro._id, cantidad: 2 });
      assert.equal(libreria.getCarroCliente(cliente._id).subtotal, 20);
      libreria.setClienteCarroItemCantidad(cliente._id, 0, 5);
      assert.equal(libreria.getCarroCliente(cliente._id).subtotal, 50);
    });
  });

  // 2) Excepciones
  describe('Excepciones', function () {
    it('addLibro debe lanzar si falta ISBN', function () {
      assert.throws(() => libreria.addLibro({ titulo: 'Sin ISBN' }), /El libro no tiene ISBN/);
    });

    it('addLibro debe lanzar si ISBN ya existe', function () {
      libreria.addLibro(createLibro({ isbn: 'X' }));
      assert.throws(() => libreria.addLibro(createLibro({ isbn: 'X' })), /El ISBN X ya existe/);
    });

    it('removeLibro debe lanzar si libro no existe', function () {
      assert.throws(() => libreria.removeLibro(999), /Libro no encontrado/);
    });

    it('setItemCantidad debe lanzar si cantidad es negativa', function () {
      const cliente = libreria.addCliente(createCliente());
      const libro = libreria.addLibro(createLibro());
      libreria.addClienteCarroItem(cliente._id, { libro: libro._id, cantidad: 1 });
      assert.throws(() => libreria.setClienteCarroItemCantidad(cliente._id, 0, -1), /Cantidad inferior a 0/);
    });

    it('autenticar debe fallar con contraseña incorrecta', function () {
      const cliente = libreria.addCliente(createCliente({ email: 'a@b.com', password: '123' }));
      assert.exists(cliente);
      assert.throws(() => libreria.autenticar({ rol: ROL.CLIENTE, email: 'a@b.com', password: '000' }), /Error en la contraseña/);
    });

    it('facturarCompraCliente debe lanzar si carro está vacío', function () {
      const cliente = libreria.addCliente(createCliente());
      assert.throws(() => libreria.facturarCompraCliente({ cliente: cliente._id }), /No hay que comprar/);
    });

    it('addUsuario debe lanzar si rol desconocido', function () {
      assert.throws(() => libreria.addUsuario({ rol: 'INVITADO', email: 'x@y.com', password: 'p' }), /Rol desconocido/);
    });

    it('addCliente debe lanzar si correo electrónico ya registrado', function () {
      libreria.addCliente(createCliente({ email: 'dup@test.com' }));
      assert.throws(() => libreria.addCliente(createCliente({ email: 'dup@test.com' })), /Correo electrónico registrado/);
    });

    it('autenticar debe lanzar si usuario no encontrado', function () {
      assert.throws(() => libreria.autenticar({ rol: ROL.CLIENTE, email: 'noexiste@test.com', password: 'x' }), /Usuario no encontrado/);
    });

    it('autenticar debe lanzar si rol no encontrado', function () {
      assert.throws(() => libreria.autenticar({ rol: 'OTRO', email: 'a@b.com', password: 'x' }), /Rol no encontrado/);
    });

    it('facturarCompraCliente debe lanzar si cliente no definido', function () {
      assert.throws(() => libreria.facturarCompraCliente({ razonSocial: 'RS' }), /Cliente no definido/);
    });

    it('facturarCompraCliente debe lanzar si stock insuficiente', function () {
      const cliente = libreria.addCliente(createCliente());
      const libro = libreria.addLibro(createLibro({ stock: 2, titulo: 'Pocas Unidades' }));
      libreria.addClienteCarroItem(cliente._id, { libro: libro._id, cantidad: 5 });
      assert.throws(() => libreria.facturarCompraCliente({ cliente: cliente._id, razonSocial: 'RS' }), /Stock insuficiente/);
    });

    it('removeFactura debe lanzar si factura no encontrada', function () {
      assert.throws(() => libreria.removeFactura(9999), /Factura no encontrada/);
    });

    it('updateUsuario debe lanzar si usuario no encontrado', function () {
      assert.throws(() => libreria.updateUsuario({ _id: 9999, nombre: 'X' }), /Usuario no encontrado/);
    });
  });

  // 3) Agregar, Modificar y Eliminar
  describe('Agregar, Modificar y Eliminar', function () {
    it('CRUD de libros', function () {
      const l = libreria.addLibro(createLibro({ isbn: 'C1', titulo: 'C' }));
      assert.lengthOf(libreria.getLibros(), 1);
      libreria.updateLibro({ _id: l._id, titulo: 'C2' });
      assert.equal(libreria.getLibroPorId(l._id).titulo, 'C2');
      const removed = libreria.removeLibro(l._id);
      assert.equal(removed._id, l._id);
      assert.lengthOf(libreria.getLibros(), 0);
    });

    it('Carro: agregar, modificar cantidad y eliminar item con cantidad 0', function () {
      const cliente = libreria.addCliente(createCliente());
      const libro = libreria.addLibro(createLibro({ precio: 20 }));
      libreria.addClienteCarroItem(cliente._id, { libro: libro._id, cantidad: 2 });
      assert.lengthOf(libreria.getCarroCliente(cliente._id).items, 1);
      libreria.setClienteCarroItemCantidad(cliente._id, 0, 3);
      assert.equal(libreria.getCarroCliente(cliente._id).items[0].cantidad, 3);
      libreria.setClienteCarroItemCantidad(cliente._id, 0, 0);
      assert.lengthOf(libreria.getCarroCliente(cliente._id).items, 0);
    });

    it('Usuarios: agregar cliente y admin', function () {
      const c = libreria.addCliente(createCliente({ email: 'c@test.com' }));
      const a = libreria.addAdmin(createAdmin({ email: 'a@test.com' })); // usar addAdmin directo porque addUsuario no retorna
      assert.exists(c);
      assert.exists(a);
      const cByEmail = libreria.getClientePorEmail('c@test.com');
      const aByEmail = libreria.getAdministradorPorEmail('a@test.com');
      assert.exists(cByEmail);
      assert.exists(aByEmail);
      assert.equal(aByEmail.rol, ROL.ADMIN);
    });

    it('Usuarios: modificar nombre y contraseña', function () {
      const c = libreria.addCliente(createCliente({ password: 'old-pass', nombre: 'Ana' }));
      const updated = libreria.updateUsuario({ _id: c._id, nombre: 'Ana María', password: 'new-pass' });
      assert.equal(updated.nombre, 'Ana María');
      // usar método verificar del modelo para no depender de autenticar
      assert.isTrue(updated.verificar('new-pass'));
      assert.isFalse(updated.verificar('old-pass'));
    });

    it('CRUD Usuarios - agregar, obtener, actualizar y eliminar cliente/admin', function () {
      // Agregar cliente
      const clienteData = createCliente({ email: 'crud_cliente@test.com', dni: 'C-CRUD' });
      const cliente = libreria.addCliente(clienteData);
      assert.exists(cliente);
      assert.isDefined(cliente._id);

      // Recuperar por email y por id
      const byEmail = libreria.getClientePorEmail(cliente.email);
      assert.exists(byEmail);
      assert.equal(byEmail._id, cliente._id);

      const byId = libreria.getClientePorId(cliente._id);
      assert.exists(byId);

      // Actualizar cliente
      const updated = libreria.updateUsuario({ _id: cliente._id, nombre: 'ClienteMod', password: 'passmod' });
      assert.equal(updated.nombre, 'ClienteMod');
      assert.isTrue(updated.verificar('passmod'));

      // Eliminar cliente
      const removedCliente = libreria.removeCliente(cliente._id);
      assert.equal(removedCliente._id, cliente._id);
      assert.isUndefined(libreria.getClientePorId(cliente._id));

      // Agregar administrador
      const adminData = createAdmin({ email: 'crud_admin@test.com', dni: 'A-CRUD' });
      const admin = libreria.addAdmin(adminData);
      assert.exists(admin);
      assert.isDefined(admin._id);

      // Recuperar admin por email
      const adminByEmail = libreria.getAdministradorPorEmail(admin.email);
      assert.exists(adminByEmail);
      assert.equal(adminByEmail._id, admin._id);

      // Actualizar admin
      const adminUpdated = libreria.updateUsuario({ _id: admin._id, nombre: 'AdminMod' });
      assert.equal(adminUpdated.nombre, 'AdminMod');

      // Eliminar admin
      const removedAdmin = libreria.removeAdmin(admin._id);
      assert.equal(removedAdmin._id, admin._id);
      // getAdminPorId returns undefined if not found
      const checkAdmin = libreria.getAdminPorId(admin._id);
      assert.isUndefined(checkAdmin);
    });
  });

  // 4) Cálculos
  describe('Cálculos', function () {
    it('Carro calcula subtotal, iva y total', function () {
      const cliente = libreria.addCliente(createCliente());
      const l1 = libreria.addLibro(createLibro({ isbn: 'A1', precio: 10 }));
      const l2 = libreria.addLibro(createLibro({ isbn: 'A2', precio: 5 }));
      libreria.addClienteCarroItem(cliente._id, { libro: l1._id, cantidad: 3 }); // 30
      libreria.addClienteCarroItem(cliente._id, { libro: l2._id, cantidad: 2 }); // 10
      const carro = libreria.getCarroCliente(cliente._id);
      assert.equal(carro.subtotal, 40);
      assert.approximately(carro.iva, 8.4, 0.0001); // 21%
      assert.approximately(carro.total, 48.4, 0.0001);
    });

    it('Factura calcula y genera número, y vacía carro al facturar', function () {
      const cliente = libreria.addCliente(createCliente());
      const libro = libreria.addLibro(createLibro({ precio: 50 }));
      libreria.addClienteCarroItem(cliente._id, { libro: libro._id, cantidad: 2 }); // 100
      const factura = libreria.facturarCompraCliente({ cliente: cliente._id, razonSocial: 'RS' });
      assert.isNumber(factura.numero);
      assert.equal(factura.subtotal, 100);
      assert.approximately(factura.iva, 21, 0.0001);
      assert.approximately(factura.total, 121, 0.0001);
      // Carro vacío después de facturar
      assert.lengthOf(libreria.getCarroCliente(cliente._id).items, 0);
    });
  });
});

// Cleanup persistent data created by tests
after(function () {
  try {
    serverModel.reset();
    console.log('model.spec cleanup: persistent data reset');
  } catch (e) {
    console.error('Error during model.spec cleanup:', e);
  }
});
